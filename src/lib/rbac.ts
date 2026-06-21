export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

export const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  VIEWER: 0,
  MEMBER: 1,
  ADMIN: 2,
  OWNER: 3,
};

export function hasMinRole(
  userRole: WorkspaceRole | null | undefined,
  minRole: WorkspaceRole
): boolean {
  if (!userRole) return false;
  return (ROLE_HIERARCHY[userRole] ?? -1) >= ROLE_HIERARCHY[minRole];
}

export function canWrite(userRole: WorkspaceRole | null | undefined): boolean {
  return hasMinRole(userRole, "MEMBER");
}

export function canAdmin(userRole: WorkspaceRole | null | undefined): boolean {
  return hasMinRole(userRole, "ADMIN");
}
