/**
 * @module DOM Traversal Optimizer
 * @description Content script DOM traversal performance optimization.
 * Analyzes selectors, suggests strategies, and measures traversal time.
 */

/* ── Types ── */

export interface SelectorAnalysis {
  selector: string;
  efficiency: "optimal" | "good" | "fair" | "poor";
  suggestion?: string;
}

export interface TraversalStrategy {
  strategy: string;
  selectors: string[];
  estimatedSpeedupPercent: number;
}

export interface TraversalMeasurement<T> {
  durationMs: number;
  result: T;
}

/* ── Optimizer ── */

/**
 * DOM traversal performance optimizer.
 */
export class DomTraversalOptimizer {
  /** Analyze a CSS selector for efficiency. */
  analyzeSelector(selector: string): SelectorAnalysis {
    if (selector.startsWith("#")) {
      return { selector, efficiency: "optimal" };
    }
    if (selector.startsWith(".") && !selector.includes(" ")) {
      return { selector, efficiency: "good" };
    }
    if (selector.includes("*")) {
      return {
        selector,
        efficiency: "poor",
        suggestion: "Avoid universal selectors; use specific class or ID",
      };
    }
    return { selector, efficiency: "fair" };
  }

  /** Suggest traversal optimization strategy. */
  optimizeTraversal(selectors: string[]): TraversalStrategy {
    if (selectors.length > 2) {
      return {
        strategy: "batch-read",
        selectors,
        estimatedSpeedupPercent: 30,
      };
    }
    return {
      strategy: "individual",
      selectors,
      estimatedSpeedupPercent: 0,
    };
  }

  /** Measure traversal time. */
  measureTraversal<T>(fn: () => T): TraversalMeasurement<T> {
    const start = performance.now();
    const result = fn();
    const durationMs = performance.now() - start;
    return { durationMs, result };
  }

  /** Get general DOM performance tips. */
  getOptimizationTips(): string[] {
    return [
      "Use getElementById/querySelector with IDs for O(1) lookups",
      "Batch DOM reads before DOM writes to avoid layout thrashing",
      "Use MutationObserver instead of polling for DOM changes",
      "Minimize use of querySelectorAll with complex selectors",
      "Cache selector results when the DOM hasn't changed",
      "Use requestAnimationFrame for visual updates",
    ];
  }
}
