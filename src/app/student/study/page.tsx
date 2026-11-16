import { redirect } from "next/navigation";
import { PageHeading, Shell } from "@/components/shell";
import { requireUser } from "@/modules/access/session";
import { studentHasConsent } from "@/modules/consents/service";

export default async function Study() {
  const user = await requireUser("STUDENT");
  if (!await studentHasConsent(user.id)) redirect("/student/consent");
  return <Shell user={user} section="/student/study">
    <PageHeading title="Учебный раздел" />
    <section className="panel"><p>Доступ к учебному разделу открыт.</p></section>
  </Shell>;
}
