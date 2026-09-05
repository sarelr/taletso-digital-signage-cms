import "server-only";

export const heartbeatOnlineWindowMs = 90_000;

export function heartbeatSnapshot() {
  // A dynamic server request uses one stable clock value for every status calculation in that response.
  return new Date().getTime();
}

export function isHeartbeatOnline(lastHeartbeatAt: Date | null, snapshot: number) {
  return Boolean(lastHeartbeatAt && snapshot - lastHeartbeatAt.getTime() <= heartbeatOnlineWindowMs);
}
