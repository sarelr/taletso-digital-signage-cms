"use server";

import { ContentStatus, ContentType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireCurrentUser } from "@/lib/current-user";
import { CAMPUS_SCOPED_ROLES } from "@/lib/access";

const createSchema = z.object({
  title: z.string().min(3).max(120),
  type: z.nativeEnum(ContentType),
  url: z.string().url().optional().or(z.literal("")),
  locationId: z.string().optional(),
});

export async function createContent(formData: FormData) {
  const user = await requireCurrentUser();
  if (!user.permissionKeys.includes("content.create")) throw new Error("Forbidden");

  const parsed = createSchema.parse({
    title: formData.get("title"),
    type: formData.get("type"),
    url: formData.get("url"),
    locationId: formData.get("locationId") || undefined,
  });

  const locationId = CAMPUS_SCOPED_ROLES.has(user.role.name)
    ? user.locationId
    : parsed.locationId || null;

  if (CAMPUS_SCOPED_ROLES.has(user.role.name) && !locationId) throw new Error("Campus assignment required");

  const content = await db.content.create({
    data: {
      title: parsed.title,
      type: parsed.type,
      url: parsed.url || null,
      ownerId: user.id,
      locationId,
    },
  });

  await db.audit.create({ data: { action: "content.created", entityType: "Content", entityId: content.id, actorId: user.id } });
  revalidatePath("/content");
  revalidatePath("/");
}

export async function submitContent(formData: FormData) {
  const user = await requireCurrentUser();
  const contentId = z.string().min(1).parse(formData.get("contentId"));
  const content = await db.content.findUnique({ where: { id: contentId } });
  if (!content) throw new Error("Content not found");
  if (content.ownerId !== user.id && !user.permissionKeys.includes("content.approve")) throw new Error("Forbidden");
  if (content.status !== ContentStatus.DRAFT) throw new Error("Only draft content can be submitted");

  await db.content.update({ where: { id: contentId }, data: { status: ContentStatus.PENDING_APPROVAL } });
  await db.audit.create({ data: { action: "content.submitted", entityType: "Content", entityId: contentId, actorId: user.id } });
  revalidatePath("/content");
  revalidatePath("/approvals");
  revalidatePath("/");
}
