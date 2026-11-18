import { randomUUID } from "node:crypto";
import { Catalog } from "./catalog";
import { db } from "@/lib/db";
import { Jobs } from "@/components/jobs";
import { ActionForm } from "@/components/action-form";
import { PageHeading, Shell } from "@/components/shell";
import { requireUser } from "@/modules/access/session";
import { queueGamma, uploadPdf } from "@/modules/actions/tutor";

export default async function Presentations() {
  const user = await requireUser("TUTOR");
  const [files, jobs] = await Promise.all([
    db.presentation.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: "desc" } }),
    db.generationJob.findMany({ where: { ownerId: user.id, type: "GAMMA" }, orderBy: { createdAt: "desc" }, take: 12 }),
  ]);
  return <Shell user={user} section="/tutor/presentations">
    <PageHeading title="Презентации" description="Создайте презентацию из плана урока или добавьте готовый PDF." />
    <Catalog gamma={Boolean(process.env.GAMMA_API_KEY)} requestKey={randomUUID()} />
    <div className="split">
      <section className="panel stack"><h2>Создать в Gamma</h2>
        {process.env.GAMMA_API_KEY ? <ActionForm action={queueGamma} label="Отправить в Gamma">
          <input type="hidden" name="requestKey" value={randomUUID()} />
          <label>Название<input name="title" required maxLength={160} /></label>
          <label>План урока<textarea name="lessonPlan" required rows={6} minLength={20} maxLength={12_000} /></label>
          <label className="check"><input name="confirmed" type="checkbox" required />Я просмотрел план. В нём только учебные материалы.</label>
        </ActionForm> : <p>Ключ Gamma пока не настроен. Вы можете добавить готовый PDF.</p>}
      </section>
      <section className="panel stack"><h2>Загрузить PDF</h2>
        <ActionForm action={uploadPdf} label="Сохранить PDF" secondary>
          <label>Название<input name="title" required maxLength={160} /></label>
          <label>PDF до 20 МБ<input name="file" type="file" accept=".pdf,application/pdf" required /></label>
        </ActionForm>
      </section>
    </div>
    <Jobs jobs={jobs} />
    <section className="panel stack"><h2>Каталог PDF</h2>
      {files.length ? <ul className="rows">{files.map((file) => <li key={file.id}>
        <div><strong>{file.title}</strong><small>{file.origin === "GAMMA" ? "Gamma" : "Загруженный файл"}</small></div>
        <a href={"/api/presentations/" + file.id}>Скачать PDF</a>
      </li>)}</ul> : <p>Сохранённые презентации появятся здесь.</p>}
    </section>
  </Shell>;
}
