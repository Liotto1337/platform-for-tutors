import Link from "next/link";
import type { JobStatus } from "@/generated/prisma/enums";
import { RefreshJobs } from "./refresh-jobs";

const statusText = { QUEUED: "В очереди", RUNNING: "Выполняется", READY: "Готово", FAILED: "Ошибка" };

export function Jobs({ jobs }: { jobs: {
  id: string; title: string; status: JobStatus; error: string | null; credits: number | null;
  testId: string | null; presentationId: string | null;
}[] }) {
  if (!jobs.length) return null;
  return <section className="panel stack">
    <h2>Последние генерации</h2>
    <RefreshJobs active={jobs.some((job) => job.status === "RUNNING" || job.status === "QUEUED")} />
    <ul className="rows">{jobs.map((job) => <li key={job.id}>
      <div><strong>{job.title}</strong>{job.error && <p className="error">{job.error}</p>}
        {job.credits !== null && <small>Списано кредитов Gamma: {job.credits}</small>}</div>
      <div className="row-actions"><span className="pill" data-status={job.status}>{statusText[job.status]}</span>
        {job.testId && <Link href={"/tutor/tests/" + job.testId}>Проверить вопросы</Link>}
        {job.presentationId && <a href={"/api/presentations/" + job.presentationId}>Скачать PDF</a>}
      </div>
    </li>)}</ul>
  </section>;
}
