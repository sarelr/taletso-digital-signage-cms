import "server-only";
import { z } from "zod";

const recordBase = z.object({ id: z.string(), updated_date: z.string().optional(), created_date: z.string().optional() }).passthrough();
const announcementSchema = recordBase.extend({ title: z.string(), audience: z.string().optional() });
const gallerySchema = recordBase.extend({ caption: z.string().optional(), image: z.string().url() });
const streamSchema = recordBase.extend({ title: z.string(), facebook_url: z.string().url(), status: z.enum(["upcoming", "live", "ended"]) });
const postSchema = recordBase.extend({ title: z.string().optional(), body: z.string(), mediaType: z.enum(["Text", "Image", "Video"]), mediaUrl: z.string().url().optional().or(z.literal("")) });

export type Base44ImportedContent = {
  sourceType: "Announcement" | "GalleryImage" | "LiveStream" | "PublicFeedPost";
  sourceId: string;
  title: string;
  type: "IMAGE" | "VIDEO" | "WEBPAGE";
  url: string;
  sourceUpdatedAt: Date | null;
};

function timestamp(record: z.infer<typeof recordBase>) {
  const value = record.updated_date ?? record.created_date;
  return value ? new Date(value) : null;
}

async function invoke<T>(appUrl: string, functionName: string, schema: z.ZodType<T>): Promise<T> {
  const response = await fetch(`${appUrl}/functions/${functionName}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Base44 ${functionName} returned ${response.status}.`);
  return schema.parse(await response.json());
}

export async function fetchBase44PublicContent(appUrl = process.env.BASE44_PUBLIC_APP_URL) {
  if (!appUrl) throw new Error("BASE44_PUBLIC_APP_URL is not configured.");
  const normalizedUrl = appUrl.replace(/\/$/, "");
  const [announcementData, galleryData, streamData, postData] = await Promise.all([
    invoke(normalizedUrl, "getPublicAnnouncements", z.object({ announcements: z.array(announcementSchema) })),
    invoke(normalizedUrl, "getPublicGalleryImages", z.object({ images: z.array(gallerySchema) })),
    invoke(normalizedUrl, "getPublicLiveStreams", z.object({ streams: z.array(streamSchema) })),
    invoke(normalizedUrl, "getPublicFeedPosts", z.object({ posts: z.array(postSchema) })),
  ]);

  const items: Base44ImportedContent[] = [
    ...announcementData.announcements.filter(item => item.audience === "All").map(item => ({ sourceType: "Announcement" as const, sourceId: item.id, title: item.title, type: "WEBPAGE" as const, url: normalizedUrl, sourceUpdatedAt: timestamp(item) })),
    ...galleryData.images.map(item => ({ sourceType: "GalleryImage" as const, sourceId: item.id, title: item.caption?.trim() || "Taletso gallery image", type: "IMAGE" as const, url: item.image, sourceUpdatedAt: timestamp(item) })),
    ...streamData.streams.filter(item => item.status !== "ended").map(item => ({ sourceType: "LiveStream" as const, sourceId: item.id, title: item.title, type: "WEBPAGE" as const, url: item.facebook_url, sourceUpdatedAt: timestamp(item) })),
    ...postData.posts.map(item => ({ sourceType: "PublicFeedPost" as const, sourceId: item.id, title: item.title?.trim() || item.body.slice(0, 160), type: item.mediaType === "Image" && item.mediaUrl ? "IMAGE" as const : item.mediaType === "Video" && item.mediaUrl ? "VIDEO" as const : "WEBPAGE" as const, url: item.mediaUrl || normalizedUrl, sourceUpdatedAt: timestamp(item) })),
  ];
  return items;
}
