import { randomUUID } from "node:crypto";
import { mkdir, open, rename, rm } from "node:fs/promises";
import path from "node:path";
import { playerRoot } from "./player/publisher.ts";

export const maxMediaBytes = 100 * 1024 * 1024;

type ValidatedMedia = { bytes: Uint8Array; mimeType: string; extension: string; originalFilename: string };

function safeOriginalName(name: string) {
  const base = path.basename(name).replace(/[^A-Za-z0-9._ -]/g, "_").trim();
  if (!base || base.length > 180) throw new Error("The media filename is invalid or too long.");
  return base;
}

export async function validateMediaFile(file: File): Promise<ValidatedMedia> {
  if (file.size < 1 || file.size > maxMediaBytes) throw new Error("Media must be between 1 byte and 100 MB.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const head = bytes.subarray(0, Math.min(bytes.length, 4096));
  const textHead = new TextDecoder("utf-8", { fatal: false }).decode(head).trimStart().toLowerCase();
  let mimeType = ""; let extension = "";
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) { mimeType = "image/jpeg"; extension = ".jpg"; }
  else if (head.slice(0, 8).every((value, index) => value === [0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a][index])) { mimeType = "image/png"; extension = ".png"; }
  else if (new TextDecoder().decode(head.slice(0, 4)) === "RIFF" && new TextDecoder().decode(head.slice(8, 12)) === "WEBP") { mimeType = "image/webp"; extension = ".webp"; }
  else if (new TextDecoder().decode(head.slice(4, 8)) === "ftyp") { mimeType = "video/mp4"; extension = ".mp4"; }
  else if (textHead.startsWith("<svg") || (textHead.startsWith("<?xml") && textHead.includes("<svg"))) {
    const complete = new TextDecoder("utf-8", { fatal: true }).decode(bytes).toLowerCase();
    if (/<script\b|\son[a-z]+\s*=|javascript:|<foreignobject\b|(?:href|xlink:href)\s*=\s*["'](?:https?:|\/\/|data:)/i.test(complete)) throw new Error("SVG contains executable or external content.");
    mimeType = "image/svg+xml"; extension = ".svg";
  }
  if (!mimeType) throw new Error("Unsupported or unrecognized media format.");
  return { bytes, mimeType, extension, originalFilename: safeOriginalName(file.name) };
}

export async function storeMediaFile(media: ValidatedMedia) {
  const mediaDirectory = path.join(playerRoot(), "media");
  await mkdir(mediaDirectory, { recursive: true });
  const filename = `${randomUUID()}${media.extension}`;
  const absolutePath = path.join(mediaDirectory, filename);
  const handle = await open(absolutePath, "wx", 0o640);
  try { await handle.writeFile(media.bytes); await handle.sync(); }
  finally { await handle.close(); }
  return { filename, absolutePath, playerPath: `media/${filename}` };
}

export async function removeStoredMedia(absolutePath: string) { await rm(absolutePath, { force: true }); }

const protectedMediaFiles = new Set([
  "taletso-welcome.svg",
  "test-screen.svg",
  "test-screen-2.svg",
]);

export function storedMediaPath(playerPath: string) {
  const normalized = playerPath.replaceAll("\\", "/");
  if (!/^media\/[A-Za-z0-9][A-Za-z0-9._-]*$/.test(normalized)) {
    throw new Error("The media storage path is invalid.");
  }
  const filename = normalized.slice("media/".length);
  if (protectedMediaFiles.has(filename)) {
    throw new Error("Built-in TDCP media cannot be deleted.");
  }
  const mediaDirectory = path.resolve(playerRoot(), "media");
  const absolutePath = path.resolve(mediaDirectory, filename);
  if (path.dirname(absolutePath) !== mediaDirectory) {
    throw new Error("The media storage path is outside the managed library.");
  }
  return { absolutePath, filename };
}

export async function quarantineStoredMedia(playerPath: string) {
  const { absolutePath, filename } = storedMediaPath(playerPath);
  const quarantineDirectory = path.resolve(playerRoot(), ".deleted-media");
  await mkdir(quarantineDirectory, { recursive: true });
  const quarantinePath = path.join(quarantineDirectory, `${randomUUID()}-${filename}`);
  await rename(absolutePath, quarantinePath);
  return { absolutePath, quarantinePath, filename };
}
