import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { playerRoot } from "./publisher";

const mediaTypes: Record<string, string> = {
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
};

function streamBody(filename: string, start?: number, end?: number): ReadableStream {
  return Readable.toWeb(createReadStream(filename, start === undefined ? undefined : { start, end })) as ReadableStream;
}

export async function candidateIndexResponse() {
  const filename = path.resolve(process.env.TDCP_CANDIDATE_INDEX || path.join(process.cwd(), "player", "phase2-candidate", "index.html"));
  try {
    return new Response(await readFile(filename), { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("[player.index] unavailable", { filename, error });
    return Response.json({ error: "Candidate player is unavailable." }, { status: 503 });
  }
}

export async function playerAssetResponse(request: Request, segments: string[]) {
  if (!segments.length || segments.some((segment) => !segment || segment === "." || segment === ".." || segment.startsWith("."))) {
    return Response.json({ error: "Invalid player asset path." }, { status: 400 });
  }
  const root = playerRoot();
  const filename = path.resolve(root, ...segments);
  if (!filename.startsWith(`${root}${path.sep}`)) return Response.json({ error: "Invalid player asset path." }, { status: 400 });
  const contentType = mediaTypes[path.extname(filename).toLowerCase()];
  if (!contentType) return Response.json({ error: "Unsupported player asset type." }, { status: 415 });

  try {
    const details = await stat(filename);
    if (!details.isFile()) return Response.json({ error: "Player asset not found." }, { status: 404 });
    const cacheControl = contentType.startsWith("application/json") ? "no-store, max-age=0" : "public, max-age=300";
    const headers = new Headers({ "Content-Type": contentType, "Cache-Control": cacheControl, "Accept-Ranges": "bytes", "X-Content-Type-Options": "nosniff" });
    const range = request.headers.get("range");
    if (range) {
      const match = /^bytes=(\d+)-(\d*)$/.exec(range);
      if (!match) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${details.size}` } });
      const start = Number(match[1]);
      const end = match[2] ? Math.min(Number(match[2]), details.size - 1) : details.size - 1;
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end || start >= details.size) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${details.size}` } });
      headers.set("Content-Length", String(end - start + 1));
      headers.set("Content-Range", `bytes ${start}-${end}/${details.size}`);
      return new Response(streamBody(filename, start, end), { status: 206, headers });
    }
    headers.set("Content-Length", String(details.size));
    return new Response(streamBody(filename), { headers });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") console.error("[player.asset] unavailable", { filename, error });
    return Response.json({ error: "Player asset not found." }, { status: 404 });
  }
}
