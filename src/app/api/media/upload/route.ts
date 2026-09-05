import { type Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { removeStoredMedia, storeMediaFile, validateMediaFile } from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) return Response.json({ error: "Authentication is required." }, { status: 401 });
  const db = getDb();
  const actor = await db.user.findUnique({ where: { email: session.user.email.toLowerCase() }, include: { role: { include: { permissions: { include: { permission: true } } } } } });
  if (!actor || !actor.role.permissions.some(({ permission }) => permission.key === "media.upload")) return Response.json({ error: "You do not have permission to upload media." }, { status: 403 });

  let form: FormData;
  try { form = await request.formData(); } catch { return Response.json({ error: "Invalid upload request." }, { status: 400 }); }
  const file = form.get("file");
  const title = String(form.get("title") ?? "").trim();
  if (!(file instanceof File) || !title || title.length > 160) return Response.json({ error: "A title and media file are required." }, { status: 400 });

  let stored: Awaited<ReturnType<typeof storeMediaFile>> | null = null;
  try {
    const validated = await validateMediaFile(file);
    stored = await storeMediaFile(validated);
    const content = await db.$transaction(async (transaction) => {
      const created = await transaction.content.create({ data: { title, type: validated.mimeType === "video/mp4" ? "VIDEO" : "IMAGE", status: "APPROVED", url: stored!.playerPath, originalFilename: validated.originalFilename, mimeType: validated.mimeType, fileSize: validated.bytes.byteLength, ownerId: actor.id } });
      await transaction.audit.create({ data: { action: "media.uploaded", entityType: "Content", entityId: created.id, actorId: actor.id, metadata: { mimeType: validated.mimeType, fileSize: validated.bytes.byteLength, storageName: stored!.filename } satisfies Prisma.InputJsonValue } });
      return created;
    });
    return Response.json({ id: content.id, title: content.title }, { status: 201 });
  } catch (error) {
    if (stored) await removeStoredMedia(stored.absolutePath).catch(() => undefined);
    console.error("[media.upload] failed", { actorId: actor.id, error: error instanceof Error ? error.message : "unknown" });
    return Response.json({ error: error instanceof Error ? error.message : "Upload failed without saving media." }, { status: 400 });
  }
}
