import Link from "next/link";
import type { Role } from "@/generated/prisma/enums";
import { home } from "@/modules/access/session";
import { Brand } from "./brand";
import { SignOut } from "./sign-out";

const roleName = { TUTOR: "Репетитор", STUDENT: "Ученик", PARENT: "Родитель" };
export const tutorLinks = [
  ["/tutor", "Обзор"], ["/tutor/tests", "Тесты"], ["/tutor/sources", "Источники"],
  ["/tutor/presentations", "Презентации"],
];
const studentLinks = [["/student", "Кабинет"], ["/student/study", "Учебный раздел"], ["/student/consent", "Согласие"]];
const parentLinks = [["/parent", "Кабинет"], ["/parent/consent", "Согласие"]];

export function Shell({ user, section, children }: {
  user: { name: string; role: Role }; section: string; children: React.ReactNode;
}) {
  const links = user.role === "TUTOR" ? tutorLinks : user.role === "STUDENT" ? studentLinks : parentLinks;
  return <div className="workspace">
    <aside className="sidebar">
      <Brand href={home[user.role]} />
      <nav aria-label="Разделы кабинета">{links.map(([url, label]) =>
        <Link key={url} href={url} prefetch={url === "/student/study" ? false : undefined}
          aria-current={section === url ? "page" : undefined}>{label}</Link>
      )}</nav>
      <div className="profile"><div className="avatar" aria-hidden="true">{user.name.slice(0, 1)}</div>
        <div><strong>{user.name}</strong><small>{roleName[user.role]}</small></div><SignOut />
      </div>
    </aside>
    <main className="content">{children}</main>
  </div>;
}

export function PageHeading({ title, children, description }: { title: string; children?: React.ReactNode; description?: string }) {
  return <header className="page-heading"><div><h1>{title}</h1>{description && <p>{description}</p>}</div>{children}</header>;
}
