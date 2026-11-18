import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireStudent, type ExamQuestion } from "@/modules/schoolwork/access";
import { Exam } from "./exam";

export default async function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireStudent();
  const { id } = await params;
  const test = await db.assignment.findFirst({ where: { id, studentId: user.id, submittedAt: null, testId: { not: null } },
    select: { title: true, questions: true } });
  if (!test) notFound();
  const questions = (test.questions as ExamQuestion[]).map(({ text, options }) => ({ text, options }));
  return <Exam id={id} title={test.title} questions={questions} />;
}

