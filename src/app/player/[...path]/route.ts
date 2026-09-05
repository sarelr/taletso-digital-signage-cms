import { playerAssetResponse } from "@/lib/player/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  return playerAssetResponse(request, (await params).path);
}
