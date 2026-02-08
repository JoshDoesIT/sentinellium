/**
 * @module Page Impact Analyzer
 * @description Page load impact analysis (Lighthouse CI-style).
 * Measures Core Web Vitals and computes performance scores.
 */

/* ── Types ── */

export interface PageMetrics {
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  totalBlockingTime: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
}

export interface MeasureResult {
  fcp: number;
  lcp: number;
  tbt: number;
  cls: number;
  tti: number;
}

export interface PerformanceScore {
  overall: number;
  fcp: number;
  lcp: number;
  tbt: number;
  cls: number;
}

export interface MetricsDiff {
  fcpDelta: number;
  lcpDelta: number;
  tbtDelta: number;
  clsDelta: number;
  ttiDelta: number;
}

/* ── Analyzer ── */

/**
 * Page impact analyzer with Lighthouse-style scoring.
 */
export class PageImpactAnalyzer {
  private metrics: PageMetrics | null = null;

  /** Set page metrics. */
  setMetrics(metrics: PageMetrics): void {
    this.metrics = metrics;
  }

  /** Measure and return current metrics. */
  measure(): MeasureResult {
    if (!this.metrics) throw new Error("No metrics set");
    return {
      fcp: this.metrics.firstContentfulPaint,
      lcp: this.metrics.largestContentfulPaint,
      tbt: this.metrics.totalBlockingTime,
      cls: this.metrics.cumulativeLayoutShift,
      tti: this.metrics.timeToInteractive,
    };
  }

  /** Compute a Lighthouse-style score (0-100). */
  score(): PerformanceScore {
    if (!this.metrics) throw new Error("No metrics set");

    const fcpScore = this.clampScore(
      100 - this.metrics.firstContentfulPaint / 50,
    );
    const lcpScore = this.clampScore(
      100 - this.metrics.largestContentfulPaint / 50,
    );
    const tbtScore = this.clampScore(100 - this.metrics.totalBlockingTime / 5);
    const clsScore = this.clampScore(
      100 - this.metrics.cumulativeLayoutShift * 1000,
    );

    const overall = Math.round((fcpScore + lcpScore + tbtScore + clsScore) / 4);

    return {
      overall,
      fcp: fcpScore,
      lcp: lcpScore,
      tbt: tbtScore,
      cls: clsScore,
    };
  }

  /** Compare before and after metrics. */
  compareBeforeAfter(before: PageMetrics, after: PageMetrics): MetricsDiff {
    return {
      fcpDelta: after.firstContentfulPaint - before.firstContentfulPaint,
      lcpDelta: after.largestContentfulPaint - before.largestContentfulPaint,
      tbtDelta: after.totalBlockingTime - before.totalBlockingTime,
      clsDelta: after.cumulativeLayoutShift - before.cumulativeLayoutShift,
      ttiDelta: after.timeToInteractive - before.timeToInteractive,
    };
  }

  private clampScore(value: number): number {
    return Math.round(Math.max(0, Math.min(100, value)));
  }
}
