/**
 * @module Threat Scorer Tests
 * @description TDD tests for the threat scoring and classification
 * module. Combines signals from URL analysis, signature matching,
 * ML inference, and DOM heuristics into a final threat verdict.
 */
import { describe, it, expect } from "vitest";
import { ThreatScorer, ThreatLevel, type ThreatSignals } from "./threat-scorer";
import { UrlRiskLevel } from "./url-analyzer";

/* ── Test Fixtures ── */

const cleanSignals: ThreatSignals = {
  urlAnalysis: {
    score: 0,
    riskLevel: UrlRiskLevel.LOW,
    signals: [],
  },
  signatureMatch: {
    matched: false,
    blocklisted: false,
    allowlisted: false,
    contentPatterns: [],
    urlPatterns: [],
  },
  mlInference: {
    classification: "SAFE",
    confidence: 0.95,
    reasoning: "No suspicious indicators detected",
  },
  domHeuristics: {
    hasPasswordForm: false,
    hasCreditCardForm: false,
    linkMismatchCount: 0,
    brandDomainMismatch: false,
    urgencySignals: 0,
  },
};

const phishingSignals: ThreatSignals = {
  urlAnalysis: {
    score: 65,
    riskLevel: UrlRiskLevel.CRITICAL,
    signals: ["homoglyph", "suspicious_tld"],
  },
  signatureMatch: {
    matched: true,
    blocklisted: true,
    allowlisted: false,
    contentPatterns: ["urgency", "credential_harvesting"],
    urlPatterns: ["brand_in_path"],
  },
  mlInference: {
    classification: "CONFIRMED_PHISHING",
    confidence: 0.98,
    reasoning: "Strong brand impersonation with credential harvesting",
  },
  domHeuristics: {
    hasPasswordForm: true,
    hasCreditCardForm: false,
    linkMismatchCount: 3,
    brandDomainMismatch: true,
    urgencySignals: 2,
  },
};

const suspiciousSignals: ThreatSignals = {
  urlAnalysis: {
    score: 25,
    riskLevel: UrlRiskLevel.MEDIUM,
    signals: ["suspicious_tld"],
  },
  signatureMatch: {
    matched: false,
    blocklisted: false,
    allowlisted: false,
    contentPatterns: [],
    urlPatterns: [],
  },
  mlInference: {
    classification: "SUSPICIOUS",
    confidence: 0.6,
    reasoning: "Some suspicious patterns but not conclusive",
  },
  domHeuristics: {
    hasPasswordForm: true,
    hasCreditCardForm: false,
    linkMismatchCount: 1,
    brandDomainMismatch: false,
    urgencySignals: 1,
  },
};

