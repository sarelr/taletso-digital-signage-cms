export const managedScreenIds = Array.from(
  { length: 12 },
  (_, index) => `SCREEN-${String(index + 1).padStart(3, "0")}`,
);

const managedScreenIdSet = new Set(managedScreenIds);

export function isManagedScreenId(value: string): boolean {
  return managedScreenIdSet.has(value);
}
