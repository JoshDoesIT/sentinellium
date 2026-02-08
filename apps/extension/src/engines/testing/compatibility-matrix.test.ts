/**
 * @module Compatibility Matrix Tests
 * @description TDD tests for cross-browser compatibility matrix.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { CompatibilityMatrix, SupportLevel } from "./compatibility-matrix";

describe("CompatibilityMatrix", () => {
  let matrix: CompatibilityMatrix;

  beforeEach(() => {
    matrix = new CompatibilityMatrix();
  });

  describe("addBrowser", () => {
    it("adds a browser to the matrix", () => {
      matrix.addBrowser({ name: "Chrome", version: "120+", engine: "Blink" });
      expect(matrix.getBrowsers()).toHaveLength(1);
    });
  });

  describe("addFeature", () => {
    it("adds a feature with browser support levels", () => {
      matrix.addBrowser({ name: "Chrome", version: "120+", engine: "Blink" });
      matrix.addBrowser({ name: "Firefox", version: "115+", engine: "Gecko" });

      matrix.addFeature({
        id: "webgpu",
        name: "WebGPU Inference",
        support: {
          Chrome: SupportLevel.FULL,
          Firefox: SupportLevel.PARTIAL,
        },
      });

      expect(matrix.getFeatures()).toHaveLength(1);
    });
  });

  describe("getSupport", () => {
    it("returns support level for a browser-feature pair", () => {
      matrix.addBrowser({ name: "Chrome", version: "120+", engine: "Blink" });
      matrix.addFeature({
        id: "manifest-v3",
        name: "Manifest V3",
        support: { Chrome: SupportLevel.FULL },
      });

      expect(matrix.getSupport("Chrome", "manifest-v3")).toBe(
        SupportLevel.FULL,
      );
    });

    it("returns NONE for unsupported combinations", () => {
      matrix.addBrowser({ name: "Safari", version: "17+", engine: "WebKit" });
      matrix.addFeature({
        id: "webgpu",
        name: "WebGPU",
        support: {},
      });

      expect(matrix.getSupport("Safari", "webgpu")).toBe(SupportLevel.NONE);
    });
  });

  describe("generateReport", () => {
    it("generates a full compatibility report", () => {
      matrix.addBrowser({ name: "Chrome", version: "120+", engine: "Blink" });
      matrix.addBrowser({ name: "Edge", version: "120+", engine: "Blink" });

      matrix.addFeature({
        id: "f1",
        name: "Feature 1",
        support: { Chrome: SupportLevel.FULL, Edge: SupportLevel.FULL },
      });

      const report = matrix.generateReport();
      expect(report.browsers).toHaveLength(2);
      expect(report.features).toHaveLength(1);
      expect(report.overallScore).toBeDefined();
    });
  });

  describe("getGaps", () => {
    it("identifies features with missing or partial support", () => {
      matrix.addBrowser({ name: "Chrome", version: "120+", engine: "Blink" });
      matrix.addBrowser({ name: "Firefox", version: "115+", engine: "Gecko" });

      matrix.addFeature({
        id: "webgpu",
        name: "WebGPU",
        support: {
          Chrome: SupportLevel.FULL,
          Firefox: SupportLevel.NONE,
        },
      });

      const gaps = matrix.getGaps();
      expect(gaps).toHaveLength(1);
      expect(gaps[0]!.browser).toBe("Firefox");
      expect(gaps[0]!.featureId).toBe("webgpu");
    });
  });
});
