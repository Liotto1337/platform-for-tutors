import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Role } from "@/generated/prisma/enums";

export const home: Record<Role, string> = {
  TUTOR: "/tutor", STUDENT: "/student", PARENT: "/parent",
};

export async function currentUser() {
  const requestHeaders = await headers();
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  if (!session) return null;
  return db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, role: true, email: true },
  });
}

export async function requireUser(role?: Role) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (role && user.role !== role) notFound();
  return user;
}
