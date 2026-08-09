import type { XiboDisplay, XiboDisplayGroup, XiboMedia, XiboScheduleInput } from "./types";

export interface XiboAdapter {
  listDisplays(): Promise<XiboDisplay[]>;
  getDisplay(id: string): Promise<XiboDisplay | null>;
  listDisplayGroups(): Promise<XiboDisplayGroup[]>;
  listMedia(): Promise<XiboMedia[]>;
  createSchedule(input: XiboScheduleInput): Promise<{ id: string }>;
  getDisplayStatus(id: string): Promise<XiboDisplay["status"]>;
}

export class MockXiboAdapter implements XiboAdapter {
  private readonly displays: XiboDisplay[] = Array.from({ length: 12 }, (_, index) => ({
    id: `display-${index + 1}`,
    name: `Taletso Display ${String(index + 1).padStart(2, "0")}`,
    status: index === 8 || index === 10 ? "offline" : "online",
    lastAccessedAt: new Date(Date.now() - index * 180_000).toISOString(),
  }));

  async listDisplays() { return this.displays; }
  async getDisplay(id: string) { return this.displays.find((item) => item.id === id) ?? null; }
  async listDisplayGroups() {
    return ["Mahikeng Campus", "Lichtenburg Campus", "Lehurutshe Campus", "Central Offices"].map((name, index) => ({
      id: `group-${index + 1}`, name,
      displayIds: this.displays.slice(index * 3, index * 3 + 3).map((display) => display.id),
    }));
  }
  async listMedia() { return [{ id: "media-1", name: "Welcome to Taletso", type: "image", size: 2_400_000 }]; }
  async createSchedule(input: XiboScheduleInput) { void input; return { id: `schedule-${crypto.randomUUID()}` }; }
  async getDisplayStatus(id: string) { return (await this.getDisplay(id))?.status ?? "unknown"; }
}

type XiboRawDisplay = { displayId?: number | string; display?: string; displayGroupId?: number | string; loggedIn?: number | string; lastAccessed?: string };
type XiboRawGroup = { displayGroupId?: number | string; displayGroup?: string; displays?: Array<{ displayId?: number | string }> };
type XiboRawMedia = { mediaId?: number | string; name?: string; mediaType?: string; fileSize?: number | string };

export class CmsXiboAdapter implements XiboAdapter {
  private token?: { value: string; expiresAt: number };
  constructor(private readonly baseUrl: string, private readonly clientId: string, private readonly clientSecret: string) {}

  private async accessToken() {
    if (this.token && this.token.expiresAt > Date.now() + 30_000) return this.token.value;
    const body = new URLSearchParams({ grant_type: "client_credentials", client_id: this.clientId, client_secret: this.clientSecret });
    const response = await fetch(`${this.baseUrl}/api/authorize/access_token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body, cache: "no-store" });
    if (!response.ok) throw new Error(`Xibo authentication failed (${response.status})`);
    const data = await response.json() as { access_token?: string; expires_in?: number };
    if (!data.access_token) throw new Error("Xibo did not return an access token");
    this.token = { value: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 };
    return data.access_token;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await this.accessToken();
    const response = await fetch(`${this.baseUrl}/api${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Xibo API ${path} failed (${response.status}): ${await response.text()}`);
    return response.json() as Promise<T>;
  }

  async listDisplays(): Promise<XiboDisplay[]> {
    const rows = await this.request<XiboRawDisplay[]>("/display");
    return rows.map((row) => ({
      id: String(row.displayId ?? ""),
      name: row.display ?? `Display ${row.displayId ?? ""}`,
      status: String(row.loggedIn) === "1" ? "online" : "offline",
      lastAccessedAt: row.lastAccessed,
    }));
  }

  async getDisplay(id: string) { return (await this.listDisplays()).find((item) => item.id === id) ?? null; }

  async listDisplayGroups(): Promise<XiboDisplayGroup[]> {
    const rows = await this.request<XiboRawGroup[]>("/displaygroup");
    return rows.map((row) => ({
      id: String(row.displayGroupId ?? ""),
      name: row.displayGroup ?? `Group ${row.displayGroupId ?? ""}`,
      displayIds: (row.displays ?? []).map((display) => String(display.displayId ?? "")).filter(Boolean),
    }));
  }

  async listMedia(): Promise<XiboMedia[]> {
    const rows = await this.request<XiboRawMedia[]>("/library");
    return rows.map((row) => ({ id: String(row.mediaId ?? ""), name: row.name ?? `Media ${row.mediaId ?? ""}`, type: row.mediaType ?? "unknown", size: Number(row.fileSize ?? 0) }));
  }

  async createSchedule(input: XiboScheduleInput): Promise<{ id: string }> {
    const group = (await this.listDisplayGroups()).find((item) => item.name === input.displayGroupId || item.id === input.displayGroupId);
    if (!group) throw new Error(`Xibo display group not found: ${input.displayGroupId}`);

    const body = new URLSearchParams({
      eventTypeId: "1",
      displayGroupIds: group.id,
      fromDt: input.startsAt,
      toDt: input.endsAt,
      playlistId: input.playlistId,
      isPriority: "0",
      displayOrder: "0",
    });
    const result = await this.request<{ eventId?: number | string }>("/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!result.eventId) throw new Error("Xibo schedule response did not include eventId");
    return { id: String(result.eventId) };
  }

  async getDisplayStatus(id: string) { return (await this.getDisplay(id))?.status ?? "unknown"; }
}

export function getXiboAdapter(): XiboAdapter {
  const mode = (process.env.XIBO_MODE ?? "mock").toLowerCase();
  if (mode !== "live") return new MockXiboAdapter();

  const baseUrl = process.env.XIBO_BASE_URL?.replace(/\/$/, "");
  const clientId = process.env.XIBO_CLIENT_ID;
  const clientSecret = process.env.XIBO_CLIENT_SECRET;
  if (!baseUrl || !clientId || !clientSecret) throw new Error("Live Xibo mode requires XIBO_BASE_URL, XIBO_CLIENT_ID and XIBO_CLIENT_SECRET");
  return new CmsXiboAdapter(baseUrl, clientId, clientSecret);
}
