import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { Prisma, type GenerationJob } from "@/generated/prisma/client";
import { generatedSchema } from "../tests/rules";
import { isPdf, savePdf } from "../presentations/storage";
import { downloadGammaPdf, generateQuestions, JobError, pollGamma, startGamma, verifyGammaConfig } from "./providers";

const leaseMs = 120_000;
const maxAgeMs = 45 * 60_000;
const uncertain = "Не удалось подтвердить отправку в Gamma. Проверьте историю и списания в Gamma или загрузите PDF.";

export async function enqueue(ownerId: string, requestKey: string, title: string,
  input: { type: "QUESTIONS"; sourceId: string } | { type: "GAMMA"; lessonPlan: string }) {
  const key = { ownerId, type: input.type, requestKey };
  try {
    return await db.generationJob.create({ data: { ...key, title, ...input } });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
    return db.generationJob.findUniqueOrThrow({ where: { ownerId_type_requestKey: key } });
  }
}

async function claim() {
  const token = randomUUID();
  const leaseUntil = new Date(Date.now() + leaseMs);
  const jobs = await db.$queryRaw<GenerationJob[]>`
    WITH candidate AS (
      SELECT id FROM "GenerationJob"
      WHERE status IN ('QUEUED', 'RUNNING') AND "nextRunAt" <= NOW()
        AND ("leaseUntil" IS NULL OR "leaseUntil" <= NOW())
      ORDER BY "nextRunAt", "createdAt" FOR UPDATE SKIP LOCKED LIMIT 1
    )
    UPDATE "GenerationJob" j
    SET status = 'RUNNING', "leaseToken" = ${token}, "leaseUntil" = ${leaseUntil},
        attempts = attempts + 1, "updatedAt" = NOW()
    FROM candidate WHERE j.id = candidate.id RETURNING j.*`;
  return jobs[0];
}

function held(job: GenerationJob) {
  return { id: job.id, leaseToken: job.leaseToken, leaseUntil: { gt: new Date() } };
}

async function questions(job: GenerationJob) {
  const [source, topics, eras] = await Promise.all([
    db.source.findFirst({ where: { id: job.sourceId ?? "", ownerId: job.ownerId } }),
    db.topic.findMany({ orderBy: { id: "asc" } }), db.era.findMany({ orderBy: { id: "asc" } }),
  ]);
  if (!source || !topics.length || !eras.length) throw new JobError("Источник или справочники недоступны.");
  const result = generatedSchema.safeParse(await generateQuestions(source.text, topics, eras));
  if (!result.success || result.data.questions.some((question) =>
    question.correctIndex >= question.options.length || !source.text.includes(question.excerpt)
      || !topics.some((topic) => topic.id === question.topicId) || !eras.some((era) => era.id === question.eraId)
      || new Set(question.options.map((option) => option.toLocaleLowerCase("ru"))).size !== question.options.length
  )) throw new JobError("Ответ ИИ не прошёл проверку вариантов, справочников или цитат. Источник сохранён.");

  await db.$transaction(async (tx) => {
    const test = await tx.test.create({
      data: {
        title: job.title, ownerId: job.ownerId,
        questions: { create: result.data.questions.map((question, position) => ({
          text: question.text, position, topicId: question.topicId, eraId: question.eraId,
          difficulty: question.difficulty, sourceId: source.id, excerpt: question.excerpt,
          options: { create: question.options.map((text, index) => ({
            text, position: index, correct: index === question.correctIndex,
          })) },
        })) },
      },
    });
    const resultUpdate = await tx.generationJob.updateMany({
      where: held(job), data: { testId: test.id, status: "READY", leaseToken: null, leaseUntil: null },
    });
    if (!resultUpdate.count) throw new Error("Lease lost");
  }, { timeout: 15_000 });
}

async function release(job: GenerationJob, delayMs: number, providerId?: string) {
  await db.generationJob.updateMany({
    where: held(job),
    data: { providerId, leaseToken: null, leaseUntil: null, nextRunAt: new Date(Date.now() + delayMs) },
  });
}

async function gamma(job: GenerationJob) {
  if (!job.providerId) {
    if (job.submissionAt) throw new JobError(uncertain);
    if (!job.lessonPlan) throw new JobError("План урока недоступен.");
    verifyGammaConfig();
    const marked = await db.generationJob.updateMany({
      where: held(job), data: { submissionAt: new Date() },
    });
    if (!marked.count) return;
    try {
      await release(job, 5000, await startGamma(job.lessonPlan));
    } catch {
      throw new JobError(uncertain);
    }
    return;
  }

  const result = await pollGamma(job.providerId);
  if (result.status === "failed") throw new JobError("Gamma завершила генерацию с ошибкой. Можно загрузить PDF вручную.");
  if (result.status === "pending" || !result.exportUrl) {
    await release(job, 5000);
    return;
  }
  const objectKey = job.ownerId + "/gamma/" + job.id + ".pdf";
  const bytes = await downloadGammaPdf(result.exportUrl);
  if (!isPdf(bytes)) throw new JobError("Gamma вернула некорректный PDF.");
  await savePdf(objectKey, bytes);
  await db.$transaction(async (tx) => {
    const presentation = await tx.presentation.create({
      data: { ownerId: job.ownerId, title: job.title, objectKey, origin: "GAMMA" },
    });
    const update = await tx.generationJob.updateMany({
      where: held(job), data: {
        presentationId: presentation.id, credits: result.credits?.deducted,
        status: "READY", leaseToken: null, leaseUntil: null,
      },
    });
    if (!update.count) throw new Error("Lease lost");
  });
}

export async function runNextJob() {
  const job = await claim();
  if (!job) return false;
  const expired = Date.now() - job.createdAt.getTime() > maxAgeMs;
  try {
    if (expired) throw new JobError(job.type === "GAMMA" && job.submissionAt && !job.providerId
      ? uncertain : "Истекло время обработки задания.");
    if (job.type === "QUESTIONS") await questions(job);
    else await gamma(job);
  } catch (error) {
    if (job.type === "GAMMA" && job.providerId && !(error instanceof JobError)) {
      await release(job, Math.min(60_000, 5000 * job.attempts));
    } else {
      await db.generationJob.updateMany({
        where: held(job),
        data: {
          status: "FAILED", leaseToken: null, leaseUntil: null,
          error: error instanceof JobError ? error.message : "Сервис генерации недоступен или не ответил вовремя.",
        },
      });
    }
  }
  return true;
}
