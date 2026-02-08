/**
 * @module Compliance Checker
 * @description Compares actual engine state against required policy.
 * Reports violations and calculates compliance percentage.
 */
import { type PolicyDocument } from "./policy-schema-validator";

/* ── Types ── */

/** Compliance status. */
export enum ComplianceStatus {
  COMPLIANT = "COMPLIANT",
  NON_COMPLIANT = "NON_COMPLIANT",
}

/** Engine runtime state (as reported by extension). */
export interface EngineState {
  phishing?: { enabled: boolean; sensitivity: string };
  dlp?: { enabled: boolean; blockedPiiTypes: string[] };
  c2pa?: { enabled: boolean; flagUnverified: boolean };
}

/** A compliance violation. */
export interface Violation {
  engine: string;
  field: string;
  expected: unknown;
  actual: unknown;
}

/** Compliance check result. */
export interface ComplianceResult {
  status: ComplianceStatus;
  violations: Violation[];
  compliancePercent: number;
}

/* ── Checker ── */

/**
 * Checks engine state against required policy.
 */
export class ComplianceChecker {
  /**
   * Check compliance of engine state against policy.
   *
   * @param policy - Required policy
   * @param state - Actual engine state
   * @returns Compliance result with violations
   */
  check(policy: PolicyDocument, state: EngineState): ComplianceResult {
    const violations: Violation[] = [];
    let totalChecks = 0;
    let passedChecks = 0;

    // Check phishing
    if (policy.rules.phishing) {
      totalChecks += 2;
      if (!state.phishing?.enabled && policy.rules.phishing.enabled) {
        violations.push({
          engine: "phishing",
          field: "enabled",
          expected: true,
          actual: state.phishing?.enabled ?? false,
        });
      } else {
        passedChecks++;
      }
      if (state.phishing?.sensitivity !== policy.rules.phishing.sensitivity) {
        violations.push({
          engine: "phishing",
          field: "sensitivity",
          expected: policy.rules.phishing.sensitivity,
          actual: state.phishing?.sensitivity,
        });
      } else {
        passedChecks++;
      }
    }

    // Check DLP
    if (policy.rules.dlp) {
      totalChecks += 2;
      if (!state.dlp?.enabled && policy.rules.dlp.enabled) {
        violations.push({
          engine: "dlp",
          field: "enabled",
          expected: true,
          actual: state.dlp?.enabled ?? false,
        });
      } else {
        passedChecks++;
      }
      const requiredTypes = policy.rules.dlp.blockedPiiTypes;
      const actualTypes = state.dlp?.blockedPiiTypes ?? [];
      const missing = requiredTypes.filter((t) => !actualTypes.includes(t));
      if (missing.length > 0) {
        violations.push({
          engine: "dlp",
          field: "blockedPiiTypes",
          expected: requiredTypes,
          actual: actualTypes,
        });
      } else {
        passedChecks++;
      }
    }

    // Check C2PA
    if (policy.rules.c2pa) {
      totalChecks += 1;
      if (!state.c2pa?.enabled && policy.rules.c2pa.enabled) {
        violations.push({
          engine: "c2pa",
          field: "enabled",
          expected: true,
          actual: state.c2pa?.enabled ?? false,
        });
      } else {
        passedChecks++;
      }
    }

    const compliancePercent =
      totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100;

    return {
      status:
        violations.length === 0
          ? ComplianceStatus.COMPLIANT
          : ComplianceStatus.NON_COMPLIANT,
      violations,
      compliancePercent,
    };
  }
}
