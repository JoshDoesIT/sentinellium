/**
 * @module C2PA Test Suite
 * @description C2PA validation test suite with known manifests.
 * Tests validator accuracy against pre-labeled manifest samples.
 */

/* ── Types ── */

export enum ValidationOutcome {
  VALID = "valid",
  TAMPERED = "tampered",
  MISSING = "missing",
  EXPIRED = "expired",
}

export interface ManifestSample {
  id: string;
  description: string;
  manifest: Record<string, unknown>;
  expectedOutcome: ValidationOutcome;
}

export interface ValidationResult {
  manifestId: string;
  expected: ValidationOutcome;
  actual: ValidationOutcome;
  passed: boolean;
}

export interface SuiteReport {
  total: number;
  passed: number;
  failed: number;
  results: ValidationResult[];
}

export interface CoverageReport {
  totalManifests: number;
  byOutcome: Record<string, number>;
}

/* ── Suite ── */

/**
 * C2PA validation test suite.
 */
export class C2paTestSuite {
  private readonly manifests: ManifestSample[] = [];
  private validator:
    | ((manifest: Record<string, unknown>) => ValidationOutcome)
    | null = null;

  /**
   * Add a known manifest sample.
   *
   * @param sample - Manifest with expected outcome
   */
  addManifest(sample: ManifestSample): void {
    this.manifests.push(sample);
  }

  /** Get all manifest samples. */
  getManifests(): ManifestSample[] {
    return [...this.manifests];
  }

  /**
   * Set the validator function.
   *
   * @param validator - Function that validates manifests
   */
  setValidator(
    validator: (manifest: Record<string, unknown>) => ValidationOutcome,
  ): void {
    this.validator = validator;
  }

  /** Check if a validator is set. */
  hasValidator(): boolean {
    return this.validator !== null;
  }

  /** Run all manifest tests. */
  runAll(): SuiteReport {
    if (!this.validator) throw new Error("No validator set");

    const results: ValidationResult[] = this.manifests.map((sample) => {
      const actual = this.validator!(sample.manifest);
      return {
        manifestId: sample.id,
        expected: sample.expectedOutcome,
        actual,
        passed: actual === sample.expectedOutcome,
      };
    });

    return {
      total: results.length,
      passed: results.filter((r) => r.passed).length,
      failed: results.filter((r) => !r.passed).length,
      results,
    };
  }

  /** Get coverage breakdown by outcome type. */
  getCoverageReport(): CoverageReport {
    const byOutcome: Record<string, number> = {};
    for (const sample of this.manifests) {
      byOutcome[sample.expectedOutcome] =
        (byOutcome[sample.expectedOutcome] ?? 0) + 1;
    }
    return { totalManifests: this.manifests.length, byOutcome };
  }
}
