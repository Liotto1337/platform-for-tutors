"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/modules/access/session";
import { requireStudent, type ExamQuestion } from "@/modules/schoolwork/access";
import type { ActionState } from "./state";

function field(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function assign(testId: string | null, _: ActionState, form: FormData): Promise<ActionState> {
  const tutor = await requireUser("TUTOR");
  const email = field(form, "email").toLowerCase();
  const student = await db.user.findFirst({ where: { email, role: "STUDENT" }, select: { id: true } });
  if (!student) return { error: "Проверьте адрес зарегистрированного ученика." };
  const recipient = { ownerId: tutor.id, studentId: student.id };
  if (testId) {
    const test = await db.test.findFirst({ where: { id: testId, ownerId: tutor.id, status: "REVIEWED" },
      include: { questions: { orderBy: { position: "asc" }, include: { options: { orderBy: { position: "asc" } } } } } });
    if (!test?.questions.length) return { error: "Сначала проверьте тест." };
    const questions = test.questions.map(q => ({ text: q.text, options: q.options.map(o => o.text),
      correct: q.options.findIndex(o => o.correct) }));
    await db.assignment.create({ data: { ...recipient, title: test.title, prompt: "", testId, questions, total: questions.length } });
  } else {
    const title = field(form, "title"), prompt = field(form, "prompt");
    if (!title || title.length > 160 || !prompt || prompt.length > 6000 || (title + prompt).includes("\0")) {
      return { error: "Введите название до 160 символов и условие до 6000 символов." };
    }
    await db.assignment.create({ data: { ...recipient, title, prompt } });
  }
  redirect("/tutor/practice");
}

export async function submitPractice(id: string, _: ActionState, form: FormData): Promise<ActionState> {
  const student = await requireStudent();
  const where = { id, studentId: student.id, submittedAt: null, testId: null };
  const answer = field(form, "answer");
  const upload = form.get("photo");
  const file = upload instanceof File && upload.size ? upload : null;
  if (!answer && !file) return { error: "Напишите ответ или приложите фото." };
  if (answer.length > 6000 || answer.includes("\0")) return { error: "Введите текст до 6000 символов." };
  if (file && file.size > 5 * 1024 * 1024) return { error: "Выберите фото до 5 МБ." };
  const photo = file ? new Uint8Array(await file.arrayBuffer()) : null;
  let photoType: string | null = null;
  if (photo) {
    const signature = Buffer.from(photo.subarray(0, 8)).toString("hex");
    if (signature === "89504e470d0a1a0a") photoType = "image/png";
    else if (signature.startsWith("ffd8ff")) photoType = "image/jpeg";
    else return { error: "Поддерживаются фотографии JPEG и PNG." };
  }
  const result = await db.assignment.updateMany({ where, data: { answer, photo, photoType, submittedAt: new Date() } });
  if (!result.count) return { error: "Задание уже сдано или недоступно." };
  redirect("/student/practice");
}

export async function submitExam(id: string, _: ActionState, form: FormData): Promise<ActionState> {
  const student = await requireStudent();
  const where = { id, studentId: student.id, submittedAt: null, testId: { not: null } };
  const work = await db.assignment.findFirst({ where, select: { questions: true } });
  if (!work) return { error: "Тест уже сдан или недоступен." };
  const questions = work.questions as ExamQuestion[];
  let score = 0;
  for (const [i, question] of questions.entries()) {
    const answer = form.get("q" + i);
    if (!question.options.some((_, j) => String(j) === answer)) return { error: "Ответьте на каждый вопрос." };
    if (answer === String(question.correct)) score++;
  }
  const result = await db.assignment.updateMany({ where, data: { score, submittedAt: new Date() } });
  if (!result.count) return { error: "Тест уже сдан." };
  redirect("/student/study");
}

export async function recordPause(id: string) {
  const student = await requireStudent();
  await db.assignment.updateMany({ where: { id, studentId: student.id, submittedAt: null, testId: { not: null } },
    data: { pauses: { increment: 1 } } });
}

