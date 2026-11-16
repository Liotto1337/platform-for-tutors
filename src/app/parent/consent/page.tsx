import { PageHeading, Shell } from "@/components/shell";
import { ActionForm } from "@/components/action-form";
import { requireUser } from "@/modules/access/session";
import { parentConsent } from "@/modules/consents/service";
import { changeConsent } from "@/modules/actions/consent";

export default async function ParentConsent() {
  const user = await requireUser("PARENT");
  const { document, children } = await parentConsent(user.id);
  return <Shell user={user} section="/parent/consent">
    <PageHeading title="Согласие представителя" />
    {document ? <section className="panel stack">
      <h2>Документ версии {document.version}</h2><div className="source-text">{document.text}</div>
      {children.map((child) => <div className="consent-row stack" key={child.studentId}>
        <h3>{child.student.name}</h3>
        <p>{child.granted ? "Согласие этой версии действует." : "Для этой версии требуется согласие."}</p>
        <ActionForm key={document.id + ":" + child.granted} action={changeConsent}
          label={child.granted ? "Отозвать согласие" : "Предоставить согласие"} secondary={child.granted}>
          <input type="hidden" name="studentId" value={child.studentId} />
          <input type="hidden" name="documentId" value={document.id} />
          <input type="hidden" name="action" value={child.granted ? "REVOKED" : "GRANTED"} />
          {!child.granted && <label className="check"><input type="checkbox" name="confirmed" required />Я прочитал документ и подтверждаю согласие.</label>}
        </ActionForm>
      </div>)}
      {!children.length && <p>Оператор ещё не подтвердил связь с учеником.</p>}
    </section> : <p>Действующая версия документа пока недоступна.</p>}
  </Shell>;
}
