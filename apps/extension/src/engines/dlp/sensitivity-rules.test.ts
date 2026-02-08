/**
 * @module Sensitivity Rules Tests
 * @description TDD tests for configurable sensitivity policies.
 * Per-entity-type levels and domain-specific overrides.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { SensitivityRules, SensitivityLevel } from "./sensitivity-rules";
import { PiiType } from "./pii-detector";

describe("Sensitivity Rules", () => {
  let rules: SensitivityRules;

  beforeEach(() => {
    rules = new SensitivityRules();
  });

  /* ── Initialization ── */

  describe("initialization", () => {
    it("creates an instance with default rules", () => {
      expect(rules).toBeInstanceOf(SensitivityRules);
    });
  });

  /* ── Default Sensitivity Levels ── */

  describe("default sensitivity levels", () => {
    it("classifies SSN as CRITICAL", () => {
      expect(rules.getLevel(PiiType.SSN)).toBe(SensitivityLevel.CRITICAL);
    });

    it("classifies credit cards as CRITICAL", () => {
      expect(rules.getLevel(PiiType.CREDIT_CARD)).toBe(
        SensitivityLevel.CRITICAL,
      );
    });

    it("classifies API keys as CRITICAL", () => {
      expect(rules.getLevel(PiiType.API_KEY)).toBe(SensitivityLevel.CRITICAL);
    });

    it("classifies email as MODERATE", () => {
      expect(rules.getLevel(PiiType.EMAIL)).toBe(SensitivityLevel.MODERATE);
    });

    it("classifies phone as MODERATE", () => {
      expect(rules.getLevel(PiiType.PHONE)).toBe(SensitivityLevel.MODERATE);
    });
  });

  /* ── Custom Overrides ── */

  describe("custom overrides", () => {
    it("allows overriding sensitivity levels", () => {
      const custom = new SensitivityRules({
        overrides: new Map([[PiiType.EMAIL, SensitivityLevel.CRITICAL]]),
      });

      expect(custom.getLevel(PiiType.EMAIL)).toBe(SensitivityLevel.CRITICAL);
    });
  });

  /* ── Domain Overrides ── */

  describe("domain overrides", () => {
    it("applies stricter rules for specific domains", () => {
      const custom = new SensitivityRules({
        domainRules: new Map([
          [
            "internal.corp.com",
            new Map([[PiiType.EMAIL, SensitivityLevel.CRITICAL]]),
          ],
        ]),
      });

      expect(custom.getLevelForDomain(PiiType.EMAIL, "internal.corp.com")).toBe(
        SensitivityLevel.CRITICAL,
      );
    });

    it("falls back to default for unmatched domains", () => {
      const custom = new SensitivityRules({
        domainRules: new Map([
          [
            "internal.corp.com",
            new Map([[PiiType.EMAIL, SensitivityLevel.CRITICAL]]),
          ],
        ]),
      });

      expect(custom.getLevelForDomain(PiiType.EMAIL, "other.com")).toBe(
        SensitivityLevel.MODERATE,
      );
    });
  });

  /* ── Should Block ── */

  describe("should block", () => {
    it("returns true for CRITICAL level", () => {
      expect(rules.shouldBlock(PiiType.SSN)).toBe(true);
    });

    it("returns false for MODERATE level", () => {
      expect(rules.shouldBlock(PiiType.EMAIL)).toBe(false);
    });
  });
});
