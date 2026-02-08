/**
 * @module C2PA Test Suite Tests
 * @description TDD tests for C2PA validation test suite with known manifests.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { C2paTestSuite, ValidationOutcome } from "./c2pa-test-suite";

describe("C2paTestSuite", () => {
  let suite: C2paTestSuite;

  beforeEach(() => {
    suite = new C2paTestSuite();
  });

  describe("addManifest", () => {
    it("adds a known manifest with expected outcome", () => {
      suite.addManifest({
        id: "valid-adobe",
        description: "Valid Adobe Photoshop manifest",
        manifest: { creator: "Adobe Photoshop", timestamp: "2026-01-01" },
        expectedOutcome: ValidationOutcome.VALID,
      });

      expect(suite.getManifests()).toHaveLength(1);
    });
  });

  describe("setValidator", () => {
    it("sets the C2PA validator function", () => {
      suite.setValidator(() => ValidationOutcome.VALID);
      expect(suite.hasValidator()).toBe(true);
    });
  });

  describe("runAll", () => {
    it("validates all manifests and reports results", () => {
      suite.addManifest({
        id: "valid-1",
        description: "Valid manifest",
        manifest: { creator: "Camera" },
        expectedOutcome: ValidationOutcome.VALID,
      });
      suite.addManifest({
        id: "tampered-1",
        description: "Tampered manifest",
        manifest: { creator: "Unknown", tampered: true },
        expectedOutcome: ValidationOutcome.TAMPERED,
      });

      suite.setValidator((manifest) =>
        manifest.tampered
          ? ValidationOutcome.TAMPERED
          : ValidationOutcome.VALID,
      );

      const report = suite.runAll();
      expect(report.total).toBe(2);
      expect(report.passed).toBe(2);
      expect(report.failed).toBe(0);
    });

    it("detects mismatches between expected and actual", () => {
      suite.addManifest({
        id: "should-fail",
        description: "Expected tampered but validator says valid",
        manifest: { creator: "Fake" },
        expectedOutcome: ValidationOutcome.TAMPERED,
      });

      suite.setValidator(() => ValidationOutcome.VALID);

      const report = suite.runAll();
      expect(report.failed).toBe(1);
    });
  });

  describe("getCoverageReport", () => {
    it("reports coverage by outcome type", () => {
      suite.addManifest({
        id: "v1",
        description: "Valid",
        manifest: {},
        expectedOutcome: ValidationOutcome.VALID,
      });
      suite.addManifest({
        id: "t1",
        description: "Tampered",
        manifest: {},
        expectedOutcome: ValidationOutcome.TAMPERED,
      });
      suite.addManifest({
        id: "m1",
        description: "Missing",
        manifest: {},
        expectedOutcome: ValidationOutcome.MISSING,
      });

      const coverage = suite.getCoverageReport();
      expect(coverage.byOutcome[ValidationOutcome.VALID]).toBe(1);
      expect(coverage.byOutcome[ValidationOutcome.TAMPERED]).toBe(1);
      expect(coverage.byOutcome[ValidationOutcome.MISSING]).toBe(1);
    });
  });
});
