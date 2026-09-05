import { randomUUID } from "node:crypto";

export type PlayerConfiguration = {
  screenId: string;
  name: string;
  site: string;
  status: "online" | "offline" | "unknown";
  contentType: "image" | "video";
  media: string;
  refreshSeconds: number;
  configurationVersion: string;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validatePlayerConfiguration(value: unknown, allowLegacyVersion = false): PlayerConfiguration {
  if (!value || typeof value !== "object") throw new Error("Player configuration must be an object.");
  const item = value as Record<string, unknown>;
  if (typeof item.screenId !== "string" || !/^SCREEN-[0-9]{3}$/.test(item.screenId)) throw new Error("Invalid screen identity.");
  if (typeof item.name !== "string" || item.name.length < 1 || item.name.length > 160) throw new Error("Invalid screen name.");
  if (typeof item.site !== "string" || item.site.length < 1 || item.site.length > 160) throw new Error("Invalid site name.");
  if (item.status !== "online" && item.status !== "offline" && item.status !== "unknown") throw new Error("Invalid configuration status.");
  if (item.contentType !== "image" && item.contentType !== "video") throw new Error("Invalid content type.");
  if (typeof item.media !== "string" || !/^media\/[A-Za-z0-9][A-Za-z0-9._-]*$/.test(item.media)) throw new Error("Invalid media path.");
  if (!Number.isInteger(item.refreshSeconds) || Number(item.refreshSeconds) < 5 || Number(item.refreshSeconds) > 300) throw new Error("Invalid refresh interval.");
  if ((!allowLegacyVersion || item.configurationVersion !== undefined) && (typeof item.configurationVersion !== "string" || !uuidPattern.test(item.configurationVersion))) throw new Error("Invalid configuration version.");
  return item as PlayerConfiguration;
}

export function createPlayerConfiguration(input: Omit<PlayerConfiguration, "configurationVersion">): PlayerConfiguration {
  return validatePlayerConfiguration({ ...input, configurationVersion: randomUUID() });
}

export function playerContentType(mimeType: string): "image" | "video" {
  if (["image/jpeg", "image/png", "image/webp", "image/svg+xml"].includes(mimeType)) return "image";
  if (mimeType === "video/mp4") return "video";
  throw new Error(`Unsupported media MIME type: ${mimeType}`);
}
