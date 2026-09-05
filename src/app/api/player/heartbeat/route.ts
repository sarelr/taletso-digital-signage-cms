import { z } from "zod";
import { getDb } from "@/lib/db";
import { isManagedScreenId } from "@/lib/screen-estate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const heartbeatSchema = z.object({
  screenId: z.string().regex(/^SCREEN-[0-9]{3}$/),
  deviceId: z.string().uuid(),
  playerVersion: z.string().trim().min(1).max(40),
  currentMedia: z.string().regex(/^media\/[A-Za-z0-9][A-Za-z0-9._-]*$/).nullable(),
});

export async function POST(request: Request) {
  let parsed;
  try { parsed = heartbeatSchema.safeParse(await request.json()); }
  catch { return Response.json({ error: "Invalid heartbeat payload." }, { status: 400 }); }
  if (!parsed.success || !isManagedScreenId(parsed.data.screenId)) return Response.json({ error: "Invalid heartbeat payload." }, { status: 400 });

  const db = getDb();
  const screen = await db.screen.findUnique({ where: { externalId: parsed.data.screenId }, select: { id: true, deviceId: true } });
  if (!screen) return Response.json({ error: "Screen is not registered." }, { status: 404 });
  if (screen.deviceId && screen.deviceId !== parsed.data.deviceId) return Response.json({ error: "Device identity does not match the registered screen." }, { status: 409 });

  const now = new Date();
  await db.screen.update({
    where: { id: screen.id },
    data: { deviceId: screen.deviceId ?? parsed.data.deviceId, playerVersion: parsed.data.playerVersion, reportedMedia: parsed.data.currentMedia, lastSeenAt: now, lastHeartbeatAt: now, status: "ONLINE" },
  });
  return Response.json({ accepted: true, serverTime: now.toISOString() }, { headers: { "Cache-Control": "no-store" } });
}
