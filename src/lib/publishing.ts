import { type Prisma, PublicationStatus } from "@prisma/client";
import { getDb } from "@/lib/db";
import { isManagedScreenId } from "@/lib/screen-estate";
import { createPlayerConfiguration, playerContentType } from "@/lib/player/configuration";
import { publishPlayerConfiguration, restorePublishedFile, type PublishedFile } from "@/lib/player/publisher";

export async function publishScreenMedia(input: { screenId: string; contentId: string; actorId: string }) {
  if (!isManagedScreenId(input.screenId)) throw new Error("The selected screen is outside the active twelve-screen estate.");
  const db = getDb();
  const screen = await db.screen.findUnique({ where: { externalId: input.screenId }, include: { location: true } });
  if (!screen) throw new Error("The selected screen does not exist.");
  const content = await db.content.findUnique({ where: { id: input.contentId } });
  if (!content || content.status !== "APPROVED") throw new Error("The selected media is not approved for publication.");
  if (!content.url || !content.mimeType) throw new Error("The selected media does not have a valid player asset.");

  const configuration = createPlayerConfiguration({
    screenId: input.screenId,
    name: screen.name,
    site: screen.location.name,
    status: "unknown",
    contentType: playerContentType(content.mimeType),
    media: content.url,
    refreshSeconds: 10,
  });
  const publication = await db.publication.create({
    data: { screenId: screen.id, contentId: content.id, actorId: input.actorId, configurationVersion: configuration.configurationVersion },
  });

  let file: PublishedFile | null = null;
  try {
    file = await publishPlayerConfiguration(configuration);
    await db.$transaction([
      db.screen.update({ where: { id: screen.id }, data: { currentContentId: content.id } }),
      db.publication.update({ where: { id: publication.id }, data: { status: PublicationStatus.PUBLISHED, backupPath: file.backupPath, publishedAt: new Date() } }),
      db.audit.create({ data: {
        action: "screen.media.published", entityType: "Screen", entityId: screen.id, actorId: input.actorId,
        metadata: { screenId: input.screenId, contentId: content.id, publicationId: publication.id, configurationVersion: configuration.configurationVersion } satisfies Prisma.InputJsonValue,
      } }),
    ]);
    return { publicationId: publication.id, configurationVersion: configuration.configurationVersion };
  } catch (error) {
    if (file) {
      try { await restorePublishedFile(file, configuration.configurationVersion); }
      catch (restoreError) { console.error("[publishing.restore] failed", { publicationId: publication.id, restoreError }); }
    }
    const message = error instanceof Error ? error.message : "Unexpected publication failure.";
    await db.publication.update({ where: { id: publication.id }, data: { status: PublicationStatus.FAILED, errorMessage: message.slice(0, 1_000) } }).catch((recordError: unknown) => {
      console.error("[publishing.record-failure] failed", { publicationId: publication.id, recordError });
    });
    throw error;
  }
}
