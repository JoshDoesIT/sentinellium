/**
 * @module Threat Scorer
 * @description Combines signals from URL analysis, signature matching,
 * ML inference, and DOM heuristics into a final threat assessment.
 * Produces a scored, classified, and explained verdict.
 *
 * Scoring weights (default):
 *   URL analysis: 30%, Signature: 25%, ML inference: 35%, DOM: 10%
 */
import { UrlRiskLevel } from "./url-analyzer";

/* ── Types ── */

/** Final threat classification. */
export enum ThreatLevel {
  SAFE = "SAFE",
  SUSPICIOUS = "SUSPICIOUS",
  LIKELY_PHISHING = "LIKELY_PHISHING",
  CONFIRMED_PHISHING = "CONFIRMED_PHISHING",
}

/** Scoring weight configuration. */
export interface ScoringWeights {
  urlWeight: number;
  signatureWeight: number;
  mlWeight: number;
  domWeight: number;
}

/** URL analysis signal input. */
export interface UrlSignalInput {
  score: number;
  riskLevel: UrlRiskLevel;
  signals: string[];
}

/** Signature match signal input. */
export interface SignatureSignalInput {
  matched: boolean;
  blocklisted: boolean;
  allowlisted: boolean;
  contentPatterns: string[];
  urlPatterns: string[];
}

/** ML inference signal input. */
export interface MlSignalInput {
  classification: string;
  confidence: number;
  reasoning: string;
}

/** DOM heuristic signal input. */
export interface DomSignalInput {
  hasPasswordForm: boolean;
  hasCreditCardForm: boolean;
  linkMismatchCount: number;
  brandDomainMismatch: boolean;
  urgencySignals: number;
}

/** All signals combined for scoring. */
export interface ThreatSignals {
  urlAnalysis: UrlSignalInput;
  signatureMatch: SignatureSignalInput;
  mlInference: MlSignalInput;
  domHeuristics: DomSignalInput;
}

/** Final threat assessment result. */
export interface ThreatAssessment {
  /** Numeric risk score (0-100). */
  score: number;
  /** Classification level. */
  level: ThreatLevel;
  /** Confidence in the assessment (0-1). */
  confidence: number;
  /** List of signals that contributed to the score. */
  triggeredSignals: string[];
  /** Human-readable reasoning. */
  reasoning: string;
}

/* ── Constants ── */

const DEFAULT_WEIGHTS: ScoringWeights = {
  urlWeight: 0.3,
  signatureWeight: 0.25,
  mlWeight: 0.35,
  domWeight: 0.1,
};

/** Map ML classification strings to numeric scores. */
const ML_CLASSIFICATION_SCORES: Record<string, number> = {
  SAFE: 0,
  SUSPICIOUS: 40,
  LIKELY_PHISHING: 70,
  CONFIRMED_PHISHING: 100,
};

/** Thresholds for classification. */
const THRESHOLDS = {
  SUSPICIOUS: 25,
  LIKELY_PHISHING: 55,
  CONFIRMED_PHISHING: 75,
};

/* ── Scorer ── */

/**
 * Combines multiple signal sources into a weighted threat score.
 * Fast-paths for blocklisted/allowlisted domains to skip scoring.
 */
export class ThreatScorer {
  private readonly weights: ScoringWeights;

  constructor(weights?: ScoringWeights) {
    this.weights = weights ?? DEFAULT_WEIGHTS;
  }

