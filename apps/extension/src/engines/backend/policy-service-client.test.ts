/**
 * @module Policy Service Client Tests
 * @description TDD tests for policy CRUD, versioning, and distribution.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { PolicyServiceClient } from "./policy-service-client";

describe("PolicyServiceClient", () => {
  let client: PolicyServiceClient;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
    client = new PolicyServiceClient();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /* ── CRUD ── */

  describe("create", () => {
    it("creates a policy with version 1", () => {
      const policy = client.create({
        name: "Default Phishing Policy",
        tenantId: "acme-corp",
        rules: { phishing: true, dlp: false },
      });

      expect(policy.id).toBeTruthy();
      expect(policy.version).toBe(1);
      expect(policy.name).toBe("Default Phishing Policy");
    });
  });

  describe("get", () => {
    it("returns policy by ID", () => {
      const created = client.create({
        name: "Test",
        tenantId: "acme-corp",
        rules: {},
      });
      expect(client.get(created.id)).toBeDefined();
    });

    it("returns undefined for unknown ID", () => {
      expect(client.get("nonexistent")).toBeUndefined();
    });
  });

  describe("update", () => {
    it("increments version on update", () => {
      const created = client.create({
        name: "Test",
        tenantId: "acme-corp",
        rules: { phishing: true },
      });

      client.update(created.id, { rules: { phishing: false } });
      const updated = client.get(created.id);
      expect(updated!.version).toBe(2);
      expect(updated!.rules).toEqual({ phishing: false });
    });

    it("throws on unknown policy", () => {
      expect(() => client.update("nope", { name: "x" })).toThrow();
    });
  });

  describe("delete", () => {
    it("removes a policy", () => {
      const created = client.create({
        name: "Test",
        tenantId: "acme-corp",
        rules: {},
      });
      client.delete(created.id);
      expect(client.get(created.id)).toBeUndefined();
    });
  });

  /* ── Distribution ── */

  describe("listByTenant", () => {
    it("returns policies scoped to a tenant", () => {
      client.create({ name: "A", tenantId: "acme-corp", rules: {} });
      client.create({ name: "B", tenantId: "acme-corp", rules: {} });
      client.create({ name: "C", tenantId: "other-corp", rules: {} });

      expect(client.listByTenant("acme-corp")).toHaveLength(2);
    });
  });

  /* ── Version History ── */

  describe("getVersionHistory", () => {
    it("tracks all versions of a policy", () => {
      const created = client.create({
        name: "Evolving",
        tenantId: "acme-corp",
        rules: { v: 1 },
      });

      client.update(created.id, { rules: { v: 2 } });
      client.update(created.id, { rules: { v: 3 } });

      const history = client.getVersionHistory(created.id);
      expect(history).toHaveLength(3);
      expect(history[0]!.version).toBe(1);
      expect(history[2]!.version).toBe(3);
    });
  });
});
