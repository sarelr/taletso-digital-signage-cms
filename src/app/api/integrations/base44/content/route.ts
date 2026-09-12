import { ContentStatus, type Prisma } from "@prisma/client";
import { getDb } from "@/lib/db";
import { base44ContentSchema, validIntegrationSecret } from "@/lib/integrations/base44";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!validIntegrationSecret(request.headers.get("authorization"), process.env.BASE44_INTEGRATION_SECRET)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Invalid JSON." }, { status: 400 }); }
  const parsed = base44ContentSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid Base44 content payload." }, { status: 400 });

  const ownerEmail = process.env.BASE44_IMPORT_OWNER_EMAIL?.trim().toLowerCase();
  if (!ownerEmail) return Response.json({ error: "Integration owner is not configured." }, { status: 503 });
  const db = getDb();
  const owner = await db.user.findUnique({ where: { email: ownerEmail }, select: { id: true } });
  if (!owner) return Response.json({ error: "Integration owner is unavailable." }, { status: 503 });

  const source = { sourceSystem: "base44", sourceType: parsed.data.sourceType, sourceId: parsed.data.sourceId };
  const sourceUpdatedAt = parsed.data.sourceUpdatedAt ? new Date(parsed.data.sourceUpdatedAt) : null;
  const existing = await db.content.findUnique({ where: { sourceSystem_sourceType_sourceId: source }, select: { id: true, sourceUpdatedAt: true } });
  if (existing?.sourceUpdatedAt && sourceUpdatedAt && existing.sourceUpdatedAt >= sourceUpdatedAt) {
    return Response.json({ id: existing.id, result: "unchanged" });
  }

  const content = await db.$transaction(async (transaction) => {
    const saved = existing
      ? await transaction.content.update({ where: { id: existing.id }, data: { title: parsed.data.title, type: parsed.data.mediaType, url: parsed.data.url, status: ContentStatus.DRAFT, sourceUpdatedAt } })
      : await transaction.content.create({ data: { ...source, title: parsed.data.title, type: parsed.data.mediaType, url: parsed.data.url, status: ContentStatus.DRAFT, sourceUpdatedAt, ownerId: owner.id } });
    await transaction.audit.create({ data: { action: existing ? "integration.base44.updated" : "integration.base44.imported", entityType: "Content", entityId: saved.id, actorId: owner.id, metadata: source satisfies Prisma.InputJsonValue } });
    return saved;
  });
  return Response.json({ id: content.id, result: existing ? "updated" : "created", status: content.status }, { status: existing ? 200 : 201 });
}
