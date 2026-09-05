"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { CAMPUS_SCOPED_ROLES } from "@/lib/access";
import { getDb } from "@/lib/db";
import { publishScreenMedia } from "@/lib/publishing";
import { isManagedScreenId } from "@/lib/screen-estate";

export type PublishActionState = { status: "idle" | "success" | "error"; message: string };
export type ScreenUpdateState = PublishActionState;

const schema = z.object({ screenId: z.string().regex(/^SCREEN-[0-9]{3}$/), contentId: z.string().cuid() });
const updateSchema = z.object({ screenId: z.string().regex(/^SCREEN-[0-9]{3}$/), name: z.string().trim().min(2).max(100), locationId: z.string().cuid() });

export async function updateScreen(_state: ScreenUpdateState, formData: FormData): Promise<ScreenUpdateState> {
  const session = await auth();
  if (!session?.user?.email) return { status: "error", message: "Your session has expired. Sign in again." };
  const parsed = updateSchema.safeParse({ screenId: formData.get("screenId"), name: formData.get("name"), locationId: formData.get("locationId") });
  if (!parsed.success || !isManagedScreenId(parsed.data.screenId)) return { status: "error", message: "Enter a valid screen name and site." };
  const db = getDb();
  const actor = await db.user.findUnique({ where: { email: session.user.email.toLowerCase() }, include: { role: { include: { permissions: { include: { permission: true } } } } } });
  if (!actor || !actor.role.permissions.some(({ permission }) => permission.key === "screen.manage")) return { status: "error", message: "You do not have permission to manage screens." };
  const [screen, location] = await Promise.all([
    db.screen.findUnique({ where: { externalId: parsed.data.screenId } }),
    db.location.findUnique({ where: { id: parsed.data.locationId } }),
  ]);
  if (!screen || !location || location.organisationId !== actor.organisationId) return { status: "error", message: "The selected screen or site is outside your organisation." };
  if (CAMPUS_SCOPED_ROLES.has(actor.role.name)) return { status: "error", message: "Campus-scoped users cannot reassign screens." };
  await db.$transaction([
    db.screen.update({ where: { id: screen.id }, data: { name: parsed.data.name, locationId: location.id } }),
    db.audit.create({ data: { action: "screen.updated", entityType: "Screen", entityId: screen.id, actorId: actor.id, metadata: { screenId: parsed.data.screenId, previousLocationId: screen.locationId, locationId: location.id, name: parsed.data.name } } }),
  ]);
  revalidatePath("/"); revalidatePath("/screens"); revalidatePath(`/screens/${parsed.data.screenId}`);
  return { status: "success", message: `${parsed.data.screenId} was updated safely.` };
}

export async function publishMedia(_state: PublishActionState, formData: FormData): Promise<PublishActionState> {
  const session = await auth();
  if (!session?.user?.email) return { status: "error", message: "Your session has expired. Sign in again." };
  const parsed = schema.safeParse({ screenId: formData.get("screenId"), contentId: formData.get("contentId") });
  if (!parsed.success || !isManagedScreenId(parsed.data.screenId)) return { status: "error", message: "Select an approved media item and try again." };

  const db = getDb();
  const actor = await db.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    include: { role: { include: { permissions: { include: { permission: true } } } } },
  });
  if (!actor || !actor.role.permissions.some(({ permission }) => permission.key === "screen.publish")) {
    return { status: "error", message: "You do not have permission to publish to screens." };
  }
  const screen = await db.screen.findUnique({ where: { externalId: parsed.data.screenId }, include: { location: true } });
  if (!screen || screen.location.organisationId !== actor.organisationId) return { status: "error", message: "The selected screen is outside your organisation." };
  if (CAMPUS_SCOPED_ROLES.has(actor.role.name) && actor.locationId !== screen.locationId) return { status: "error", message: "The selected screen is outside your assigned campus." };

  try {
    const result = await publishScreenMedia({ ...parsed.data, actorId: actor.id });
    revalidatePath("/screens");
    return { status: "success", message: `Published safely. Configuration ${result.configurationVersion.slice(0, 8)} is ready for ${parsed.data.screenId}.` };
  } catch (error) {
    console.error("[screen.publish] failed", { screenId: parsed.data.screenId, contentId: parsed.data.contentId, actorId: actor.id, error });
    return { status: "error", message: error instanceof Error ? error.message : "Publication failed without changing the screen." };
  }
}
