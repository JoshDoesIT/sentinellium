/**
 * @module DLP Benchmark
 * @description DLP detection accuracy benchmarks.
 * Evaluates detector performance across data categories
 * with accuracy metrics and category breakdowns.
 */

/* ── Types ── */

export enum DataCategory {
  PII = "pii",
  PHI = "phi",
  FINANCIAL = "financial",
  CREDENTIALS = "credentials",
  IP = "intellectual-property",
}

export interface DlpSample {
  input: string;
  expectedCategories: DataCategory[];
}

export interface DlpMetrics {
  total: number;
  correct: number;
  falsePositives: number;
  falseNegatives: number;
  accuracy: number;
}

/* ── Benchmark ── */

/**
 * DLP detection accuracy benchmark.
 */
export class DlpBenchmark {
  private readonly samples: DlpSample[] = [];
  private detector: (input: string) => DataCategory[] = () => [];

  /**
   * Add a labeled sample.
   *
   * @param sample - Input with expected categories
   */
  addSample(sample: DlpSample): void {
    this.samples.push(sample);
  }

  /** Get all samples. */
  getSamples(): DlpSample[] {
    return [...this.samples];
  }

  /**
   * Set the DLP detector function.
   *
   * @param detector - Function that classifies inputs
   */
  setDetector(detector: (input: string) => DataCategory[]): void {
    this.detector = detector;
  }

  /** Evaluate detector accuracy. */
  evaluate(): DlpMetrics {
    let correct = 0;
    let fp = 0;
    let fn = 0;

    for (const sample of this.samples) {
      const detected = this.detector(sample.input);
      const expectedSet = new Set(sample.expectedCategories);
      const detectedSet = new Set(detected);

      const hasExpected = expectedSet.size > 0;
      const hasDetected = detectedSet.size > 0;

      if (!hasExpected && !hasDetected) {
        correct++;
      } else if (hasExpected && hasDetected) {
        // Check if sets match
        const allFound = [...expectedSet].every((c) => detectedSet.has(c));
        const noExtra = [...detectedSet].every((c) => expectedSet.has(c));
        if (allFound && noExtra) correct++;
        else if (!allFound) fn++;
        else fp++;
      } else if (!hasExpected && hasDetected) {
        fp++;
      } else {
        fn++;
      }
    }

    return {
      total: this.samples.length,
      correct,
      falsePositives: fp,
      falseNegatives: fn,
      accuracy: this.samples.length > 0 ? correct / this.samples.length : 0,
    };
  }

  /** Get category breakdown. */
  getCategoryBreakdown(): Record<string, number> {
    const breakdown: Record<string, number> = {};
    for (const sample of this.samples) {
      for (const cat of sample.expectedCategories) {
        breakdown[cat] = (breakdown[cat] ?? 0) + 1;
      }
    }
    return breakdown;
  }
}
