/**
 * @module User Manager Tests
 * @description TDD tests for tenant-scoped user CRUD operations.
 * Tracks user profiles, role assignments, invitation state, and activity.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { UserManager, UserStatus } from "./user-manager";

describe("UserManager", () => {
  let manager: UserManager;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
    manager = new UserManager();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /* ── Create User ── */

  describe("createUser", () => {
    it("creates a user with profile details", () => {
      const user = manager.createUser({
        email: "alice@acme.com",
        name: "Alice Smith",
        role: "ANALYST",
        tenantId: "acme-corp",
      });

      expect(user.id).toBeTruthy();
      expect(user.email).toBe("alice@acme.com");
      expect(user.name).toBe("Alice Smith");
      expect(user.role).toBe("ANALYST");
      expect(user.tenantId).toBe("acme-corp");
    });

    it("sets initial status to INVITED", () => {
      const user = manager.createUser({
        email: "alice@acme.com",
        name: "Alice Smith",
        role: "ANALYST",
        tenantId: "acme-corp",
      });

      expect(user.status).toBe(UserStatus.INVITED);
    });

    it("sets createdAt timestamp", () => {
      const user = manager.createUser({
        email: "alice@acme.com",
        name: "Alice Smith",
        role: "ANALYST",
        tenantId: "acme-corp",
      });

      expect(user.createdAt).toBe(Date.now());
    });

    it("throws on duplicate email within same tenant", () => {
      manager.createUser({
        email: "alice@acme.com",
        name: "Alice",
        role: "ANALYST",
        tenantId: "acme-corp",
      });

      expect(() =>
        manager.createUser({
          email: "alice@acme.com",
          name: "Alice 2",
          role: "VIEWER",
          tenantId: "acme-corp",
        }),
      ).toThrow();
    });

    it("allows same email in different tenants", () => {
      manager.createUser({
        email: "alice@acme.com",
        name: "Alice",
        role: "ANALYST",
        tenantId: "acme-corp",
      });

      expect(() =>
        manager.createUser({
          email: "alice@acme.com",
          name: "Alice",
          role: "ADMIN",
          tenantId: "other-corp",
        }),
      ).not.toThrow();
    });
  });

  /* ── Get User ── */

  describe("getUser", () => {
    it("returns user by ID", () => {
      const created = manager.createUser({
        email: "bob@acme.com",
        name: "Bob",
        role: "VIEWER",
        tenantId: "acme-corp",
      });

      const found = manager.getUser(created.id);
      expect(found).toBeDefined();
      expect(found!.email).toBe("bob@acme.com");
    });

    it("returns undefined for unknown ID", () => {
      expect(manager.getUser("nonexistent")).toBeUndefined();
    });
  });

  /* ── Update User ── */

  describe("updateUser", () => {
    it("updates role assignment", () => {
      const user = manager.createUser({
        email: "carol@acme.com",
        name: "Carol",
        role: "VIEWER",
        tenantId: "acme-corp",
      });

      manager.updateUser(user.id, { role: "ANALYST" });
      expect(manager.getUser(user.id)!.role).toBe("ANALYST");
    });

    it("activates an invited user", () => {
      const user = manager.createUser({
        email: "carol@acme.com",
        name: "Carol",
        role: "VIEWER",
        tenantId: "acme-corp",
      });

      manager.updateUser(user.id, { status: UserStatus.ACTIVE });
      expect(manager.getUser(user.id)!.status).toBe(UserStatus.ACTIVE);
    });

    it("throws on unknown user ID", () => {
      expect(() =>
        manager.updateUser("nonexistent", { role: "ADMIN" }),
      ).toThrow();
    });
  });

  /* ── Delete User ── */

  describe("deleteUser", () => {
    it("removes a user", () => {
      const user = manager.createUser({
        email: "dave@acme.com",
        name: "Dave",
        role: "VIEWER",
        tenantId: "acme-corp",
      });

      manager.deleteUser(user.id);
      expect(manager.getUser(user.id)).toBeUndefined();
    });
  });

  /* ── List Users ── */

  describe("listByTenant", () => {
    it("returns all users for a tenant", () => {
      manager.createUser({
        email: "a@acme.com",
        name: "A",
        role: "ADMIN",
        tenantId: "acme-corp",
      });
      manager.createUser({
        email: "b@acme.com",
        name: "B",
        role: "VIEWER",
        tenantId: "acme-corp",
      });
      manager.createUser({
        email: "c@other.com",
        name: "C",
        role: "VIEWER",
        tenantId: "other-corp",
      });

      const acmeUsers = manager.listByTenant("acme-corp");
      expect(acmeUsers).toHaveLength(2);
    });

    it("returns empty array for unknown tenant", () => {
      expect(manager.listByTenant("ghost-corp")).toEqual([]);
    });
  });

  /* ── Activity Tracking ── */

  describe("recordActivity", () => {
    it("updates lastActiveAt timestamp", () => {
      const user = manager.createUser({
        email: "eve@acme.com",
        name: "Eve",
        role: "ANALYST",
        tenantId: "acme-corp",
      });

      vi.advanceTimersByTime(60_000);
      manager.recordActivity(user.id);

      const updated = manager.getUser(user.id);
      expect(updated!.lastActiveAt).toBe(Date.now());
    });
  });
});
