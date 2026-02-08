/**
 * @module Policy Versioning Tests
 * @description TDD tests for policy version management.
 * Supports snapshots, rollback, and version diffing.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { PolicyVersioning } from "./policy-versioning";
import { type PolicyDocument } from "./policy-schema-validator";

describe("Policy Versioning", () => {
  let versioning: PolicyVersioning;

  const policyV1: PolicyDocument = {
    id: "pol-001",
    name: "Default",
    version: 1,
    rules: { phishing: { enabled: true, sensitivity: "high" } },
  };

  const policyV2: PolicyDocument = {
    id: "pol-001",
    name: "Updated Default",
    version: 2,
    rules: { phishing: { enabled: true, sensitivity: "critical" } },
  };

  beforeEach(() => {
    versioning = new PolicyVersioning();
  });

  /* ── Initialization ── */

  describe("initialization", () => {
    it("creates an instance", () => {
      expect(versioning).toBeInstanceOf(PolicyVersioning);
    });
  });

  /* ── Snapshots ── */

  describe("snapshots", () => {
    it("saves a version snapshot", () => {
      versioning.snapshot(policyV1);
      expect(versioning.getHistory("pol-001")).toHaveLength(1);
    });

    it("saves multiple versions", () => {
      versioning.snapshot(policyV1);
      versioning.snapshot(policyV2);
      expect(versioning.getHistory("pol-001")).toHaveLength(2);
    });

    it("retrieves a specific version", () => {
      versioning.snapshot(policyV1);
      versioning.snapshot(policyV2);
      const v1 = versioning.getVersion("pol-001", 1);
      expect(v1?.name).toBe("Default");
    });
  });

  /* ── Rollback ── */

  describe("rollback", () => {
    it("rolls back to a previous version", () => {
      versioning.snapshot(policyV1);
      versioning.snapshot(policyV2);
      const rolled = versioning.rollback("pol-001", 1);
      expect(rolled?.version).toBe(1);
      expect(rolled?.name).toBe("Default");
    });

    it("returns null for non-existent version", () => {
      expect(versioning.rollback("pol-001", 99)).toBeNull();
    });
  });

  /* ── Diffing ── */

  describe("diffing", () => {
    it("diffs two versions", () => {
      versioning.snapshot(policyV1);
      versioning.snapshot(policyV2);
      const diff = versioning.diff("pol-001", 1, 2);
      expect(diff).toHaveLength(3);
      expect(diff.some((d) => d.field === "name")).toBe(true);
    });

    it("returns empty diff for identical versions", () => {
      versioning.snapshot(policyV1);
      const diff = versioning.diff("pol-001", 1, 1);
      expect(diff).toHaveLength(0);
    });
  });
});
