/**
 * @module API Key Manager Tests
 * @description TDD tests for programmatic API key lifecycle.
 * Covers generation, scoping, hashing, expiry, revocation, and rotation.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { ApiKeyManager } from "./api-key-manager";

describe("ApiKeyManager", () => {
  let manager: ApiKeyManager;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
    manager = new ApiKeyManager();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /* ── Key Generation ── */

  describe("generateKey", () => {
    it("creates a key with tenant and role scope", () => {
      const result = manager.generateKey({
        name: "CI Pipeline",
        tenantId: "acme-corp",
        role: "ANALYST",
        expiresInDays: 90,
      });

      expect(result.keyId).toBeTruthy();
      expect(result.plaintext).toBeTruthy();
      expect(result.name).toBe("CI Pipeline");
      expect(result.tenantId).toBe("acme-corp");
      expect(result.role).toBe("ANALYST");
    });

    it("generates unique keys each time", () => {
      const key1 = manager.generateKey({
        name: "Key A",
        tenantId: "acme-corp",
        role: "VIEWER",
        expiresInDays: 30,
      });
      const key2 = manager.generateKey({
        name: "Key B",
        tenantId: "acme-corp",
        role: "VIEWER",
        expiresInDays: 30,
      });

      expect(key1.plaintext).not.toBe(key2.plaintext);
      expect(key1.keyId).not.toBe(key2.keyId);
    });

    it("sets expiry based on expiresInDays", () => {
      const result = manager.generateKey({
        name: "Short-lived",
        tenantId: "acme-corp",
        role: "VIEWER",
        expiresInDays: 7,
      });

      const expectedExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
      expect(result.expiresAt).toBe(expectedExpiry);
    });
  });

  /* ── Key Validation ── */

  describe("validateKey", () => {
    it("returns key metadata for a valid plaintext key", () => {
      const generated = manager.generateKey({
        name: "CI Pipeline",
        tenantId: "acme-corp",
        role: "ANALYST",
        expiresInDays: 90,
      });

      const validated = manager.validateKey(generated.plaintext);
      expect(validated).toBeDefined();
      expect(validated!.tenantId).toBe("acme-corp");
      expect(validated!.role).toBe("ANALYST");
    });

    it("returns undefined for unknown key", () => {
      expect(manager.validateKey("sk_unknown_key")).toBeUndefined();
    });

    it("returns undefined for expired key", () => {
      const generated = manager.generateKey({
        name: "Expiring",
        tenantId: "acme-corp",
        role: "VIEWER",
        expiresInDays: 1,
      });

      vi.advanceTimersByTime(2 * 24 * 60 * 60 * 1000);
      expect(manager.validateKey(generated.plaintext)).toBeUndefined();
    });
  });

  /* ── Key Revocation ── */

  describe("revokeKey", () => {
    it("prevents future validation of a revoked key", () => {
      const generated = manager.generateKey({
        name: "Revocable",
        tenantId: "acme-corp",
        role: "ANALYST",
        expiresInDays: 90,
      });

      manager.revokeKey(generated.keyId);
      expect(manager.validateKey(generated.plaintext)).toBeUndefined();
    });

    it("marks the key as revoked in listing", () => {
      const generated = manager.generateKey({
        name: "Revocable",
        tenantId: "acme-corp",
        role: "ANALYST",
        expiresInDays: 90,
      });

      manager.revokeKey(generated.keyId);
      const keys = manager.listKeys("acme-corp");
      expect(keys[0]!.revoked).toBe(true);
    });
  });

  /* ── Listing ── */

  describe("listKeys", () => {
    it("returns all keys for a tenant without plaintext", () => {
      manager.generateKey({
        name: "Key A",
        tenantId: "acme-corp",
        role: "ADMIN",
        expiresInDays: 90,
      });
      manager.generateKey({
        name: "Key B",
        tenantId: "acme-corp",
        role: "VIEWER",
        expiresInDays: 30,
      });
      manager.generateKey({
        name: "Other",
        tenantId: "other-corp",
        role: "ADMIN",
        expiresInDays: 90,
      });

      const keys = manager.listKeys("acme-corp");
      expect(keys).toHaveLength(2);
      expect(keys[0]).not.toHaveProperty("plaintext");
    });
  });

  /* ── Key Rotation ── */

  describe("rotateKey", () => {
    it("revokes old key and returns a new one", () => {
      const original = manager.generateKey({
        name: "Rotating",
        tenantId: "acme-corp",
        role: "ANALYST",
        expiresInDays: 90,
      });

      const rotated = manager.rotateKey(original.keyId);
      expect(rotated.keyId).not.toBe(original.keyId);
      expect(rotated.plaintext).not.toBe(original.plaintext);
      expect(manager.validateKey(original.plaintext)).toBeUndefined();
      expect(manager.validateKey(rotated.plaintext)).toBeDefined();
    });

    it("throws when rotating unknown key", () => {
      expect(() => manager.rotateKey("nonexistent")).toThrow();
    });
  });
});
