import Link from "next/link";
import { Shell, PageHeading } from "@/components/shell";
import { requireUser } from "@/modules/access/session";
import { db } from "@/lib/db";

export default async function Tutor() {
  const user = await requireUser("TUTOR");
  const where = { ownerId: user.id };
  const [tests, sources, presentations, recent] = await Promise.all([
    db.test.count({ where }), db.source.count({ where }), db.presentation.count({ where }),
    db.test.findMany({ where, orderBy: { updatedAt: "desc" }, take: 5 }),
  ]);
  return <Shell user={user} section="/tutor">
    <PageHeading title="Подготовка уроков" description="Соберите материалы для следующего урока истории.">
      <Link className="button" href="/tutor/tests/new">Создать тест</Link>
    </PageHeading>
    <div className="overview-grid">
      {[
        ["/tutor/tests", "Тесты", tests, "Составить и проверить вопросы"],
        ["/tutor/sources", "Источники", sources, "Добавить учебный текст"],
        ["/tutor/presentations", "Презентации", presentations, "Создать или загрузить PDF"],
      ].map(([url, title, count, description]) => <Link className="overview-card" key={url} href={String(url)}>
        <div className="card-top"><h2>{title}</h2><span aria-hidden="true">↗</span></div>
        <strong className="count">{count}</strong><p>{description}</p>
      </Link>)}
    </div>
    <section className="panel stack"><h2>Недавние тесты</h2>
      {recent.length ? <ul className="rows">{recent.map((test) => <li key={test.id}>
        <Link href={"/tutor/tests/" + test.id}>{test.title}</Link>
        <span className="pill" data-status={test.status}>{test.status === "DRAFT" ? "Черновик" : "Проверено"}</span>
      </li>)}</ul> : <p>Сохранённые тесты появятся здесь.</p>}
    </section>
  </Shell>;
}