describe("Threat Scorer", () => {
  let scorer: ThreatScorer;

  /* ── Initialization ── */

  describe("initialization", () => {
    it("creates an instance with default weights", () => {
      scorer = new ThreatScorer();
      expect(scorer).toBeInstanceOf(ThreatScorer);
    });

    it("accepts custom weight overrides", () => {
      scorer = new ThreatScorer({
        urlWeight: 0.4,
        signatureWeight: 0.2,
        mlWeight: 0.3,
        domWeight: 0.1,
      });
      expect(scorer).toBeInstanceOf(ThreatScorer);
    });
  });

  /* ── Score Calculation ── */

  describe("score calculation", () => {
    it("scores clean signals as low risk", () => {
      scorer = new ThreatScorer();
      const result = scorer.assess(cleanSignals);
      expect(result.score).toBeLessThan(20);
      expect(result.level).toBe(ThreatLevel.SAFE);
    });

    it("scores phishing signals as critical", () => {
      scorer = new ThreatScorer();
      const result = scorer.assess(phishingSignals);
      expect(result.score).toBeGreaterThan(70);
      expect(result.level).toBe(ThreatLevel.CONFIRMED_PHISHING);
    });

    it("scores suspicious signals as medium", () => {
      scorer = new ThreatScorer();
      const result = scorer.assess(suspiciousSignals);
      expect(result.score).toBeGreaterThanOrEqual(20);
      expect(result.score).toBeLessThan(70);
    });

    it("produces a score between 0 and 100", () => {
      scorer = new ThreatScorer();
      const result = scorer.assess(cleanSignals);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  /* ── Classification ── */

  describe("classification", () => {
    it("classifies SAFE when all signals are clean", () => {
      scorer = new ThreatScorer();
      const result = scorer.assess(cleanSignals);
      expect(result.level).toBe(ThreatLevel.SAFE);
    });

    it("classifies CONFIRMED_PHISHING when blocklisted", () => {
      scorer = new ThreatScorer();
      const signals: ThreatSignals = {
        ...cleanSignals,
        signatureMatch: {
          ...cleanSignals.signatureMatch,
          matched: true,
          blocklisted: true,
        },
      };
      const result = scorer.assess(signals);
      expect(result.level).toBe(ThreatLevel.CONFIRMED_PHISHING);
    });

    it("classifies SAFE when allowlisted regardless of other signals", () => {
      scorer = new ThreatScorer();
      const signals: ThreatSignals = {
        ...phishingSignals,
        signatureMatch: {
          ...phishingSignals.signatureMatch,
          allowlisted: true,
          blocklisted: false,
        },
      };
      const result = scorer.assess(signals);
      expect(result.level).toBe(ThreatLevel.SAFE);
    });
  });

  /* ── Confidence ── */

  describe("confidence", () => {
    it("returns high confidence for clean pages", () => {
      scorer = new ThreatScorer();
      const result = scorer.assess(cleanSignals);
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it("returns high confidence for clear phishing", () => {
      scorer = new ThreatScorer();
      const result = scorer.assess(phishingSignals);
      expect(result.confidence).toBeGreaterThan(0.8);
    });
  });

  /* ── Explainability ── */

  describe("explainability", () => {
    it("lists triggered signals in the assessment", () => {
      scorer = new ThreatScorer();
      const result = scorer.assess(phishingSignals);
      expect(result.triggeredSignals.length).toBeGreaterThan(0);
    });

    it("includes reasoning from ML inference", () => {
      scorer = new ThreatScorer();
      const result = scorer.assess(phishingSignals);
      expect(result.reasoning).toBeTruthy();
    });

    it("returns empty signals for clean pages", () => {
      scorer = new ThreatScorer();
      const result = scorer.assess(cleanSignals);
      expect(result.triggeredSignals.length).toBe(0);
    });
  });

  /* ── Custom Weights ── */

  describe("custom weights", () => {
    it("adjusts scoring based on custom weights", () => {
      const mlHeavy = new ThreatScorer({
        urlWeight: 0.1,
        signatureWeight: 0.1,
        mlWeight: 0.7,
        domWeight: 0.1,
      });
      const urlHeavy = new ThreatScorer({
        urlWeight: 0.7,
        signatureWeight: 0.1,
        mlWeight: 0.1,
        domWeight: 0.1,
      });

      // Signals with high URL score but low ML score
      const mixedSignals: ThreatSignals = {
        urlAnalysis: {
          score: 80,
          riskLevel: UrlRiskLevel.CRITICAL,
          signals: ["homoglyph"],
        },
        signatureMatch: cleanSignals.signatureMatch,
        mlInference: {
          classification: "SAFE",
          confidence: 0.9,
          reasoning: "ML thinks safe",
        },
        domHeuristics: cleanSignals.domHeuristics,
      };

      const mlResult = mlHeavy.assess(mixedSignals);
      const urlResult = urlHeavy.assess(mixedSignals);

      // URL-heavy scorer should produce higher score for high-URL signals
      expect(urlResult.score).toBeGreaterThan(mlResult.score);
    });
  });
});
