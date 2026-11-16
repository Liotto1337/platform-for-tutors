import { db } from "@/lib/db";

export const consentType = "PILOT_GUARDIAN";
const activeFilter = { active: true, type: consentType };

export async function parentConsent(guardianId: string) {
  const document = await db.consentDocument.findFirst({ where: activeFilter });
  const children = await db.guardianLink.findMany({
    where: { guardianId, student: { role: "STUDENT" } },
    include: { student: { select: { name: true } } },
    orderBy: { studentId: "asc" },
  });
  return {
    document,
    children: await Promise.all(children.map(async (child) => ({
      ...child,
      granted: document ? (await db.consentEvent.findFirst({
        where: { documentId: document.id, actorId: guardianId, subjectId: child.studentId },
        orderBy: { id: "desc" },
      }))?.action === "GRANTED" : false,
    }))),
  };
}

export async function studentHasConsent(studentId: string) {
  const result = await db.$queryRaw<{ allowed: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM "GuardianLink" g
      JOIN "User" u ON u.id = g."guardianId" AND u.role = 'PARENT'
      JOIN "ConsentDocument" d ON d.active AND d.type = ${consentType}
      JOIN LATERAL (
        SELECT action FROM "ConsentEvent" e
        WHERE e."documentId" = d.id AND e."actorId" = g."guardianId"
          AND e."subjectId" = g."studentId"
        ORDER BY e.id DESC LIMIT 1
      ) latest ON latest.action = 'GRANTED'
      WHERE g."studentId" = ${studentId}
    ) AS allowed`;
  return result[0].allowed;
}

export async function recordConsent(
  guardianId: string, studentId: string, documentId: string, action: "GRANTED" | "REVOKED",
) {
  return db.$transaction(async (tx) => {
    const links = await tx.$queryRaw<{ studentId: string }[]>`
      SELECT "studentId" FROM "GuardianLink" WHERE "guardianId" = ${guardianId}
        AND "studentId" = ${studentId} FOR UPDATE`;
    if (!links.length) return false;
    const documents = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM "ConsentDocument" WHERE id = ${documentId}
        AND active AND type = ${consentType} FOR SHARE`;
    if (!documents.length) return false;
    const last = await tx.consentEvent.findFirst({
      where: { actorId: guardianId, subjectId: studentId, documentId },
      orderBy: { id: "desc" },
    });
    if (last?.action === action || (!last && action === "REVOKED")) return true;
    await tx.consentEvent.create({
      data: { actorId: guardianId, subjectId: studentId, documentId, action, method: "PILOT_ACCOUNT" },
    });
    return true;
  });
}
