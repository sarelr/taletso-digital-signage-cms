export type XiboDisplay = {
  id: string;
  name: string;
  status: "online" | "offline" | "unknown";
  lastAccessedAt?: string;
};
export type XiboDisplayGroup = { id: string; name: string; displayIds: string[] };
export type XiboMedia = { id: string; name: string; type: string; size: number };
export type XiboScheduleInput = {
  name: string;
  displayGroupId: string;
  playlistId: string;
  startsAt: string;
  endsAt: string;
};
