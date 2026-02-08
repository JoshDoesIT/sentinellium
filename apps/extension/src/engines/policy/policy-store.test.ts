/**
 * @module Policy Store Tests
 * @description TDD tests for the policy CRUD store.
 * Manages policy lifecycle with defaults and editor support.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { PolicyStore } from "./policy-store";
import { type PolicyDocument } from "./policy-schema-validator";

describe("Policy Store", () => {
  let store: PolicyStore;

  beforeEach(() => {
    store = new PolicyStore();
  });

  /* ── Initialization ── */

  describe("initialization", () => {
    it("creates an instance", () => {
      expect(store).toBeInstanceOf(PolicyStore);
    });

    it("starts empty", () => {
      expect(store.list()).toHaveLength(0);
    });
  });

  /* ── CRUD Operations ── */

  describe("CRUD operations", () => {
    const policy: PolicyDocument = {
      id: "pol-001",
      name: "Default",
      version: 1,
      rules: { phishing: { enabled: true, sensitivity: "high" } },
    };

    it("creates a policy", () => {
      store.create(policy);
      expect(store.list()).toHaveLength(1);
    });

    it("reads a policy by id", () => {
      store.create(policy);
      const found = store.get("pol-001");
      expect(found?.name).toBe("Default");
    });

    it("updates a policy", () => {
      store.create(policy);
      store.update("pol-001", { name: "Updated Policy" });
      expect(store.get("pol-001")?.name).toBe("Updated Policy");
    });

    it("deletes a policy", () => {
      store.create(policy);
      store.delete("pol-001");
      expect(store.list()).toHaveLength(0);
    });

    it("returns undefined for non-existent policy", () => {
      expect(store.get("missing")).toBeUndefined();
    });
  });

  /* ── Defaults ── */

  describe("defaults", () => {
    it("generates a default policy template", () => {
      const template = store.getDefaultTemplate();
      expect(template.rules.phishing?.enabled).toBe(true);
      expect(template.rules.dlp?.enabled).toBe(true);
      expect(template.rules.c2pa?.enabled).toBe(true);
    });
  });

  /* ── Duplicate Prevention ── */

  describe("duplicate prevention", () => {
    it("rejects duplicate policy IDs", () => {
      const policy: PolicyDocument = {
        id: "pol-001",
        name: "A",
        version: 1,
        rules: {},
      };
      store.create(policy);
      expect(() => store.create(policy)).toThrow();
    });
  });
});
