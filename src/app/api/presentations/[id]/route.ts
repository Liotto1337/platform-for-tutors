import { currentUser } from "@/modules/access/session";
import { openPdf } from "@/modules/presentations/storage";
import { db } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (user?.role !== "TUTOR") return new Response(null, { status: user ? 404 : 401 });
  const { id } = await params;
  const file = await db.presentation.findFirst({ where: { id, ownerId: user.id } });
  if (!file) return new Response(null, { status: 404 });
  try {
    const { Body, ContentLength } = await openPdf(file.objectKey);
    if (!Body) return new Response("Файл временно недоступен.", { status: 503 });
    const encoded = encodeURIComponent(file.title + ".pdf").replace(/['()*]/g, (char) => "%" + char.charCodeAt(0).toString(16));
    const headers: HeadersInit = {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=\"presentation.pdf\"; filename*=UTF-8''" + encoded,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    };
    if (ContentLength !== undefined) headers["Content-Length"] = String(ContentLength);
    return new Response(Body.transformToWebStream(), { headers });
  } catch {
    return new Response("Файл временно недоступен.", { status: 503 });
  }
}
