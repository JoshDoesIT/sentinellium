/**
 * @module Secrets Manager Tests
 * @description TDD tests for secrets management with key rotation.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { SecretsManager } from "./secrets-manager";

describe("SecretsManager", () => {
  let manager: SecretsManager;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
    manager = new SecretsManager();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("set / get", () => {
    it("stores and retrieves a secret", () => {
      manager.set("db-password", "super-secret-123");
      expect(manager.get("db-password")).toBe("super-secret-123");
    });

    it("returns undefined for unknown key", () => {
      expect(manager.get("nonexistent")).toBeUndefined();
    });

    it("overwrites existing secret", () => {
      manager.set("api-key", "old-value");
      manager.set("api-key", "new-value");
      expect(manager.get("api-key")).toBe("new-value");
    });
  });

  describe("delete", () => {
    it("removes a secret", () => {
      manager.set("temp-key", "value");
      manager.delete("temp-key");
      expect(manager.get("temp-key")).toBeUndefined();
    });
  });

  describe("rotate", () => {
    it("rotates a secret and preserves previous version", () => {
      manager.set("api-key", "v1-key");
      manager.rotate("api-key", "v2-key");

      expect(manager.get("api-key")).toBe("v2-key");
      const history = manager.getRotationHistory("api-key");
      expect(history).toHaveLength(2);
    });

    it("throws when rotating unknown key", () => {
      expect(() => manager.rotate("unknown", "value")).toThrow();
    });
  });

  describe("list", () => {
    it("lists all secret keys (not values)", () => {
      manager.set("key-a", "val-a");
      manager.set("key-b", "val-b");

      const keys = manager.list();
      expect(keys).toContain("key-a");
      expect(keys).toContain("key-b");
    });
  });

  describe("audit", () => {
    it("tracks access to secrets", () => {
      manager.set("sensitive-key", "value");
      manager.get("sensitive-key");

      const log = manager.getAuditLog();
      expect(log.length).toBeGreaterThanOrEqual(2); // set + get
      expect(log.some((e) => e.action === "get")).toBe(true);
    });
  });
});
