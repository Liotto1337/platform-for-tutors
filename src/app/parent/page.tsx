import Link from "next/link";
import { PageHeading, Shell } from "@/components/shell";
import { requireUser } from "@/modules/access/session";
import { parentConsent } from "@/modules/consents/service";

export default async function Parent() {
  const user = await requireUser("PARENT");
  const { children } = await parentConsent(user.id);
  return <Shell user={user} section="/parent">
    <PageHeading title="Кабинет родителя" />
    <section className="panel stack"><h2>Ученики</h2>
      {children.length ? <ul className="rows">{children.map((child) => <li key={child.studentId}>
        <strong>{child.student.name}</strong><span className="pill" data-status={child.granted ? "READY" : "DRAFT"}>
          {child.granted ? "Согласие действует" : "Требуется согласие"}
        </span>
      </li>)}</ul> : <p>Оператор ещё не подтвердил связь с учеником.</p>}
      <div><Link className="button" href="/parent/consent">Управлять согласием</Link></div>
    </section>
  </Shell>;
}
