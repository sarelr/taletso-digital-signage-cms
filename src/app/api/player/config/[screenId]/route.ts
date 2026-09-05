import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { playerRoot } from "@/lib/player/publisher";
import { validatePlayerConfiguration } from "@/lib/player/configuration";
import { isManagedScreenId } from "@/lib/screen-estate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ screenId: string }> }) {
  const { screenId } = await params;
  if (!isManagedScreenId(screenId)) return NextResponse.json({ error: "Invalid screen identity." }, { status: 400 });
  try {
    const configuration = validatePlayerConfiguration(JSON.parse(await readFile(path.join(playerRoot(), `${screenId.toLowerCase()}.json`), "utf8")), true);
    return NextResponse.json(configuration, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("[player.config] unavailable", { screenId, error });
    return NextResponse.json({ error: "No valid published configuration is available." }, { status: 404 });
  }
}
