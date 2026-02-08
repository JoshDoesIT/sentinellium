/**
 * @module Page Impact Analyzer Tests
 * @description TDD tests for page load impact analysis (Lighthouse CI-style).
 */
import { describe, it, expect, beforeEach } from "vitest";
import { PageImpactAnalyzer } from "./page-impact-analyzer";

describe("PageImpactAnalyzer", () => {
  let analyzer: PageImpactAnalyzer;

  beforeEach(() => {
    analyzer = new PageImpactAnalyzer();
  });

  describe("measure", () => {
    it("measures page load metrics", () => {
      analyzer.setMetrics({
        firstContentfulPaint: 1200,
        largestContentfulPaint: 2500,
        totalBlockingTime: 150,
        cumulativeLayoutShift: 0.05,
        timeToInteractive: 3200,
      });

      const result = analyzer.measure();
      expect(result.fcp).toBe(1200);
      expect(result.lcp).toBe(2500);
      expect(result.tbt).toBe(150);
      expect(result.cls).toBe(0.05);
    });
  });

  describe("score", () => {
    it("produces a Lighthouse-style score", () => {
      analyzer.setMetrics({
        firstContentfulPaint: 1200,
        largestContentfulPaint: 2000,
        totalBlockingTime: 100,
        cumulativeLayoutShift: 0.02,
        timeToInteractive: 2500,
      });

      const score = analyzer.score();
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
    });
  });

  describe("compareBeforeAfter", () => {
    it("compares metrics before and after extension injection", () => {
      const before = {
        firstContentfulPaint: 1000,
        largestContentfulPaint: 2000,
        totalBlockingTime: 50,
        cumulativeLayoutShift: 0.01,
        timeToInteractive: 2200,
      };
      const after = {
        firstContentfulPaint: 1100,
        largestContentfulPaint: 2200,
        totalBlockingTime: 80,
        cumulativeLayoutShift: 0.02,
        timeToInteractive: 2500,
      };

      const diff = analyzer.compareBeforeAfter(before, after);
      expect(diff.fcpDelta).toBe(100);
      expect(diff.lcpDelta).toBe(200);
    });
  });
});
