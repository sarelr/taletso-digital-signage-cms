"use server";

import { ContentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireCurrentUser } from "@/lib/current-user";
import { CAMPUS_SCOPED_ROLES } from "@/lib/access";

export async function createPlaylist(formData: FormData) {
  const user = await requireCurrentUser();
  if (!user.permissionKeys.includes("playlists.manage")) throw new Error("Forbidden");

  const name = z.string().min(3).max(120).parse(formData.get("name"));
  const description = z.string().max(500).optional().parse(formData.get("description") || undefined);
  const requestedLocationId = z.string().optional().parse(formData.get("locationId") || undefined);
  const locationId = CAMPUS_SCOPED_ROLES.has(user.role.name) ? user.locationId : requestedLocationId || null;

  const playlist = await db.playlist.create({ data: { name, description: description || null, locationId } });
  await db.audit.create({ data: { action: "playlist.created", entityType: "Playlist", entityId: playlist.id, actorId: user.id } });
  revalidatePath("/playlists");
}

export async function addPlaylistItem(formData: FormData) {
  const user = await requireCurrentUser();
  if (!user.permissionKeys.includes("playlists.manage")) throw new Error("Forbidden");

  const playlistId = z.string().min(1).parse(formData.get("playlistId"));
  const contentId = z.string().min(1).parse(formData.get("contentId"));
  const durationSeconds = z.coerce.number().int().min(5).max(3600).parse(formData.get("durationSeconds") ?? 10);

  const [playlist, content] = await Promise.all([
    db.playlist.findUnique({ where: { id: playlistId }, include: { items: true } }),
    db.content.findUnique({ where: { id: contentId } }),
  ]);
  if (!playlist || !content) throw new Error("Playlist or content not found");
  if (content.status !== ContentStatus.APPROVED) throw new Error("Only approved content can be added to playlists");
  if (CAMPUS_SCOPED_ROLES.has(user.role.name) && playlist.locationId !== user.locationId) throw new Error("Playlist is outside your campus scope");
  if (playlist.locationId && content.locationId && playlist.locationId !== content.locationId) throw new Error("Content and playlist campus scopes do not match");

  const nextPosition = playlist.items.reduce((max, item) => Math.max(max, item.position), 0) + 1;
  await db.playlistItem.upsert({
    where: { playlistId_contentId: { playlistId, contentId } },
    update: { durationSeconds },
    create: { playlistId, contentId, durationSeconds, position: nextPosition },
  });
  await db.audit.create({ data: { action: "playlist.item_added", entityType: "Playlist", entityId: playlistId, actorId: user.id, metadata: { contentId } } });
  revalidatePath("/playlists");
}
