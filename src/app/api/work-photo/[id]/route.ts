import { db } from "@/lib/db";
import { requireUser } from "@/modules/access/session";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("TUTOR");
  const { id } = await params;
  const work = await db.assignment.findFirst({ where: { id, ownerId: user.id }, select: { photo: true, photoType: true } });
  if (!work?.photo || !work.photoType) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(work.photo), { headers: { "Content-Type": work.photoType,
    "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}

