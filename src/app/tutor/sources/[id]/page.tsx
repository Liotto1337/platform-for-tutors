import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ActionForm } from "@/components/action-form";
import { PageHeading, Shell } from "@/components/shell";
import { requireUser } from "@/modules/access/session";
import { queueQuestions } from "@/modules/actions/tutor";

export default async function Source({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("TUTOR");
  const { id } = await params;
  const source = await db.source.findFirst({ where: { id, ownerId: user.id } });
  if (!source) notFound();
  const mock = (process.env.AI_PROVIDER ?? "mock") === "mock";
  return <Shell user={user} section="/tutor/sources">
    <Link className="back" href="/tutor/sources">← Все источники</Link>
    <PageHeading title={source.title} />
    <div className="split">
      <section className="panel stack"><h2>Учебный текст</h2><div className="source-text" tabIndex={0}>{source.text}</div></section>
      <section className="panel stack"><h2>Черновик вопросов</h2>
        <p>{mock ? "Сейчас работает демонстрационная генерация. Проверьте вопросы и цитаты в редакторе."
          : "Yandex AI Studio получит учебный текст. Проверьте вопросы и цитаты в редакторе."}</p>
        <ActionForm action={queueQuestions.bind(null, source.id)} label="Составить вопросы">
          <input type="hidden" name="requestKey" value={randomUUID()} />
          <label>Название теста<input name="title" maxLength={160} required defaultValue={source.title} /></label>
          <label className="check"><input name="confirmed" type="checkbox" required />Я просмотрел текст. В нём только учебные материалы.</label>
        </ActionForm>
      </section>
    </div>
  </Shell>;
}
