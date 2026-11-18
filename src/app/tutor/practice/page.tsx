import { db } from "@/lib/db";
import { PageHeading, Shell } from "@/components/shell";
import { ActionForm } from "@/components/action-form";
import { requireUser } from "@/modules/access/session";
import { assign } from "@/modules/actions/schoolwork";

export default async function Practice() {
  const user = await requireUser("TUTOR");
  const work = await db.assignment.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: "desc" },
    select: { id: true, title: true, submittedAt: true, prompt: true, answer: true, photoType: true, score: true,
      total: true, pauses: true, student: { select: { name: true, email: true } } } });
  return <Shell user={user} section="/tutor/practice">
    <PageHeading title="Практические задания" />
    <section className="panel stack"><h2>Назначить задание</h2>
      <ActionForm action={assign.bind(null, null)} label="Назначить ученику">
        <label>Почта ученика<input type="email" name="email" required /></label>
        <label>Название<input name="title" maxLength={160} required /></label>
        <label>Условие<textarea name="prompt" rows={4} maxLength={6000} required /></label>
      </ActionForm></section>
    <section className="panel stack"><h2>Назначенные работы</h2>
      {work.length === 0 && <p>Здесь появятся выданные задания и тесты.</p>}
      {work.map(w => <article className="stack consent-row" key={w.id}><div><h3>{w.title}</h3>
        <small>{w.student.name} · {w.student.email}</small></div>
        {w.prompt && <p className="source-text">{w.prompt}</p>}
        <strong>{w.submittedAt ? "Сдано" : "Ожидает ответа"}{w.score !== null && ` · ${w.score} из ${w.total}`}</strong>
        {w.pauses > 0 && <small>Пауз при потере фокуса или выходе из полного экрана: {w.pauses}</small>}
        {w.answer && <p className="source-text">{w.answer}</p>}
        {w.photoType && <a href={"/api/work-photo/" + w.id}>Открыть фото тетради</a>}
      </article>)}</section>
  </Shell>;
}

