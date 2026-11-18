import { db } from "@/lib/db";
import { PageHeading, Shell } from "@/components/shell";
import { requireStudent } from "@/modules/schoolwork/access";
import { PracticeResponse } from "./response";

export default async function Practice() {
  const user = await requireStudent();
  const tasks = await db.assignment.findMany({ where: { studentId: user.id, testId: null }, orderBy: { createdAt: "desc" },
    select: { id: true, title: true, prompt: true, submittedAt: true, owner: { select: { name: true } } } });
  return <Shell user={user} section="/student/practice"><PageHeading title="Практические задания" />
    {!tasks.length && <p className="panel">Здесь появятся задания от репетитора.</p>}
    {tasks.map(t => <section key={t.id} className="panel stack"><div><small>{t.owner.name}</small><h2>{t.title}</h2></div>
      <p className="source-text">{t.prompt}</p>{t.submittedAt ? <strong>Работа сдана</strong> : <PracticeResponse id={t.id} />}
    </section>)}
  </Shell>;
}

