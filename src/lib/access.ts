export const CAMPUS_SCOPED_ROLES = new Set([
  "Campus Content Manager",
  "Contributor",
  "Approver",
  "Viewer",
]);

export type AccessContext = { role: string; locationId: string | null };

export function locationFilter(context: AccessContext) {
  return CAMPUS_SCOPED_ROLES.has(context.role)
    ? { locationId: context.locationId ?? "__unassigned__" }
    : {};
}

export function canApproveContent(
  approverId: string,
  contentOwnerId: string,
  permissions: string[],
): boolean {
  return permissions.includes("content.approve") && approverId !== contentOwnerId;
}
