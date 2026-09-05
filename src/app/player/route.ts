import { candidateIndexResponse } from "@/lib/player/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() { return candidateIndexResponse(); }
