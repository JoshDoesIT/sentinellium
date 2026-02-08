/**
 * @module UI Test Harness
 * @description Playwright-based extension UI test harness.
 * Manages test registration, suite execution, and result reporting.
 */

/* ── Types ── */

export enum TestStatus {
  PASSED = "passed",
  FAILED = "failed",
  SKIPPED = "skipped",
}

export interface TestCase {
  id: string;
  name: string;
  suite: string;
  run: () => { passed: boolean; error?: string };
}

export interface TestResult {
  testId: string;
  testName: string;
  suite: string;
  status: TestStatus;
  error?: string;
  durationMs: number;
}

export interface TestReport {
  browser: string;
  timestamp: number;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  results: TestResult[];
}

export interface HarnessConfig {
  browser: string;
  headless: boolean;
}

/* ── Harness ── */

/**
 * UI test harness for extension testing.
 */
export class UiTestHarness {
  private readonly config: HarnessConfig;
  private readonly tests: TestCase[] = [];
  private readonly history: TestReport[] = [];

  constructor(config: HarnessConfig) {
    this.config = config;
  }

  /**
   * Register a test case.
   *
   * @param test - Test case definition
   */
  registerTest(test: TestCase): void {
    this.tests.push(test);
  }

  /** List all registered tests. */
  listTests(): TestCase[] {
    return [...this.tests];
  }

  /** Run all registered tests. */
  runAll(): TestReport {
    return this.executeTests(this.tests);
  }

  /**
   * Run tests in a specific suite.
   *
   * @param suite - Suite name to run
   */
  runSuite(suite: string): TestReport {
    const filtered = this.tests.filter((t) => t.suite === suite);
    return this.executeTests(filtered);
  }

  /** Get the latest report. */
  getReport(): TestReport {
    return this.history[this.history.length - 1]!;
  }

  /** Get all run history. */
  getHistory(): TestReport[] {
    return [...this.history];
  }

  private executeTests(tests: TestCase[]): TestReport {
    const results: TestResult[] = tests.map((test) => {
      const start = Date.now();
      const result = test.run();
      return {
        testId: test.id,
        testName: test.name,
        suite: test.suite,
        status: result.passed ? TestStatus.PASSED : TestStatus.FAILED,
        error: result.error,
        durationMs: Date.now() - start,
      };
    });

    const report: TestReport = {
      browser: this.config.browser,
      timestamp: Date.now(),
      total: results.length,
      passed: results.filter((r) => r.status === TestStatus.PASSED).length,
      failed: results.filter((r) => r.status === TestStatus.FAILED).length,
      skipped: results.filter((r) => r.status === TestStatus.SKIPPED).length,
      results,
    };

    this.history.push(report);
    return report;
  }
}
