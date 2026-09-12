import { timingSafeEqual } from "node:crypto";
import { z } from "zod";

const supportedSourceTypes = ["Announcement", "GalleryImage", "LiveStream", "PublicFeedPost"] as const;

export const base44ContentSchema = z.object({
  sourceType: z.enum(supportedSourceTypes),
  sourceId: z.string().trim().min(1).max(200),
  title: z.string().trim().min(1).max(160),
  url: z.string().url().max(2048),
  mediaType: z.enum(["IMAGE", "VIDEO", "WEBPAGE"]),
  sourceUpdatedAt: z.iso.datetime({ offset: true }).optional(),
}).strict();

export function validIntegrationSecret(authorization: string | null, expected: string | undefined) {
  if (!expected || expected.length < 32 || !authorization?.startsWith("Bearer ")) return false;
  const suppliedBytes = Buffer.from(authorization.slice(7));
  const expectedBytes = Buffer.from(expected);
  return suppliedBytes.length === expectedBytes.length && timingSafeEqual(suppliedBytes, expectedBytes);
}
