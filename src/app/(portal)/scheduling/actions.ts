"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { CAMPUS_SCOPED_ROLES } from "@/lib/access";
import { getXiboAdapter } from "@/lib/xibo/adapter";

const schema = z.object({
  name: z.string().min(3).max(120),
  playlistId: z.string().min(1),
  screenGroupId: z.string().min(1),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
});

export async function createSchedule(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Invalid schedule data");

  const db = getDb();
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { role: { include: { permissions: { include: { permission: true } } } } },
  });
  if (!user) throw new Error("Unauthorized");
  const permissions = user.role.permissions.map((item) => item.permission.key);
  if (!permissions.includes("schedules.manage")) throw new Error("Forbidden");

  const startsAt = new Date(parsed.data.startsAt);
  const endsAt = new Date(parsed.data.endsAt);
  if (!(startsAt < endsAt)) throw new Error("End time must be after start time");

  const playlist = await db.playlist.findUnique({ where: { id: parsed.data.playlistId } });
  const group = await db.screenGroup.findUnique({
    where: { id: parsed.data.screenGroupId },
    include: { screens: { include: { screen: true } } },
  });
  if (!playlist || !group) throw new Error("Playlist or display group not found");

  if (CAMPUS_SCOPED_ROLES.has(user.role.name)) {
    if (!user.locationId || playlist.locationId !== user.locationId) throw new Error("Playlist is outside your campus scope");
    const groupLocationIds = new Set(group.screens.map((item) => item.screen.locationId));
    if (groupLocationIds.size !== 1 || !groupLocationIds.has(user.locationId)) throw new Error("Display group is outside your campus scope");
  }

  const schedule = await db.schedule.create({
    data: {
      name: parsed.data.name,
      startsAt,
      endsAt,
      status: "ACTIVE",
      playlistId: playlist.id,
      screenGroupId: group.id,
    },
  });

  let externalId: string | null = null;
  try {
    const xibo = getXiboAdapter();
    const result = await xibo.createSchedule({
      name: schedule.name,
      displayGroupId: group.name,
      playlistId: playlist.id,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
    });
    externalId = result.id;
    await db.schedule.update({ where: { id: schedule.id }, data: { externalId } });
  } catch (error) {
    await db.audit.create({
      data: { action: "schedule.xibo_sync_failed", entityType: "Schedule", entityId: schedule.id, actorId: user.id, metadata: { message: error instanceof Error ? error.message : "Unknown Xibo error" } },
    });
  }

  await db.audit.create({
    data: { action: "schedule.created", entityType: "Schedule", entityId: schedule.id, actorId: user.id, metadata: { externalId } },
  });
  revalidatePath("/scheduling");
  revalidatePath("/");
}
