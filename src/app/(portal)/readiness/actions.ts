"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";

const status = z.enum(["NOT_STARTED", "IN_PROGRESS", "READY", "BLOCKED"]);
const schema = z.object({
  locationId: z.string().min(1),
  power: status,
  network: status,
  mounting: status,
  player: status,
  notes: z.string().max(1000).optional(),
  targetDate: z.string().optional(),
});

export async function updateReadiness(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const db = getDb();
  const actor = await db.user.findUnique({
    where: { id: session.user.id },
    include: { role: { include: { permissions: { include: { permission: true } } } } },
  });
  if (!actor || !actor.role.permissions.some((item) => item.permission.key === "readiness.manage")) throw new Error("Forbidden");

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Invalid readiness data");
  const data = parsed.data;
  await db.siteReadiness.upsert({
    where: { locationId: data.locationId },
    update: { power: data.power, network: data.network, mounting: data.mounting, player: data.player, notes: data.notes || null, targetDate: data.targetDate ? new Date(data.targetDate) : null },
    create: { locationId: data.locationId, power: data.power, network: data.network, mounting: data.mounting, player: data.player, notes: data.notes || null, targetDate: data.targetDate ? new Date(data.targetDate) : null },
  });
  await db.audit.create({ data: { action: "readiness.updated", entityType: "Location", entityId: data.locationId, actorId: actor.id } });
  revalidatePath("/readiness");
  revalidatePath("/");
}
