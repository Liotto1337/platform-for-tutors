import { z } from "zod";

export const sourceText = z.string().trim().min(12).max(40_000);

export async function readSource(form: FormData) {
  const file = form.get("file");
  if (!(file instanceof File) || !file.size) return sourceText.safeParse(form.get("text"));
  if (!file.name.toLowerCase().endsWith(".txt") || file.size > 160_000 || String(form.get("text") ?? "").trim()) return null;
  try {
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(await file.arrayBuffer());
    return decoded.includes("\0") ? null : sourceText.safeParse(decoded);
  } catch {
    return null;
  }
}
