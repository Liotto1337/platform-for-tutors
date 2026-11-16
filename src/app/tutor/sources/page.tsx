import Link from "next/link";
import { db } from "@/lib/db";
import { ActionForm } from "@/components/action-form";
import { PageHeading, Shell } from "@/components/shell";
import { requireUser } from "@/modules/access/session";
import { createSource } from "@/modules/actions/tutor";

export default async function Sources() {
  const user = await requireUser("TUTOR");
  const sources = await db.source.findMany({
    where: { ownerId: user.id }, select: { id: true, title: true }, orderBy: { createdAt: "desc" },
  });
  return <Shell user={user} section="/tutor/sources">
    <PageHeading title="Источники" description="Сохраните учебный текст, чтобы составить по нему вопросы." />
    <div className="split">
      <section className="panel stack"><h2>Добавить источник</h2>
        <ActionForm action={createSource} label="Сохранить источник">
          <label>Название<input name="title" maxLength={160} required /></label>
          <label>Учебный текст<textarea name="text" rows={8} maxLength={40_000} placeholder="Вставьте текст или загрузите файл ниже" /></label>
          <label>Или файл TXT в UTF-8<input name="file" type="file" accept=".txt,text/plain" /></label>
        </ActionForm>
      </section>
      <section className="panel stack"><h2>Сохранённые источники</h2>
        {sources.length ? <ul className="rows">{sources.map((source) => <li key={source.id}>
          <Link href={"/tutor/sources/" + source.id}>{source.title}</Link>
        </li>)}</ul> : <p>Здесь появятся ваши учебные тексты.</p>}
      </section>
    </div>
  </Shell>;
}
