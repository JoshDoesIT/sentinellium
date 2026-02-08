/**
 * @module Tenant Isolator Tests
 * @description TDD tests for namespace-based tenant data isolation.
 * Ensures all storage, events, and policies are scoped to the active tenant
 * with no cross-tenant contamination.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { TenantIsolator } from "./tenant-isolator";

describe("TenantIsolator", () => {
  let isolator: TenantIsolator;

  beforeEach(() => {
    isolator = new TenantIsolator();
  });

  /* ── Tenant Activation ── */

  describe("setActiveTenant", () => {
    it("sets the active tenant ID", () => {
      isolator.setActiveTenant("tenant-abc");
      expect(isolator.activeTenantId).toBe("tenant-abc");
    });

    it("replaces previous tenant on switch", () => {
      isolator.setActiveTenant("tenant-abc");
      isolator.setActiveTenant("tenant-xyz");
      expect(isolator.activeTenantId).toBe("tenant-xyz");
    });

    it("throws on empty tenant ID", () => {
      expect(() => isolator.setActiveTenant("")).toThrow();
    });
  });

  /* ── Namespace Scoping ── */

  describe("scopeKey", () => {
    it("prefixes storage keys with tenant namespace", () => {
      isolator.setActiveTenant("acme-corp");
      const scoped = isolator.scopeKey("policies");
      expect(scoped).toBe("tenant:acme-corp:policies");
    });

    it("throws when no tenant is active", () => {
      expect(() => isolator.scopeKey("policies")).toThrow();
    });

    it("handles nested key paths", () => {
      isolator.setActiveTenant("acme-corp");
      const scoped = isolator.scopeKey("engines.phishing.config");
      expect(scoped).toBe("tenant:acme-corp:engines.phishing.config");
    });
  });

  /* ── Tenant-Scoped Storage ── */

  describe("storage isolation", () => {
    it("stores data scoped to active tenant", () => {
      isolator.setActiveTenant("tenant-a");
      isolator.set("config", { theme: "dark" });

      expect(isolator.get("config")).toEqual({ theme: "dark" });
    });

    it("isolates data between tenants", () => {
      isolator.setActiveTenant("tenant-a");
      isolator.set("config", { theme: "dark" });

      isolator.setActiveTenant("tenant-b");
      expect(isolator.get("config")).toBeUndefined();
    });

    it("preserves data when switching back to previous tenant", () => {
      isolator.setActiveTenant("tenant-a");
      isolator.set("config", { theme: "dark" });

      isolator.setActiveTenant("tenant-b");
      isolator.set("config", { theme: "light" });

      isolator.setActiveTenant("tenant-a");
      expect(isolator.get("config")).toEqual({ theme: "dark" });
    });

    it("deletes tenant-scoped data", () => {
      isolator.setActiveTenant("tenant-a");
      isolator.set("config", { theme: "dark" });
      isolator.delete("config");

      expect(isolator.get("config")).toBeUndefined();
    });
  });

  /* ── Tenant Listing ── */

  describe("listTenants", () => {
    it("returns all registered tenant IDs", () => {
      isolator.setActiveTenant("tenant-a");
      isolator.setActiveTenant("tenant-b");
      isolator.setActiveTenant("tenant-c");

      const tenants = isolator.listTenants();
      expect(tenants).toContain("tenant-a");
      expect(tenants).toContain("tenant-b");
      expect(tenants).toContain("tenant-c");
      expect(tenants).toHaveLength(3);
    });

    it("does not duplicate tenants on re-activation", () => {
      isolator.setActiveTenant("tenant-a");
      isolator.setActiveTenant("tenant-b");
      isolator.setActiveTenant("tenant-a");

      expect(isolator.listTenants()).toHaveLength(2);
    });
  });

  /* ── Tenant Teardown ── */

  describe("removeTenant", () => {
    it("removes all data for a tenant", () => {
      isolator.setActiveTenant("tenant-a");
      isolator.set("config", { x: 1 });
      isolator.set("alerts", [1, 2, 3]);

      isolator.removeTenant("tenant-a");

      expect(isolator.listTenants()).not.toContain("tenant-a");
    });

    it("clears active tenant if removed tenant was active", () => {
      isolator.setActiveTenant("tenant-a");
      isolator.removeTenant("tenant-a");

      expect(isolator.activeTenantId).toBeUndefined();
    });

    it("does not affect other tenants", () => {
      isolator.setActiveTenant("tenant-a");
      isolator.set("config", { a: true });

      isolator.setActiveTenant("tenant-b");
      isolator.set("config", { b: true });

      isolator.removeTenant("tenant-a");

      expect(isolator.get("config")).toEqual({ b: true });
    });
  });
});
