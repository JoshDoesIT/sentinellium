/**
 * @module PII Pipeline
 * @description Orchestrates the full DLP flow:
 *   input text → PII detection → domain risk → action decision.
 *
 * Action logic:
 *   - No PII → ALLOW
 *   - PII on non-LLM site → ALLOW
 *   - High-severity PII (SSN, CC, API key) on any LLM → BLOCK
 *   - Lower-severity PII on HIGH-risk LLM → BLOCK
 *   - Lower-severity PII on MEDIUM-risk LLM → WARN
 */
import { type PiiMatch, PiiType } from "./pii-detector";
import { type DomainClassification, DomainRisk } from "./llm-domain-monitor";

/* ── Types ── */

/** Pipeline action decision. */
export enum PipelineAction {
  ALLOW = "ALLOW",
  WARN = "WARN",
  BLOCK = "BLOCK",
}

/** Pipeline evaluation result. */
export interface PipelineResult {
  action: PipelineAction;
  matches: PiiMatch[];
  platform: string | null;
  risk: DomainRisk;
}

/** Detector dependency interface. */
interface DetectorDep {
  scan(text: string): PiiMatch[];
}

/** Monitor dependency interface. */
interface MonitorDep {
  classify(domain: string): DomainClassification;
}

/* ── Constants ── */

/** PII types that always trigger BLOCK on any LLM. */
const CRITICAL_PII: Set<PiiType> = new Set([
  PiiType.SSN,
  PiiType.CREDIT_CARD,
  PiiType.API_KEY,
]);

/* ── Pipeline ── */

/**
 * Evaluates text for DLP risk on a given domain.
 */
export class PiiPipeline {
  private readonly detector: DetectorDep;
  private readonly monitor: MonitorDep;

  constructor(detector: DetectorDep, monitor: MonitorDep) {
    this.detector = detector;
    this.monitor = monitor;
  }

  /**
   * Evaluate text for DLP risk.
   *
   * @param text - The text to evaluate
   * @param domain - The current domain
   * @returns Pipeline result with action and PII matches
   */
  evaluate(text: string, domain: string): PipelineResult {
    const matches = this.detector.scan(text);
    const classification = this.monitor.classify(domain);

    // No PII → ALLOW
    if (matches.length === 0) {
      return {
        action: PipelineAction.ALLOW,
        matches,
        platform: classification.platform,
        risk: classification.risk,
      };
    }

    // PII on non-LLM site → ALLOW
    if (!classification.isLlm) {
      return {
        action: PipelineAction.ALLOW,
        matches,
        platform: classification.platform,
        risk: classification.risk,
      };
    }

    // Determine action based on PII severity and domain risk
    const hasCritical = matches.some((m) => CRITICAL_PII.has(m.type));

    if (hasCritical) {
      return {
        action: PipelineAction.BLOCK,
        matches,
        platform: classification.platform,
        risk: classification.risk,
      };
    }

    // Non-critical PII on LLM
    const action =
      classification.risk === DomainRisk.HIGH
        ? PipelineAction.BLOCK
        : PipelineAction.WARN;

    return {
      action,
      matches,
      platform: classification.platform,
      risk: classification.risk,
    };
  }
}
