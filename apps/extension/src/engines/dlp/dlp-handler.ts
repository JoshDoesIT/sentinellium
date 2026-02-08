/**
 * @module DLP Handler
 * @description Orchestrates the Data Loss Prevention pipeline.
 * Chains llm-domain-monitor → pii-detector to detect PII being
 * submitted to LLM platforms.
 *
 * Called from the content script when text input or paste events
 * are captured by the input-interceptor.
 */
import { LlmDomainMonitor, DomainRisk } from "./llm-domain-monitor";
import { PiiDetector, type PiiMatch } from "./pii-detector";

/* ── Types ── */

/** Input from the content script input interceptor. */
export interface DlpScanRequest {
  domain: string;
  text: string;
  elementType: string;
  isPaste: boolean;
}

/** Output of the DLP pipeline. */
export interface DlpScanResult {
  isLlmDomain: boolean;
  platform: string | null;
  domainRisk: DomainRisk;
  piiFound: boolean;
  piiMatches: PiiMatch[];
  shouldIntervene: boolean;
}

/* ── Shared Instances ── */

const domainMonitor = new LlmDomainMonitor();
const piiDetector = new PiiDetector();

/* ── Handler ── */

/**
 * Process a DLP scan request through the LLM/PII detection pipeline.
 *
 * @param request - Text input captured from the DOM
 * @returns DLP result with domain classification and PII matches
 */
export function handleDlpScan(request: DlpScanRequest): DlpScanResult {
  const { domain, text } = request;

  // 1. Classify the domain as LLM/non-LLM
  const domainClassification = domainMonitor.classify(domain);

  // 2. If not an LLM domain, skip PII scanning
  if (!domainClassification.isLlm) {
    return {
      isLlmDomain: false,
      platform: null,
      domainRisk: DomainRisk.NONE,
      piiFound: false,
      piiMatches: [],
      shouldIntervene: false,
    };
  }

  // 3. Empty text — nothing to scan
  if (!text.trim()) {
    return {
      isLlmDomain: true,
      platform: domainClassification.platform,
      domainRisk: domainClassification.risk,
      piiFound: false,
      piiMatches: [],
      shouldIntervene: false,
    };
  }

  // 4. Scan text for PII
  const piiMatches = piiDetector.scan(text);
  const piiFound = piiMatches.length > 0;

  return {
    isLlmDomain: true,
    platform: domainClassification.platform,
    domainRisk: domainClassification.risk,
    piiFound,
    piiMatches,
    shouldIntervene: piiFound,
  };
}
