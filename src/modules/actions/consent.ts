"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/modules/access/session";
import { recordConsent } from "@/modules/consents/service";
import type { ActionState } from "./state";

export async function changeConsent(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser("PARENT");
  const parsed = z.object({
    studentId: z.string().min(1).max(128), documentId: z.uuid(), action: z.enum(["GRANTED", "REVOKED"]),
  }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Проверьте сведения о согласии." };
  const { studentId, documentId, action } = parsed.data;
  if (action === "GRANTED" && form.get("confirmed") !== "on") return { error: "Подтвердите, что прочитали текст." };
  if (!await recordConsent(user.id, studentId, documentId, action)) {
    return { error: "Согласие недоступно. Проверьте связь с учеником и обновите страницу." };
  }
  redirect("/parent/consent");
}
