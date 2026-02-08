/**
 * @module Policy Schema Validator Tests
 * @description TDD tests for policy schema validation.
 * Validates enterprise policy documents against the schema.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  PolicySchemaValidator,
  type PolicyDocument,
} from "./policy-schema-validator";

describe("Policy Schema Validator", () => {
  let validator: PolicySchemaValidator;

  beforeEach(() => {
    validator = new PolicySchemaValidator();
  });

  /* ── Initialization ── */

  describe("initialization", () => {
    it("creates an instance", () => {
      expect(validator).toBeInstanceOf(PolicySchemaValidator);
    });
  });

  /* ── Valid Policies ── */

  describe("valid policies", () => {
    it("validates a complete policy document", () => {
      const policy: PolicyDocument = {
        id: "pol-001",
        name: "Default Security Policy",
        version: 1,
        rules: {
          phishing: { enabled: true, sensitivity: "high" },
          dlp: { enabled: true, blockedPiiTypes: ["SSN", "CREDIT_CARD"] },
          c2pa: { enabled: true, flagUnverified: true },
        },
      };

      const result = validator.validate(policy);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("validates a minimal policy", () => {
      const policy: PolicyDocument = {
        id: "pol-002",
        name: "Minimal",
        version: 1,
        rules: {},
      };

      const result = validator.validate(policy);
      expect(result.valid).toBe(true);
    });
  });

  /* ── Invalid Policies ── */

  describe("invalid policies", () => {
    it("rejects missing id", () => {
      const policy = { name: "No ID", version: 1, rules: {} } as PolicyDocument;
      const result = validator.validate(policy);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("id"))).toBe(true);
    });

    it("rejects missing name", () => {
      const policy = { id: "pol-003", version: 1, rules: {} } as PolicyDocument;
      const result = validator.validate(policy);
      expect(result.valid).toBe(false);
    });

    it("rejects invalid version", () => {
      const policy: PolicyDocument = {
        id: "pol-004",
        name: "Bad Version",
        version: -1,
        rules: {},
      };
      const result = validator.validate(policy);
      expect(result.valid).toBe(false);
    });

    it("rejects null input", () => {
      const result = validator.validate(null as unknown as PolicyDocument);
      expect(result.valid).toBe(false);
    });
  });

  /* ── Rule Validation ── */

  describe("rule validation", () => {
    it("validates phishing rule structure", () => {
      const policy: PolicyDocument = {
        id: "pol-005",
        name: "Test",
        version: 1,
        rules: { phishing: { enabled: true, sensitivity: "invalid-level" } },
      };

      const result = validator.validate(policy);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("sensitivity"))).toBe(true);
    });
  });
});
