/**
 * @module DLP Benchmark Tests
 * @description TDD tests for DLP detection accuracy benchmarks.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { DlpBenchmark, DataCategory } from "./dlp-benchmark";

describe("DlpBenchmark", () => {
  let benchmark: DlpBenchmark;

  beforeEach(() => {
    benchmark = new DlpBenchmark();
  });

  describe("addSample", () => {
    it("adds a DLP detection sample", () => {
      benchmark.addSample({
        input: "My SSN is 123-45-6789",
        expectedCategories: [DataCategory.PII],
      });

      expect(benchmark.getSamples()).toHaveLength(1);
    });
  });

  describe("evaluate", () => {
    it("evaluates detector accuracy per category", () => {
      benchmark.addSample({
        input: "My SSN is 123-45-6789",
        expectedCategories: [DataCategory.PII],
      });
      benchmark.addSample({
        input: "Nothing sensitive here",
        expectedCategories: [],
      });

      benchmark.setDetector((input) =>
        input.includes("SSN") ? [DataCategory.PII] : [],
      );

      const result = benchmark.evaluate();
      expect(result.accuracy).toBe(1);
      expect(result.total).toBe(2);
    });

    it("detects false positives", () => {
      benchmark.addSample({
        input: "Normal text",
        expectedCategories: [],
      });

      benchmark.setDetector(() => [DataCategory.PHI]); // Always flags

      const result = benchmark.evaluate();
      expect(result.falsePositives).toBe(1);
    });

    it("detects false negatives", () => {
      benchmark.addSample({
        input: "Credit card: 4111-1111-1111-1111",
        expectedCategories: [DataCategory.FINANCIAL],
      });

      benchmark.setDetector(() => []); // Never flags

      const result = benchmark.evaluate();
      expect(result.falseNegatives).toBe(1);
    });
  });

  describe("getCategoryBreakdown", () => {
    it("breaks down samples by category", () => {
      benchmark.addSample({
        input: "SSN sample",
        expectedCategories: [DataCategory.PII],
      });
      benchmark.addSample({
        input: "Medical record",
        expectedCategories: [DataCategory.PHI],
      });

      const breakdown = benchmark.getCategoryBreakdown();
      expect(breakdown[DataCategory.PII]).toBe(1);
      expect(breakdown[DataCategory.PHI]).toBe(1);
    });
  });
});
