import Link from "next/link";
import { db } from "@/lib/db";
import { Jobs } from "@/components/jobs";
import { PageHeading, Shell } from "@/components/shell";
import { requireUser } from "@/modules/access/session";
import type { Prisma } from "@/generated/prisma/client";
import { DeleteTestButton } from "@/components/delete-test-button";

type Filters = { q?: string; status?: string; topic?: string; era?: string };

export default async function Tests({ searchParams }: { searchParams: Promise<Filters> }) {
  const user = await requireUser("TUTOR");
  const input = await searchParams;
  const term = typeof input.q === "string" ? input.q.trim().slice(0, 160) : "";
  const status = input.status === "REVIEWED" || input.status === "DRAFT" ? input.status : undefined;
  const topicId = typeof input.topic === "string" ? input.topic.slice(0, 80) || undefined : undefined;
  const eraId = typeof input.era === "string" ? input.era.slice(0, 80) || undefined : undefined;
  const where: Prisma.TestWhereInput = {
    ownerId: user.id, status, title: term ? { contains: term, mode: "insensitive" } : undefined,
    questions: topicId || eraId ? { some: { topicId, eraId } } : undefined,
  };
  const [tests, topics, eras, jobs] = await Promise.all([
    db.test.findMany({ where, include: { _count: { select: { questions: true } } }, orderBy: { updatedAt: "desc" } }),
    db.topic.findMany({ orderBy: { name: "asc" } }), db.era.findMany({ orderBy: { name: "asc" } }),
    db.generationJob.findMany({ where: { ownerId: user.id, type: "QUESTIONS" }, orderBy: { createdAt: "desc" }, take: 12 }),
  ]);
  return <Shell user={user} section="/tutor/tests">
    <PageHeading title="Тесты"><Link className="button" href="/tutor/tests/new">Создать тест</Link></PageHeading>
    <section className="panel stack">
      <form className="filters">
        <label>Название<input name="q" defaultValue={term} maxLength={160} placeholder="Поиск тестов" /></label>
        <label>Статус<select name="status" defaultValue={status ?? ""}>
          <option value="">Все статусы</option><option value="DRAFT">Черновик</option><option value="REVIEWED">Проверено</option>
        </select></label>
        <label>Тема<select name="topic" defaultValue={topicId ?? ""}><option value="">Все темы</option>
          {topics.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select></label>
        <label>Эпоха<select name="era" defaultValue={eraId ?? ""}><option value="">Все эпохи</option>
          {eras.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select></label>
        <button className="secondary">Найти</button>
      </form>
      {tests.length ? <ul className="rows">{tests.map((test) => <li key={test.id}>
        <div><Link href={"/tutor/tests/" + test.id}>{test.title}</Link><small>Вопросов: {test._count.questions}</small></div>
        <span className="pill" data-status={test.status}>{test.status === "DRAFT" ? "Черновик" : "Проверено"}</span>
        <DeleteTestButton id={test.id} />
      </li>)}</ul> : <p>По этим условиям тестов пока нет.</p>}
    </section>
    <Jobs jobs={jobs} />
  </Shell>;
}