  /**
   * Assess a set of threat signals and produce a final verdict.
   *
   * Fast-path rules:
   * 1. If allowlisted → SAFE (regardless of other signals)
   * 2. If blocklisted → CONFIRMED_PHISHING (skip scoring)
   *
   * Otherwise, calculate a weighted score from all signal sources.
   */
  assess(signals: ThreatSignals): ThreatAssessment {
    // Fast-path: allowlisted domains are always safe
    if (signals.signatureMatch.allowlisted) {
      return {
        score: 0,
        level: ThreatLevel.SAFE,
        confidence: 1.0,
        triggeredSignals: [],
        reasoning: "Domain is allowlisted",
      };
    }

    // Fast-path: blocklisted domains are always phishing
    if (signals.signatureMatch.blocklisted) {
      return {
        score: 100,
        level: ThreatLevel.CONFIRMED_PHISHING,
        confidence: 1.0,
        triggeredSignals: ["blocklisted_domain"],
        reasoning: "Domain is in the phishing blocklist",
      };
    }

    // Calculate component scores
    const urlScore = this.scoreUrl(signals.urlAnalysis);
    const signatureScore = this.scoreSignature(signals.signatureMatch);
    const mlScore = this.scoreMl(signals.mlInference);
    const domScore = this.scoreDom(signals.domHeuristics);

    // Weighted combination
    const rawScore =
      urlScore * this.weights.urlWeight +
      signatureScore * this.weights.signatureWeight +
      mlScore * this.weights.mlWeight +
      domScore * this.weights.domWeight;

    const score = Math.min(100, Math.max(0, Math.round(rawScore)));
    const level = this.classify(score);
    const triggeredSignals = this.collectSignals(signals);
    const confidence = this.calculateConfidence(signals, score);
    const reasoning = signals.mlInference.reasoning;

    return { score, level, confidence, triggeredSignals, reasoning };
  }

  /* ── Component Scoring ── */

  private scoreUrl(input: UrlSignalInput): number {
    return Math.min(100, input.score);
  }

  private scoreSignature(input: SignatureSignalInput): number {
    let score = 0;
    score += input.contentPatterns.length * 20;
    score += input.urlPatterns.length * 15;
    return Math.min(100, score);
  }

  private scoreMl(input: MlSignalInput): number {
    const base = ML_CLASSIFICATION_SCORES[input.classification] ?? 50;
    return base * input.confidence;
  }

  private scoreDom(input: DomSignalInput): number {
    let score = 0;
    if (input.hasPasswordForm) score += 20;
    if (input.hasCreditCardForm) score += 30;
    if (input.brandDomainMismatch) score += 25;
    score += input.linkMismatchCount * 10;
    score += input.urgencySignals * 10;
    return Math.min(100, score);
  }

  /* ── Classification ── */

  private classify(score: number): ThreatLevel {
    if (score >= THRESHOLDS.CONFIRMED_PHISHING)
      return ThreatLevel.CONFIRMED_PHISHING;
    if (score >= THRESHOLDS.LIKELY_PHISHING) return ThreatLevel.LIKELY_PHISHING;
    if (score >= THRESHOLDS.SUSPICIOUS) return ThreatLevel.SUSPICIOUS;
    return ThreatLevel.SAFE;
  }

  /* ── Confidence ── */

  private calculateConfidence(signals: ThreatSignals, score: number): number {
    // Confidence is higher when signals agree
    const mlConfidence = signals.mlInference.confidence;

    // If score is very high or very low, confidence is high
    if (score >= 80 || score <= 10) {
      return Math.max(mlConfidence, 0.85);
    }
    // Middle-ground scores have lower confidence
    return Math.max(mlConfidence * 0.8, 0.5);
  }

  /* ── Signal Collection ── */

  private collectSignals(signals: ThreatSignals): string[] {
    const triggered: string[] = [];

    // URL signals
    for (const signal of signals.urlAnalysis.signals) {
      triggered.push(`url:${signal}`);
    }

    // Signature patterns
    for (const pattern of signals.signatureMatch.contentPatterns) {
      triggered.push(`content:${pattern}`);
    }
    for (const pattern of signals.signatureMatch.urlPatterns) {
      triggered.push(`urlpattern:${pattern}`);
    }

    // DOM signals
    if (signals.domHeuristics.hasPasswordForm)
      triggered.push("dom:password_form");
    if (signals.domHeuristics.hasCreditCardForm)
      triggered.push("dom:credit_card_form");
    if (signals.domHeuristics.brandDomainMismatch)
      triggered.push("dom:brand_mismatch");
    if (signals.domHeuristics.linkMismatchCount > 0)
      triggered.push("dom:link_mismatch");

    return triggered;
  }
}
