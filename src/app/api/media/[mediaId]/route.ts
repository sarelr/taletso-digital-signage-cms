import { type Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { quarantineStoredMedia, removeStoredMedia } from "@/lib/media";
import { rename } from "node:fs/promises";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, context: { params: Promise<{ mediaId: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return Response.json({ error: "Authentication is required." }, { status: 401 });
  const db = getDb();
  const actor = await db.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    include: { role: { include: { permissions: { include: { permission: true } } } } },
  });
  if (!actor || !actor.role.permissions.some(({ permission }) => permission.key === "media.delete")) {
    return Response.json({ error: "You do not have permission to delete media." }, { status: 403 });
  }

  const { mediaId } = await context.params;
  const content = await db.content.findUnique({
    where: { id: mediaId },
    include: {
      _count: { select: { assignedScreens: true, publications: true, playlists: true, approvals: true } },
    },
  });
  if (!content) return Response.json({ error: "The media item no longer exists." }, { status: 404 });
  if (!content.url) return Response.json({ error: "This media item has no managed file." }, { status: 409 });

  const blockers = [
    content._count.assignedScreens ? "assigned to a screen" : "",
    content._count.publications ? "retained in publication history" : "",
    content._count.playlists ? "used in a playlist" : "",
    content._count.approvals ? "retained in approval history" : "",
  ].filter(Boolean);
  if (blockers.length) {
    return Response.json({ error: `Media cannot be deleted because it is ${blockers.join(", ")}.` }, { status: 409 });
  }

  let quarantined: Awaited<ReturnType<typeof quarantineStoredMedia>>;
  try {
    quarantined = await quarantineStoredMedia(content.url);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "The media file could not be secured for deletion." }, { status: 409 });
  }

  try {
    await db.$transaction([
      db.content.delete({ where: { id: content.id } }),
      db.audit.create({ data: {
        action: "media.deleted",
        entityType: "Content",
        entityId: content.id,
        actorId: actor.id,
        metadata: { title: content.title, originalFilename: content.originalFilename, storageName: quarantined.filename } satisfies Prisma.InputJsonValue,
      } }),
    ]);
  } catch (error) {
    await rename(quarantined.quarantinePath, quarantined.absolutePath).catch(() => undefined);
    console.error("[media.delete] database deletion failed", { mediaId: content.id, actorId: actor.id });
    return Response.json({ error: "Deletion failed and the media file was restored." }, { status: 500 });
  }

  await removeStoredMedia(quarantined.quarantinePath).catch((error) => {
    console.error("[media.delete] quarantine cleanup failed", { mediaId: content.id, error });
  });
  return Response.json({ deleted: true, id: content.id });
}
