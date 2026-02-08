/**
 * @module Phishing Test Harness Tests
 * @description TDD tests for phishing detection accuracy benchmarking.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { PhishingTestHarness } from "./phishing-test-harness";

describe("PhishingTestHarness", () => {
  let harness: PhishingTestHarness;

  beforeEach(() => {
    harness = new PhishingTestHarness();
  });

  describe("addSample", () => {
    it("adds a labeled sample to the dataset", () => {
      harness.addSample({
        url: "https://evil-bank.com/login",
        label: "phishing",
      });
      harness.addSample({
        url: "https://chase.com/login",
        label: "legitimate",
      });

      expect(harness.getSamples()).toHaveLength(2);
    });
  });

  describe("evaluate", () => {
    it("computes accuracy metrics", () => {
      // True positive: phishing correctly detected
      harness.addSample({ url: "https://evil.com", label: "phishing" });
      // True negative: legit correctly passed
      harness.addSample({ url: "https://chase.com", label: "legitimate" });
      // False negative: phishing missed
      harness.addSample({ url: "https://sneaky-phish.com", label: "phishing" });

      // Simulate detector: detects first phishing, passes legit, misses sneaky
      harness.setDetector((url) =>
        url.includes("evil") ? "phishing" : "legitimate",
      );

      const metrics = harness.evaluate();
      expect(metrics.total).toBe(3);
      expect(metrics.truePositives).toBe(1);
      expect(metrics.trueNegatives).toBe(1);
      expect(metrics.falseNegatives).toBe(1);
      expect(metrics.falsePositives).toBe(0);
    });

    it("computes precision and recall", () => {
      harness.addSample({ url: "https://phish.com", label: "phishing" });
      harness.addSample({ url: "https://legit.com", label: "legitimate" });

      harness.setDetector(() => "phishing"); // Detects everything as phishing

      const metrics = harness.evaluate();
      expect(metrics.precision).toBe(0.5); // 1 TP / (1 TP + 1 FP)
      expect(metrics.recall).toBe(1); // 1 TP / (1 TP + 0 FN)
    });
  });

  describe("getConfusionMatrix", () => {
    it("returns confusion matrix after evaluation", () => {
      harness.addSample({ url: "https://phish.com", label: "phishing" });
      harness.addSample({ url: "https://legit.com", label: "legitimate" });

      harness.setDetector((url) =>
        url.includes("phish") ? "phishing" : "legitimate",
      );

      harness.evaluate();
      const matrix = harness.getConfusionMatrix();
      expect(matrix.tp).toBe(1);
      expect(matrix.tn).toBe(1);
      expect(matrix.fp).toBe(0);
      expect(matrix.fn).toBe(0);
    });
  });

  describe("getBenchmarkReport", () => {
    it("generates a benchmark summary", () => {
      harness.addSample({ url: "https://a.com", label: "phishing" });
      harness.setDetector(() => "phishing");
      harness.evaluate();

      const report = harness.getBenchmarkReport();
      expect(report.totalSamples).toBe(1);
      expect(report.accuracy).toBe(1);
    });
  });
});
