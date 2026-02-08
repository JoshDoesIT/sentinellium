/**
 * @module RBAC Guard
 * @description Role-based access control enforcement.
 * Four enterprise roles with hierarchical permissions.
 * Guards engine config, policy editing, alert management, and user admin.
 */

/* ── Enums ── */

/** Enterprise roles with distinct permission sets. */
export const Role = {
  ADMIN: "ADMIN",
  ANALYST: "ANALYST",
  VIEWER: "VIEWER",
  POLICY_AUTHOR: "POLICY_AUTHOR",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

/** Granular permissions guarding specific actions. */
export const Permission = {
  MANAGE_USERS: "MANAGE_USERS",
  EDIT_POLICIES: "EDIT_POLICIES",
  MANAGE_ALERTS: "MANAGE_ALERTS",
  VIEW_DASHBOARD: "VIEW_DASHBOARD",
  CONFIGURE_ENGINES: "CONFIGURE_ENGINES",
  MANAGE_API_KEYS: "MANAGE_API_KEYS",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

/* ── Role → Permission Map ── */

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  [Role.ADMIN]: [
    Permission.MANAGE_USERS,
    Permission.EDIT_POLICIES,
    Permission.MANAGE_ALERTS,
    Permission.VIEW_DASHBOARD,
    Permission.CONFIGURE_ENGINES,
    Permission.MANAGE_API_KEYS,
  ],
  [Role.ANALYST]: [Permission.MANAGE_ALERTS, Permission.VIEW_DASHBOARD],
  [Role.VIEWER]: [Permission.VIEW_DASHBOARD],
  [Role.POLICY_AUTHOR]: [Permission.EDIT_POLICIES, Permission.VIEW_DASHBOARD],
};

/* ── Guard ── */

/**
 * Enforces role-based access control.
 * Check permissions before executing privileged operations.
 */
export class RbacGuard {
  /**
   * Check whether a role has a specific permission.
   *
   * @param role - Enterprise role
   * @param permission - Action to check
   * @returns True if the role has the permission
   */
  can(role: Role, permission: Permission): boolean {
    return ROLE_PERMISSIONS[role].includes(permission);
  }

  /**
   * Enforce a permission check. Throws if the role lacks the permission.
   *
   * @param role - Enterprise role
   * @param permission - Action to enforce
   * @throws Error with role/permission context
   */
  enforce(role: Role, permission: Permission): void {
    if (!this.can(role, permission)) {
      throw new Error(
        `Access denied: ${role} does not have ${permission} permission`,
      );
    }
  }

  /**
   * Get all permissions for a role.
   *
   * @param role - Enterprise role
   * @returns Array of permissions granted to the role
   */
  getPermissions(role: Role): Permission[] {
    return [...ROLE_PERMISSIONS[role]];
  }
}
