"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/modules/access/session";
import { enqueue } from "@/modules/generation/queue";
import { isPdf, pdfMax, savePdf } from "@/modules/presentations/storage";
import { readSource } from "@/modules/sources/input";
import { titleSchema } from "@/modules/tests/rules";
import { saveTest } from "@/modules/tests/service";
import type { ActionState } from "./state";

export async function createTest(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser("TUTOR");
  const title = titleSchema.safeParse(form.get("title"));
  if (!title.success) return { error: "Введите название до 160 символов." };
  const test = await db.test.create({ data: { ownerId: user.id, title: title.data } });
  redirect("/tutor/tests/" + test.id);
}

export async function updateTest(id: string, input: unknown): Promise<ActionState> {
  const user = await requireUser("TUTOR");
  if (!z.uuid().safeParse(id).success) return { error: "Тест недоступен." };
  const error = await saveTest(user.id, id, input);
  if (error) return { error };
  redirect("/tutor/tests/" + id + "?saved=1");
}

export async function deleteTest(id: string): Promise<ActionState> {
  const user = await requireUser("TUTOR");
  if (!z.uuid().safeParse(id).success) return { error: "Тест недоступен." };
  await db.test.deleteMany({ where: { id, ownerId: user.id } });
  redirect("/tutor/tests");
}

export async function createSource(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser("TUTOR");
  const title = titleSchema.safeParse(form.get("title"));
  const text = await readSource(form);
  if (!title.success) return { error: "Введите название до 160 символов." };
  if (!text?.success || text.data.includes("\0")) {
    return { error: "Вставьте от 12 до 40 000 символов или загрузите один TXT в кодировке UTF-8." };
  }
  const source = await db.source.create({ data: { ownerId: user.id, title: title.data, text: text.data } });
  redirect("/tutor/sources/" + source.id);
}

export async function queueQuestions(sourceId: string, _: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser("TUTOR");
  const requestKey = z.uuid().safeParse(form.get("requestKey"));
  const title = titleSchema.safeParse(form.get("title"));
  if (!requestKey.success || !title.success) return { error: "Введите название до 160 символов." };
  const source = await db.source.findFirst({ where: { id: sourceId, ownerId: user.id }, select: { id: true } });
  if (!source) return { error: "Источник недоступен." };
  if (form.get("confirmed") !== "on") return { error: "Подтвердите просмотр учебного текста." };
  await enqueue(user.id, requestKey.data, title.data, { type: "QUESTIONS", sourceId: source.id });
  redirect("/tutor/tests");
}

export async function queueGamma(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser("TUTOR");
  const requestKey = z.uuid().safeParse(form.get("requestKey"));
  const title = titleSchema.safeParse(form.get("title"));
  const lessonPlan = z.string().trim().min(20).max(12_000).safeParse(form.get("lessonPlan"));
  if (!requestKey.success || !title.success || !lessonPlan.success || lessonPlan.data.includes("\0")) {
    return { error: "Укажите название до 160 символов и план урока от 20 до 12 000 символов." };
  }
  if (form.get("confirmed") !== "on") return { error: "Подтвердите просмотр плана урока." };
  if (!process.env.GAMMA_API_KEY) return { error: "Ключ Gamma не настроен. Можно загрузить готовый PDF." };
  await enqueue(user.id, requestKey.data, title.data, { type: "GAMMA", lessonPlan: lessonPlan.data });
  redirect("/tutor/presentations");
}

export async function uploadPdf(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser("TUTOR");
  const title = titleSchema.safeParse(form.get("title"));
  const file = form.get("file");
  if (!title.success) return { error: "Введите название до 160 символов." };
  if (!(file instanceof File) || !file.size || file.size > pdfMax) {
    return { error: "Выберите PDF-файл до 20 МБ." };
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isPdf(bytes)) return { error: "Файл не похож на PDF." };
  const objectKey = user.id + "/upload/" + randomUUID() + ".pdf";
  try {
    await savePdf(objectKey, bytes);
    await db.presentation.create({ data: { title: title.data, ownerId: user.id, objectKey, origin: "UPLOAD" } });
  } catch {
    return { error: "Не удалось сохранить PDF. Попробуйте позже." };
  }
  redirect("/tutor/presentations");
}
