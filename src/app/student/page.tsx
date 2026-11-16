import Link from "next/link";
import { PageHeading, Shell } from "@/components/shell";
import { requireUser } from "@/modules/access/session";
import { studentHasConsent } from "@/modules/consents/service";

export default async function Student() {
  const user = await requireUser("STUDENT");
  const allowed = await studentHasConsent(user.id);
  return <Shell user={user} section="/student">
    <PageHeading title="Кабинет ученика" />
    <section className="panel stack"><h2>Учебный раздел</h2>
      <p>{allowed ? "Представитель предоставил согласие. Учебный раздел открыт." : "Для доступа потребуется согласие представителя."}</p>
      <div><Link className="button" prefetch={false} href={allowed ? "/student/study" : "/student/consent"}>
        {allowed ? "Открыть раздел" : "Проверить согласие"}
      </Link></div>
    </section>
  </Shell>;
}
