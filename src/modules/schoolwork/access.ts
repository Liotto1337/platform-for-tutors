import { redirect } from "next/navigation";
import { requireUser } from "@/modules/access/session";
import { studentHasConsent } from "@/modules/consents/service";

export async function requireStudent() {
  const student = await requireUser("STUDENT");
  if (!await studentHasConsent(student.id)) redirect("/student/consent");
  return student;
}

export type ExamQuestion = { text: string; options: string[]; correct: number };

