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
    return ["Mahikeng", "Lichtenburg", "Lehurutshe", "Central Offices"].map((name, index) => ({
      id: `group-${index + 1}`, name,
      displayIds: this.displays.slice(index * 3, index * 3 + 3).map((display) => display.id),
    }));
  }
  async listMedia() {
    return [{ id: "media-1", name: "Welcome to Taletso", type: "image", size: 2_400_000 }];
  }
  async createSchedule(input: XiboScheduleInput) {
    void input;
    return { id: `schedule-${crypto.randomUUID()}` };
  }
  async getDisplayStatus(id: string) {
    return (await this.getDisplay(id))?.status ?? "unknown";
  }
}

type XiboApiDisplay = {
  displayId: number;
  display: string;
  loggedIn?: number;
  lastAccessed?: number;
  displayGroups?: Array<{ displayGroupId: number; displayGroup: string }>;
};

export class LiveXiboAdapter implements XiboAdapter {
  private token: { value: string; expiresAt: number } | null = null;

  constructor(
    private readonly baseUrl: string,
    private readonly clientId: string,
    private readonly clientSecret: string,
  ) {}

  private async accessToken() {
    if (this.token && this.token.expiresAt > Date.now() + 30_000) return this.token.value;
    const response = await fetch(`${this.baseUrl}/api/authorize/access_token`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "client_credentials", client_id: this.clientId, client_secret: this.clientSecret }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`Xibo authorization failed with HTTP ${response.status}`);
    const body = await response.json() as { access_token: string; expires_in?: number };
    this.token = { value: body.access_token, expiresAt: Date.now() + (body.expires_in ?? 300) * 1_000 };
    return body.access_token;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}/api${path}`, {
      ...init,
      headers: { authorization: `Bearer ${await this.accessToken()}`, ...init?.headers },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`Xibo API ${path} failed with HTTP ${response.status}`);
    return response.json() as Promise<T>;
  }

  async listDisplays() {
    const displays = await this.request<XiboApiDisplay[]>("/display?embed=displaygroups&length=1000");
    return displays.map((display) => ({
      id: String(display.displayId),
      name: display.display,
      status: display.loggedIn === 1 ? "online" as const : display.loggedIn === 0 ? "offline" as const : "unknown" as const,
      lastAccessedAt: display.lastAccessed ? new Date(display.lastAccessed * 1_000).toISOString() : undefined,
    }));
  }

  async getDisplay(id: string) {
    const displays = await this.request<XiboApiDisplay[]>(`/display?displayId=${encodeURIComponent(id)}&embed=displaygroups`);
    const display = displays[0];
    if (!display) return null;
    return {
      id: String(display.displayId), name: display.display,
      status: display.loggedIn === 1 ? "online" as const : display.loggedIn === 0 ? "offline" as const : "unknown" as const,
      lastAccessedAt: display.lastAccessed ? new Date(display.lastAccessed * 1_000).toISOString() : undefined,
    };
  }

  async listDisplayGroups() {
    const displays = await this.request<XiboApiDisplay[]>("/display?embed=displaygroups&length=1000");
    const groups = new Map<string, XiboDisplayGroup>();
    for (const display of displays) for (const group of display.displayGroups ?? []) {
      const id = String(group.displayGroupId);
      const current = groups.get(id) ?? { id, name: group.displayGroup, displayIds: [] };
      current.displayIds.push(String(display.displayId));
      groups.set(id, current);
    }
    return [...groups.values()];
  }

  async listMedia() {
    const media = await this.request<Array<{ mediaId: number; name: string; mediaType: string; fileSize?: number }>>("/library?length=1000");
    return media.map((item) => ({ id: String(item.mediaId), name: item.name, type: item.mediaType, size: item.fileSize ?? 0 }));
  }

  async createSchedule(input: XiboScheduleInput) {
    const body = new URLSearchParams({ eventTypeId: "1", displayOrder: "0", isPriority: "0", campaignId: input.playlistId, fromDt: input.startsAt, toDt: input.endsAt, name: input.name });
    body.append("displayGroupIds[]", input.displayGroupId);
    const schedule = await this.request<{ eventId: number }>("/schedule", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body });
    return { id: String(schedule.eventId) };
  }

  async getDisplayStatus(id: string) { return (await this.getDisplay(id))?.status ?? "unknown"; }
}

export function getXiboAdapter(): XiboAdapter {
  if (process.env.XIBO_MODE !== "live") return new MockXiboAdapter();
  const baseUrl = process.env.XIBO_BASE_URL?.replace(/\/$/, "");
  const clientId = process.env.XIBO_CLIENT_ID;
  const clientSecret = process.env.XIBO_CLIENT_SECRET;
  if (!baseUrl || !clientId || !clientSecret) throw new Error("Live Xibo mode requires XIBO_BASE_URL, XIBO_CLIENT_ID and XIBO_CLIENT_SECRET.");
  return new LiveXiboAdapter(baseUrl, clientId, clientSecret);
}
