import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { assign } from "@/modules/actions/schoolwork";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeading, Shell } from "@/components/shell";
import { requireUser } from "@/modules/access/session";
import { TestEditor } from "./editor";
import { DeleteTestButton } from "@/components/delete-test-button";

export default async function TestPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }>;
}) {
  const user = await requireUser("TUTOR");
  const { id } = await params;
  const [test, topics, eras, query] = await Promise.all([
    db.test.findFirst({ where: { id, ownerId: user.id }, include: { questions: {
      orderBy: { position: "asc" }, include: { options: { orderBy: { position: "asc" } },
        source: { select: { id: true, title: true, ownerId: true } } },
    } } }),
    db.topic.findMany({ orderBy: { name: "asc" } }), db.era.findMany({ orderBy: { name: "asc" } }), searchParams,
  ]);
  if (!test) notFound();
  const questions = test.questions.map(({ id, text, format, difficulty, topicId, eraId, options, source, excerpt }) => ({
    id, text, format, difficulty, topicId, eraId, options: options.map(({ text, correct }) => ({ text, correct })),
    evidence: source?.ownerId === user.id && excerpt ? { id: source.id, title: source.title, excerpt } : undefined,
  }));
  return <Shell user={user} section="/tutor/tests">
    <Link className="back" href="/tutor/tests">← Все тесты</Link>
    <PageHeading title={test.title}>
      <span className="pill" data-status={test.status}>{test.status === "DRAFT" ? "Черновик" : "Проверено репетитором"}</span>
      <DeleteTestButton id={test.id} />
    </PageHeading>
    {query.saved === "1" && <p className="success" role="status">Изменения сохранены.</p>}
    {test.status === "REVIEWED" && <section className="panel stack"><h2>Назначить проверенную версию</h2>
      <ActionForm action={assign.bind(null, test.id)} label="Назначить тест">
        <label>Почта ученика<input type="email" name="email" required /></label>
      </ActionForm></section>}
    <TestEditor key={test.id + ":" + test.revision} id={test.id} revision={test.revision}
      initialTitle={test.title} initialQuestions={questions} topics={topics} eras={eras} />
  </Shell>;
}
