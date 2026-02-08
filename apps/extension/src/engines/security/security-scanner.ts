/**
 * @module Security Scanner
 * @description Security scanning pipeline supporting SAST, DAST, and SCA checks.
 * Runs registered checks and produces pass/fail reports with history.
 */

/* ── Types ── */

export enum ScanType {
  SAST = "SAST",
  DAST = "DAST",
  SCA = "SCA",
}

export interface CheckResult {
  passed: boolean;
  details: string;
}

export interface SecurityCheck {
  id: string;
  name: string;
  type: ScanType;
  check: () => CheckResult;
}

export interface ScanResult {
  checkId: string;
  checkName: string;
  type: ScanType;
  passed: boolean;
  details: string;
}

export interface ScanReport {
  timestamp: number;
  passed: boolean;
  results: ScanResult[];
}

/* ── Scanner ── */

/**
 * Security scanner with pluggable checks.
 */
export class SecurityScanner {
  private readonly checks: SecurityCheck[] = [];
  private readonly history: ScanReport[] = [];

  /**
   * Register a security check.
   *
   * @param check - Check definition
   */
  registerCheck(check: SecurityCheck): void {
    this.checks.push(check);
  }

  /** List all registered checks. */
  listChecks(): SecurityCheck[] {
    return [...this.checks];
  }

  /** Run all registered checks and produce a report. */
  runScan(): ScanReport {
    const results: ScanResult[] = this.checks.map((check) => {
      const result = check.check();
      return {
        checkId: check.id,
        checkName: check.name,
        type: check.type,
        passed: result.passed,
        details: result.details,
      };
    });

    const report: ScanReport = {
      timestamp: Date.now(),
      passed: results.every((r) => r.passed),
      results,
    };

    this.history.push(report);
    return report;
  }

  /** Get scan history. */
  getScanHistory(): ScanReport[] {
    return [...this.history];
  }
}
