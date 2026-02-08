/**
 * @module Phishing Test Harness
 * @description Phishing detection accuracy benchmarking.
 * Evaluates detector performance with precision, recall,
 * and confusion matrix reporting.
 */

/* ── Types ── */

export type Label = "phishing" | "legitimate";

export interface Sample {
  url: string;
  label: Label;
}

export interface AccuracyMetrics {
  total: number;
  truePositives: number;
  trueNegatives: number;
  falsePositives: number;
  falseNegatives: number;
  precision: number;
  recall: number;
  f1Score: number;
  accuracy: number;
}

export interface ConfusionMatrix {
  tp: number;
  tn: number;
  fp: number;
  fn: number;
}

export interface BenchmarkReport {
  totalSamples: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
}

/* ── Harness ── */

/**
 * Phishing detection accuracy test harness.
 */
export class PhishingTestHarness {
  private readonly samples: Sample[] = [];
  private detector: (url: string) => Label = () => "legitimate";
  private lastMetrics: AccuracyMetrics | null = null;

  /**
   * Add a labeled sample.
   *
   * @param sample - URL with ground truth label
   */
  addSample(sample: Sample): void {
    this.samples.push(sample);
  }

  /** Get all samples. */
  getSamples(): Sample[] {
    return [...this.samples];
  }

  /**
   * Set the detector function to evaluate.
   *
   * @param detector - Function that classifies URLs
   */
  setDetector(detector: (url: string) => Label): void {
    this.detector = detector;
  }

  /** Evaluate the detector against all samples. */
  evaluate(): AccuracyMetrics {
    let tp = 0;
    let tn = 0;
    let fp = 0;
    let fn = 0;

    for (const sample of this.samples) {
      const prediction = this.detector(sample.url);
      if (sample.label === "phishing" && prediction === "phishing") tp++;
      else if (sample.label === "legitimate" && prediction === "legitimate")
        tn++;
      else if (sample.label === "legitimate" && prediction === "phishing") fp++;
      else if (sample.label === "phishing" && prediction === "legitimate") fn++;
    }

    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1Score =
      precision + recall > 0
        ? (2 * precision * recall) / (precision + recall)
        : 0;
    const accuracy =
      this.samples.length > 0 ? (tp + tn) / this.samples.length : 0;

    this.lastMetrics = {
      total: this.samples.length,
      truePositives: tp,
      trueNegatives: tn,
      falsePositives: fp,
      falseNegatives: fn,
      precision,
      recall,
      f1Score,
      accuracy,
    };

    return this.lastMetrics;
  }

  /** Get the confusion matrix from the last evaluation. */
  getConfusionMatrix(): ConfusionMatrix {
    if (!this.lastMetrics) throw new Error("No evaluation run yet");
    return {
      tp: this.lastMetrics.truePositives,
      tn: this.lastMetrics.trueNegatives,
      fp: this.lastMetrics.falsePositives,
      fn: this.lastMetrics.falseNegatives,
    };
  }

  /** Generate a benchmark report. */
  getBenchmarkReport(): BenchmarkReport {
    if (!this.lastMetrics) throw new Error("No evaluation run yet");
    return {
      totalSamples: this.lastMetrics.total,
      accuracy: this.lastMetrics.accuracy,
      precision: this.lastMetrics.precision,
      recall: this.lastMetrics.recall,
      f1Score: this.lastMetrics.f1Score,
    };
  }
}
