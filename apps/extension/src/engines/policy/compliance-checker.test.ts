/**
 * @module Compliance Checker Tests
 * @description TDD tests for policy compliance checking.
 * Compares actual engine state against required policy.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  ComplianceChecker,
  ComplianceStatus,
  type EngineState,
} from "./compliance-checker";
import { type PolicyDocument } from "./policy-schema-validator";

describe("Compliance Checker", () => {
  let checker: ComplianceChecker;

  const policy: PolicyDocument = {
    id: "pol-001",
    name: "Default",
    version: 1,
    rules: {
      phishing: { enabled: true, sensitivity: "high" },
      dlp: { enabled: true, blockedPiiTypes: ["SSN", "CREDIT_CARD"] },
      c2pa: { enabled: true, flagUnverified: true },
    },
  };

  beforeEach(() => {
    checker = new ComplianceChecker();
  });

  /* ── Initialization ── */

  describe("initialization", () => {
    it("creates an instance", () => {
      expect(checker).toBeInstanceOf(ComplianceChecker);
    });
  });

  /* ── Compliant State ── */

  describe("compliant state", () => {
    it("returns COMPLIANT when all engines match", () => {
      const state: EngineState = {
        phishing: { enabled: true, sensitivity: "high" },
        dlp: { enabled: true, blockedPiiTypes: ["SSN", "CREDIT_CARD"] },
        c2pa: { enabled: true, flagUnverified: true },
      };

      const result = checker.check(policy, state);
      expect(result.status).toBe(ComplianceStatus.COMPLIANT);
      expect(result.violations).toHaveLength(0);
    });
  });

  /* ── Non-Compliant State ── */

  describe("non-compliant state", () => {
    it("flags disabled engine as violation", () => {
      const state: EngineState = {
        phishing: { enabled: false, sensitivity: "high" },
        dlp: { enabled: true, blockedPiiTypes: ["SSN", "CREDIT_CARD"] },
        c2pa: { enabled: true, flagUnverified: true },
      };

      const result = checker.check(policy, state);
      expect(result.status).toBe(ComplianceStatus.NON_COMPLIANT);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0]?.engine).toBe("phishing");
    });

    it("flags wrong sensitivity level", () => {
      const state: EngineState = {
        phishing: { enabled: true, sensitivity: "low" },
        dlp: { enabled: true, blockedPiiTypes: ["SSN", "CREDIT_CARD"] },
        c2pa: { enabled: true, flagUnverified: true },
      };

      const result = checker.check(policy, state);
      expect(result.status).toBe(ComplianceStatus.NON_COMPLIANT);
    });

    it("flags missing blocked PII types", () => {
      const state: EngineState = {
        phishing: { enabled: true, sensitivity: "high" },
        dlp: { enabled: true, blockedPiiTypes: ["SSN"] },
        c2pa: { enabled: true, flagUnverified: true },
      };

      const result = checker.check(policy, state);
      expect(result.status).toBe(ComplianceStatus.NON_COMPLIANT);
    });
  });

  /* ── Partial State ── */

  describe("partial state", () => {
    it("handles missing engines in state", () => {
      const state: EngineState = {
        phishing: { enabled: true, sensitivity: "high" },
      };

      const result = checker.check(policy, state);
      expect(result.status).toBe(ComplianceStatus.NON_COMPLIANT);
    });
  });

  /* ── Summary ── */

  describe("summary", () => {
    it("returns a compliance percentage", () => {
      const state: EngineState = {
        phishing: { enabled: true, sensitivity: "high" },
        dlp: { enabled: true, blockedPiiTypes: ["SSN", "CREDIT_CARD"] },
        c2pa: { enabled: false, flagUnverified: true },
      };

      const result = checker.check(policy, state);
      expect(result.compliancePercent).toBeLessThan(100);
      expect(result.compliancePercent).toBeGreaterThan(0);
    });
  });
});
