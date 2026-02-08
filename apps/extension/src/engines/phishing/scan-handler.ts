/**
 * @module Scan Handler
 * @description Orchestrates the phishing detection pipeline.
 * Chains url-analyzer → signature-db → threat-scorer to produce
 * a ScanVerdict from a ScanRequest.
 *
 * Called by the background service worker when it receives
 * a SCAN_REQUEST message from the content script.
 */
import { analyzeUrl } from "./url-analyzer";
import { SignatureDatabase } from "./signature-db";
import {
  ThreatScorer,
  ThreatLevel,
  type DomSignalInput,
} from "./threat-scorer";

/* ── Types ── */

/** Input from the content script. */
export interface ScanRequest {
  url: string;
  title: string;
  timestamp: number;
  /** Optional DOM heuristic signals extracted by the content script. */
  domSignals?: DomSignalInput;
  /** Optional page text for content pattern matching. */
  pageText?: string;
}

/** Output of the scan pipeline. */
export interface ScanVerdict {
  url: string;
  domain: string;
  level: ThreatLevel;
  score: number;
  confidence: number;
  shouldWarn: boolean;
  triggeredSignals: string[];
  reasoning: string;
}

/* ── Shared Instances ── */

const signatureDb = new SignatureDatabase();
const scorer = new ThreatScorer();

/* ── Default DOM Signals ── */

const DEFAULT_DOM_SIGNALS: DomSignalInput = {
  hasPasswordForm: false,
  hasCreditCardForm: false,
  linkMismatchCount: 0,
  brandDomainMismatch: false,
  urgencySignals: 0,
};

/* ── Handler ── */

/**
 * Process a scan request through the full phishing detection pipeline.
 *
 * @param request - Scan request from the content script
 * @returns Scan verdict with threat level, score, and signals
 */
export function handleScan(request: ScanRequest): ScanVerdict {
  const { url, pageText } = request;

  // 1. URL structure analysis
  const urlResult = analyzeUrl(url);

  // 2. Extract domain for signature checks
  let domain: string;
  try {
    domain = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    domain = url;
  }

  // 3. Signature database checks
  const domainCheck = signatureDb.checkDomain(domain);
  const isAllowlisted = signatureDb.isAllowlisted(domain);
  const urlPatterns = signatureDb.matchUrlPattern(url);
  const contentPatterns = pageText ? signatureDb.matchContent(pageText) : [];

  // 4. Build threat signals for the scorer
  const assessment = scorer.assess({
    urlAnalysis: {
      score: urlResult.score,
      riskLevel: urlResult.riskLevel,
      signals: urlResult.signals,
    },
    signatureMatch: {
      matched: domainCheck.matched,
      blocklisted: domainCheck.matched,
      allowlisted: isAllowlisted,
      contentPatterns: contentPatterns.map(
        (p) => p.description ?? p.pattern ?? "",
      ),
      urlPatterns: urlPatterns.map((p) => p.description ?? p.pattern ?? ""),
    },
    mlInference: {
      classification: "SAFE",
      confidence: 0,
      reasoning: "ML model not loaded",
    },
    domHeuristics: request.domSignals ?? DEFAULT_DOM_SIGNALS,
  });

  return {
    url,
    domain,
    level: assessment.level,
    score: assessment.score,
    confidence: assessment.confidence,
    shouldWarn: assessment.level !== ThreatLevel.SAFE,
    triggeredSignals: assessment.triggeredSignals,
    reasoning: assessment.reasoning,
  };
}
