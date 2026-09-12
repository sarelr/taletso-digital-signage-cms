"use server";

import { ContentStatus, type Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { fetchBase44PublicContent } from "@/lib/integrations/base44-sync";

export type Base44SyncState = { message: string; ok: boolean };

export async function syncBase44Content(_state: Base44SyncState): Promise<Base44SyncState> {
  void _state;
  const session = await auth();
  if (!session?.user?.email) return { ok: false, message: "Sign in again." };
  const db = getDb();
  const actor = await db.user.findUnique({ where: { email: session.user.email.toLowerCase() }, include: { role: { include: { permissions: { include: { permission: true } } } } } });
  if (!actor?.role.permissions.some(({ permission }) => permission.key === "media.upload")) return { ok: false, message: "Permission denied." };

  try {
    const items = await fetchBase44PublicContent();
    let created = 0; let updated = 0; let unchanged = 0;
    for (const item of items) {
      const source = { sourceSystem: "base44", sourceType: item.sourceType, sourceId: item.sourceId };
      const existing = await db.content.findUnique({ where: { sourceSystem_sourceType_sourceId: source }, select: { id: true, sourceUpdatedAt: true } });
      if (existing?.sourceUpdatedAt && item.sourceUpdatedAt && existing.sourceUpdatedAt >= item.sourceUpdatedAt) { unchanged++; continue; }
      await db.$transaction(async transaction => {
        const saved = existing
          ? await transaction.content.update({ where: { id: existing.id }, data: { title: item.title, type: item.type, url: item.url, status: ContentStatus.DRAFT, sourceUpdatedAt: item.sourceUpdatedAt } })
          : await transaction.content.create({ data: { ...source, title: item.title, type: item.type, url: item.url, status: ContentStatus.DRAFT, sourceUpdatedAt: item.sourceUpdatedAt, ownerId: actor.id } });
        await transaction.audit.create({ data: { action: existing ? "integration.base44.updated" : "integration.base44.imported", entityType: "Content", entityId: saved.id, actorId: actor.id, metadata: source satisfies Prisma.InputJsonValue } });
      });
      if (existing) updated++; else created++;
    }
    revalidatePath("/content"); revalidatePath("/audit"); revalidatePath("/settings");
    return { ok: true, message: `Base44 sync complete: ${created} new, ${updated} updated, ${unchanged} unchanged.` };
  } catch (error) {
    console.error("[base44.sync] failed", { actorId: actor.id, error: error instanceof Error ? error.message : "unknown" });
    return { ok: false, message: error instanceof Error ? error.message : "Base44 sync failed." };
  }
}
