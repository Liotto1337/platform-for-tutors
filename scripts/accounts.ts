import "dotenv/config";
import { readFile } from "node:fs/promises";
import { hashPassword } from "better-auth/crypto";
import { z } from "zod";
import { db } from "../src/lib/db";
import { consentType } from "../src/modules/consents/service";

const email = z.email().transform((value) => value.toLowerCase());
const role = z.enum(["TUTOR", "STUDENT", "PARENT"]);
const password = () => z.string().min(12).max(128).parse(process.env.OPERATOR_PASSWORD);

async function createAccount(address: string, name: string, kind: z.infer<typeof role>, secret: string, skipExisting = false) {
  const existing = await db.user.findUnique({ where: { email: address } });
  if (existing && skipExisting && existing.role === kind) return existing;
  if (existing) throw new Error("Адрес уже занят.");
  const hash = await hashPassword(secret);
  return db.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { email: address, name, role: kind } });
    await tx.account.create({ data: { userId: user.id, accountId: user.id, providerId: "credential", password: hash } });
    return user;
  });
}

async function link(guardian: string, student: string) {
  const [parent, child] = await Promise.all([
    db.user.findUnique({ where: { email: guardian } }), db.user.findUnique({ where: { email: student } }),
  ]);
  if (parent?.role !== "PARENT" || child?.role !== "STUDENT") throw new Error("Нужны аккаунты родителя и ученика.");
  await db.guardianLink.upsert({
    where: { guardianId_studentId: { guardianId: parent.id, studentId: child.id } },
    create: { guardianId: parent.id, studentId: child.id, confirmedAt: new Date() }, update: {},
  });
}

async function activateConsent(version: string, text: string, onlyIfEmpty = false) {
  await db.$transaction(async (tx) => {
    await tx.$executeRaw`LOCK TABLE "ConsentDocument" IN SHARE ROW EXCLUSIVE MODE`;
    const active = await tx.consentDocument.findFirst({ where: { active: true, type: consentType } });
    if (active && onlyIfEmpty) return;
    const previous = await tx.consentDocument.findUnique({ where: { type_version: { type: consentType, version } } });
    if (previous) {
      if (previous.id === active?.id && previous.text === text) return;
      throw new Error("Используйте новую версию документа.");
    }
    await tx.consentDocument.updateMany({ where: { type: consentType, active: true }, data: { active: false } });
    await tx.consentDocument.create({ data: { type: consentType, version, text, active: true } });
  });
}

async function seed() {
  const demoPassword = z.string().min(12).max(128).parse(process.env.PILOT_PASSWORD);
  await createAccount("tutor@example.test", "Анна Волкова", "TUTOR", demoPassword, true);
  await createAccount("student@example.test", "Миша Орлов", "STUDENT", demoPassword, true);
  await createAccount("parent@example.test", "Елена Орлова", "PARENT", demoPassword, true);
  await createAccount("tutor2@example.test", "Технический репетитор", "TUTOR", demoPassword, true);
  await link("parent@example.test", "student@example.test");
  await activateConsent("pilot-1", "Демонстрационный документ. Я, вымышленный представитель, разрешаю открыть учебный раздел вымышленному ученику в тестовом кабинете «Chronosphere». Это согласие можно отозвать в кабинете представителя.", true);
  for (const [id, name] of [["events", "События и даты"], ["people", "Исторические личности"],
    ["society", "Общество и экономика"], ["culture", "Культура"], ["government", "Государство и реформы"]]) {
    await db.topic.upsert({ where: { id }, create: { id, name }, update: {} });
  }
  for (const [id, name] of [["ancient", "Древний мир"], ["middle-ages", "Средние века"], ["early-modern", "Раннее Новое время"],
    ["modern", "Новое время"], ["contemporary", "Новейшее время"], ["general", "Несколько эпох"]]) {
    await db.era.upsert({ where: { id }, create: { id, name }, update: {} });
  }
}

async function main() {
  const [command, first, second, third] = process.argv.slice(2);
  if (command === "seed") return seed();
  if (command === "create") {
    await createAccount(email.parse(first), z.string().trim().min(1).max(160).parse(third), role.parse(second), password());
    return;
  }
  if (command === "link") return link(email.parse(first), email.parse(second));
  if (command === "consent-version") {
    const version = z.string().trim().min(1).max(80).parse(first);
    const text = z.string().trim().min(12).max(40_000).parse(await readFile(second, "utf8"));
    return activateConsent(version, text);
  }
  if (command === "reset" || command === "revoke") {
    const address = email.parse(first);
    const hash = command === "reset" ? await hashPassword(password()) : undefined;
    await db.$transaction(async (tx) => {
      const user = await tx.user.findUniqueOrThrow({ where: { email: address } });
      if (hash) await tx.account.update({
        where: { providerId_accountId: { providerId: "credential", accountId: user.id } }, data: { password: hash },
      });
      await tx.session.deleteMany({ where: { userId: user.id } });
    });
    return;
  }
  throw new Error("Команды: seed, create, link, reset, revoke, consent-version.");
}

try {
  await main();
  console.log("Операция выполнена.");
} catch (error) {
  console.error(error instanceof z.ZodError ? "Проверьте аргументы и переменные окружения."
    : error instanceof Error && !("code" in error) ? error.message : "Операция не выполнена. Проверьте подключение и параметры.");
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
