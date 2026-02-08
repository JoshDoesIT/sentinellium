/**
 * @module RBAC Guard Tests
 * @description TDD tests for role-based access control enforcement.
 * Four roles: Admin, Analyst, Viewer, Policy Author.
 * Hierarchical permissions for engine config, policy editing, alert management.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { RbacGuard, Role, Permission } from "./rbac-guard";

describe("RbacGuard", () => {
  let guard: RbacGuard;

  beforeEach(() => {
    guard = new RbacGuard();
  });

  /* ── Role Definitions ── */

  describe("roles", () => {
    it("defines all four enterprise roles", () => {
      expect(Role.ADMIN).toBe("ADMIN");
      expect(Role.ANALYST).toBe("ANALYST");
      expect(Role.VIEWER).toBe("VIEWER");
      expect(Role.POLICY_AUTHOR).toBe("POLICY_AUTHOR");
    });
  });

  /* ── Permission Checks ── */

  describe("can", () => {
    it("grants Admin all permissions", () => {
      expect(guard.can(Role.ADMIN, Permission.MANAGE_USERS)).toBe(true);
      expect(guard.can(Role.ADMIN, Permission.EDIT_POLICIES)).toBe(true);
      expect(guard.can(Role.ADMIN, Permission.MANAGE_ALERTS)).toBe(true);
      expect(guard.can(Role.ADMIN, Permission.VIEW_DASHBOARD)).toBe(true);
      expect(guard.can(Role.ADMIN, Permission.CONFIGURE_ENGINES)).toBe(true);
      expect(guard.can(Role.ADMIN, Permission.MANAGE_API_KEYS)).toBe(true);
    });

    it("grants Analyst alert and dashboard access but not admin actions", () => {
      expect(guard.can(Role.ANALYST, Permission.MANAGE_ALERTS)).toBe(true);
      expect(guard.can(Role.ANALYST, Permission.VIEW_DASHBOARD)).toBe(true);
      expect(guard.can(Role.ANALYST, Permission.MANAGE_USERS)).toBe(false);
      expect(guard.can(Role.ANALYST, Permission.EDIT_POLICIES)).toBe(false);
    });

    it("grants Viewer read-only dashboard access", () => {
      expect(guard.can(Role.VIEWER, Permission.VIEW_DASHBOARD)).toBe(true);
      expect(guard.can(Role.VIEWER, Permission.MANAGE_ALERTS)).toBe(false);
      expect(guard.can(Role.VIEWER, Permission.EDIT_POLICIES)).toBe(false);
      expect(guard.can(Role.VIEWER, Permission.MANAGE_USERS)).toBe(false);
    });

    it("grants Policy Author policy editing and dashboard access", () => {
      expect(guard.can(Role.POLICY_AUTHOR, Permission.EDIT_POLICIES)).toBe(
        true,
      );
      expect(guard.can(Role.POLICY_AUTHOR, Permission.VIEW_DASHBOARD)).toBe(
        true,
      );
      expect(guard.can(Role.POLICY_AUTHOR, Permission.MANAGE_USERS)).toBe(
        false,
      );
      expect(guard.can(Role.POLICY_AUTHOR, Permission.MANAGE_ALERTS)).toBe(
        false,
      );
    });
  });

  /* ── Guard Enforcement ── */

  describe("enforce", () => {
    it("does not throw when role has permission", () => {
      expect(() =>
        guard.enforce(Role.ADMIN, Permission.MANAGE_USERS),
      ).not.toThrow();
    });

    it("throws AccessDenied when role lacks permission", () => {
      expect(() => guard.enforce(Role.VIEWER, Permission.MANAGE_USERS)).toThrow(
        "Access denied",
      );
    });

    it("includes role and permission in error message", () => {
      expect(() => guard.enforce(Role.VIEWER, Permission.MANAGE_USERS)).toThrow(
        /VIEWER.*MANAGE_USERS/,
      );
    });
  });

  /* ── Role Hierarchy ── */

  describe("getPermissions", () => {
    it("returns all permissions for Admin", () => {
      const perms = guard.getPermissions(Role.ADMIN);
      expect(perms).toContain(Permission.MANAGE_USERS);
      expect(perms).toContain(Permission.EDIT_POLICIES);
      expect(perms).toContain(Permission.MANAGE_ALERTS);
      expect(perms).toContain(Permission.VIEW_DASHBOARD);
      expect(perms).toContain(Permission.CONFIGURE_ENGINES);
      expect(perms).toContain(Permission.MANAGE_API_KEYS);
    });

    it("returns limited permissions for Viewer", () => {
      const perms = guard.getPermissions(Role.VIEWER);
      expect(perms).toEqual([Permission.VIEW_DASHBOARD]);
    });

    it("returns independent permissions for each role", () => {
      const analystPerms = guard.getPermissions(Role.ANALYST);
      const authorPerms = guard.getPermissions(Role.POLICY_AUTHOR);
      // Analyst has alerts but not policies; author has policies but not alerts
      expect(analystPerms).toContain(Permission.MANAGE_ALERTS);
      expect(analystPerms).not.toContain(Permission.EDIT_POLICIES);
      expect(authorPerms).toContain(Permission.EDIT_POLICIES);
      expect(authorPerms).not.toContain(Permission.MANAGE_ALERTS);
    });
  });
});
