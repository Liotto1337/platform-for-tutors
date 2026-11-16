import "dotenv/config";
import { db } from "../src/lib/db";

const samples = [
  ["Древняя Русь: первые князья", "ancient", "people"],
  ["Крещение Руси и князь Владимир", "middle-ages", "government"],
  ["Русь при Ярославе Мудром", "middle-ages", "government"],
  ["Монгольское нашествие", "middle-ages", "events"],
  ["Объединение русских земель", "middle-ages", "events"],
  ["Иван III и создание единого государства", "middle-ages", "government"],
  ["Смутное время", "early-modern", "events"],
  ["Реформы Петра I", "early-modern", "government"],
  ["Эпоха дворцовых переворотов", "early-modern", "people"],
  ["Правление Екатерины II", "early-modern", "society"],
  ["Отечественная война 1812 года", "modern", "events"],
  ["Декабристы и их восстание", "modern", "people"],
  ["Великие реформы Александра II", "modern", "government"],
  ["Культура России XIX века", "modern", "culture"],
  ["Революция 1905 года", "modern", "events"],
  ["Россия в Первой мировой войне", "modern", "events"],
  ["Революции 1917 года", "contemporary", "events"],
  ["СССР в годы индустриализации", "contemporary", "society"],
  ["Великая Отечественная война", "contemporary", "events"],
  ["Россия на рубеже XX–XXI веков", "contemporary", "government"],
] as const;

async function main() {
  const owner = await db.user.findUnique({ where: { email: "tutor@example.test" } });
  if (!owner || owner.role !== "TUTOR") {
    throw new Error("Сначала создайте демо-аккаунты командой npm run db:seed.");
  }

  const topics = await db.topic.findMany({ select: { id: true } });
  const eras = await db.era.findMany({ select: { id: true } });
  if (!topics.length || !eras.length) {
    throw new Error("Сначала заполните справочники командой npm run db:seed.");
  }

  let created = 0;
  for (const [title, eraId, topicId] of samples) {
    const demoTitle = `[ЗАГЛУШКА] ${title}`;
    const existing = await db.test.findFirst({ where: { ownerId: owner.id, title: demoTitle } });
    if (existing) continue;
    await db.test.create({ data: {
      ownerId: owner.id,
      title: demoTitle,
      questions: { create: [{
        position: 0,
        text: `Демонстрационный вопрос к теме «${title}». Замените его на свой вопрос перед использованием.`,
        difficulty: "EASY",
        topicId,
        eraId,
        options: { create: [
          { position: 0, text: "Демонстрационный вариант ответа 1", correct: true },
          { position: 1, text: "Демонстрационный вариант ответа 2", correct: false },
          { position: 2, text: "Демонстрационный вариант ответа 3", correct: false },
        ] },
      }] },
    } });
    created++;
  }
  console.log(`Добавлено заглушек: ${created}; уже существовало: ${samples.length - created}.`);
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : "Не удалось добавить тесты.");
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
