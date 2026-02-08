/**
 * @module DOM Traversal Optimizer Tests
 * @description TDD tests for content script DOM traversal optimization.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { DomTraversalOptimizer } from "./dom-traversal-optimizer";

describe("DomTraversalOptimizer", () => {
  let optimizer: DomTraversalOptimizer;

  beforeEach(() => {
    optimizer = new DomTraversalOptimizer();
  });

  describe("analyzeSelector", () => {
    it("scores selector efficiency", () => {
      const score = optimizer.analyzeSelector("#main-content");
      expect(score.efficiency).toBe("optimal");
    });

    it("flags inefficient universal selectors", () => {
      const score = optimizer.analyzeSelector("div > * > span");
      expect(score.efficiency).toBe("poor");
    });
  });

  describe("optimizeTraversal", () => {
    it("suggests batch reading for multiple selectors", () => {
      const suggestion = optimizer.optimizeTraversal([
        ".alert-title",
        ".alert-body",
        ".alert-severity",
      ]);

      expect(suggestion.strategy).toBe("batch-read");
      expect(suggestion.selectors).toHaveLength(3);
    });
  });

  describe("measureTraversal", () => {
    it("measures time for a traversal callback", () => {
      const measurement = optimizer.measureTraversal(() => {
        // Simulate DOM work
        let sum = 0;
        for (let i = 0; i < 1000; i++) sum += i;
        return sum;
      });

      expect(measurement.durationMs).toBeDefined();
      expect(measurement.result).toBe(499500);
    });
  });

  describe("getOptimizationTips", () => {
    it("returns general DOM performance tips", () => {
      const tips = optimizer.getOptimizationTips();
      expect(tips.length).toBeGreaterThan(0);
    });
  });
});
