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

export function getXiboAdapter(): XiboAdapter {
  void process.env.XIBO_BASE_URL;
  void process.env.XIBO_CLIENT_ID;
  void process.env.XIBO_CLIENT_SECRET;
  return new MockXiboAdapter();
}
