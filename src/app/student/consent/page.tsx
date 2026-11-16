import Link from "next/link";
import { PageHeading, Shell } from "@/components/shell";
import { requireUser } from "@/modules/access/session";
import { studentHasConsent } from "@/modules/consents/service";

export default async function StudentConsent() {
  const user = await requireUser("STUDENT");
  const allowed = await studentHasConsent(user.id);
  return <Shell user={user} section="/student/consent">
    <PageHeading title="Согласие представителя" />
    <section className="panel stack">
      <h2>{allowed ? "Согласие действует" : "Ожидаем согласия"}</h2>
      <p>{allowed ? "Учебный раздел открыт." : "Представитель может прочитать документ и подтвердить согласие в своём кабинете."}</p>
      {allowed && <div><Link className="button" prefetch={false} href="/student/study">В учебный раздел</Link></div>}
    </section>
  </Shell>;
}
