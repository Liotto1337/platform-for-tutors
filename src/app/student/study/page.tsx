import Link from "next/link";
import { db } from "@/lib/db";
import { requireStudent } from "@/modules/schoolwork/access";
import { PageHeading, Shell } from "@/components/shell";

export default async function Study() {
  const user = await requireStudent();
  const tests = await db.assignment.findMany({ where: { studentId: user.id, testId: { not: null } },
    orderBy: { createdAt: "desc" }, select: { id: true, title: true, total: true, score: true, submittedAt: true } });
  return <Shell user={user} section="/student/study">
    <PageHeading title="Учебный раздел" />
    <section className="panel stack"><h2>Мои тесты</h2>
      {tests.length ? <ul className="rows">{tests.map(t => <li key={t.id}><strong>{t.title}</strong>
        {t.submittedAt ? <span>Результат: {t.score} из {t.total}</span> : <Link href={"/student/study/" + t.id}>Открыть тест</Link>}
      </li>)}</ul> : <p>Назначенных тестов пока нет.</p>}
    </section>
    <Link href="/student/practice">Перейти к практическим заданиям</Link>
  </Shell>;
}
