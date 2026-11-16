import Link from "next/link";
import { PageHeading, Shell } from "@/components/shell";
import { ActionForm } from "@/components/action-form";
import { requireUser } from "@/modules/access/session";
import { createTest } from "@/modules/actions/tutor";

export default async function NewTest() {
  const user = await requireUser("TUTOR");
  return <Shell user={user} section="/tutor/tests">
    <Link className="back" href="/tutor/tests">← Все тесты</Link>
    <PageHeading title="Новый тест" />
    <section className="panel narrow"><ActionForm action={createTest} label="Создать черновик">
      <label>Название<input name="title" required maxLength={160} placeholder="Например, Реформы Петра I" /></label>
    </ActionForm></section>
  </Shell>;
}
