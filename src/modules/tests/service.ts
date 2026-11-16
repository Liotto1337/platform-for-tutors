import { db } from "@/lib/db";
import { readyToReview, testSchema } from "./rules";

export async function saveTest(ownerId: string, testId: string, input: unknown) {
  const parsed = testSchema.safeParse(input);
  if (!parsed.success) return "Проверьте название, длину полей и число правильных ответов.";
  const { title, questions, revision, review } = parsed.data;
  if (review && !readyToReview(questions)) {
    return "Для проверки заполните каждый вопрос, выберите тему, эпоху и сложность. Нужны разные варианты и один правильный ответ.";
  }

  return db.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<{ revision: number }[]>`
      SELECT revision FROM "Test" WHERE id = ${testId} AND "ownerId" = ${ownerId} FOR UPDATE`;
    if (!locked.length) return "Тест недоступен.";
    if (locked[0].revision !== revision) return "Тест уже изменён. Обновите страницу перед сохранением.";

    const existing = await tx.question.findMany({ where: { testId } });
    const ids = questions.flatMap((question) => question.id ? [question.id] : []);
    const previous = new Map(existing.map((question) => [question.id, question]));
    if (new Set(ids).size !== ids.length || ids.some((id) => !previous.has(id))) {
      return "Некорректный список вопросов.";
    }

    const topics = [...new Set(questions.flatMap((question) => question.topicId ? [question.topicId] : []))];
    const eras = [...new Set(questions.flatMap((question) => question.eraId ? [question.eraId] : []))];
    if (await tx.topic.count({ where: { id: { in: topics } } }) !== topics.length
      || await tx.era.count({ where: { id: { in: eras } } }) !== eras.length) {
      return "Выберите тему и эпоху из справочников.";
    }

    await tx.question.deleteMany({ where: { testId } });
    for (const [position, question] of questions.entries()) {
      const original = question.id ? previous.get(question.id) : undefined;
      await tx.question.create({
        data: {
          id: question.id, testId, position, text: question.text, format: question.format,
          difficulty: question.difficulty, topicId: question.topicId, eraId: question.eraId,
          sourceId: original?.sourceId, excerpt: original?.excerpt,
          options: { create: question.options.map((option, index) => ({ ...option, position: index })) },
        },
      });
    }
    await tx.test.update({
      where: { id: testId },
      data: { title, revision: { increment: 1 }, status: review ? "REVIEWED" : "DRAFT", reviewedAt: review ? new Date() : null },
    });
    return null;
  });
}
