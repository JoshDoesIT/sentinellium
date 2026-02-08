/**
 * @module Scan Handler Tests
 * @description TDD tests for the phishing scan pipeline orchestrator.
 * Chains url-analyzer → signature-db → threat-scorer into a single
 * scan handler that produces a ScanVerdict.
 */
import { describe, it, expect } from "vitest";
import { handleScan, type ScanRequest } from "./scan-handler";
import { ThreatLevel } from "./threat-scorer";

/* ── Test Fixtures ── */

const safeScanRequest: ScanRequest = {
    url: "https://www.google.com/search?q=test",
    title: "Google",
    timestamp: Date.now(),
};

const blocklistedScanRequest: ScanRequest = {
    url: "https://secure-paypal-login.tk/verify",
    title: "Verify Your PayPal Account",
    timestamp: Date.now(),
};

const typosquatScanRequest: ScanRequest = {
    url: "https://www.googel.com/login",
    title: "Sign In",
    timestamp: Date.now(),
};

const suspiciousTldRequest: ScanRequest = {
    url: "https://login-bank.xyz/signin",
    title: "Bank Login",
    timestamp: Date.now(),
};

const domHeuristicsRequest: ScanRequest = {
    url: "https://some-random-site.com/login",
    title: "Microsoft - Verify Account",
    domSignals: {
        hasPasswordForm: true,
        hasCreditCardForm: false,
        linkMismatchCount: 3,
        brandDomainMismatch: true,
        urgencySignals: 2,
    },
    pageText: "Your account has been suspended. Click here to verify your identity immediately.",
    timestamp: Date.now(),
};

describe("Scan Handler", () => {
    /* ── Safe URLs ── */

    describe("safe URLs", () => {
        it("returns SAFE for a legitimate allowlisted URL", () => {
            const verdict = handleScan(safeScanRequest);
            expect(verdict.level).toBe(ThreatLevel.SAFE);
            expect(verdict.shouldWarn).toBe(false);
        });

        it("includes the analyzed URL in the verdict", () => {
            const verdict = handleScan(safeScanRequest);
            expect(verdict.url).toBe(safeScanRequest.url);
        });

        it("has no triggered signals for safe URLs", () => {
            const verdict = handleScan(safeScanRequest);
            expect(verdict.triggeredSignals).toHaveLength(0);
        });
    });

    /* ── Blocklisted Domains ── */

    describe("blocklisted domains", () => {
        it("returns CONFIRMED_PHISHING for a blocklisted domain", () => {
            const verdict = handleScan(blocklistedScanRequest);
            expect(verdict.level).toBe(ThreatLevel.CONFIRMED_PHISHING);
        });

        it("sets shouldWarn to true for blocklisted domains", () => {
            const verdict = handleScan(blocklistedScanRequest);
            expect(verdict.shouldWarn).toBe(true);
        });

        it("has a score of 100 for blocklisted domains", () => {
            const verdict = handleScan(blocklistedScanRequest);
            expect(verdict.score).toBe(100);
        });
    });

    /* ── Typosquatting ── */

    describe("typosquatting detection", () => {
        it("produces a positive score for typosquat domains", () => {
            const verdict = handleScan(typosquatScanRequest);
            // URL analysis score (~20) weighted at 30% → ~6 final score
            expect(verdict.score).toBeGreaterThan(0);
        });

        it("includes typosquat signal in triggered signals", () => {
            const verdict = handleScan(typosquatScanRequest);
            const hasUrlSignal = verdict.triggeredSignals.some(
                (s: string) => s.includes("url:"),
            );
            expect(hasUrlSignal).toBe(true);
        });
    });

    /* ── Suspicious TLDs ── */

    describe("suspicious TLD detection", () => {
        it("flags domains with suspicious TLDs", () => {
            const verdict = handleScan(suspiciousTldRequest);
            expect(verdict.score).toBeGreaterThan(0);
        });
    });

    /* ── DOM Heuristics ── */

    describe("DOM heuristics", () => {
        it("increases score when password form and brand mismatch are present", () => {
            const verdict = handleScan(domHeuristicsRequest);
            expect(verdict.score).toBeGreaterThanOrEqual(25);
            expect(verdict.shouldWarn).toBe(true);
        });

        it("includes DOM signals in triggered signals", () => {
            const verdict = handleScan(domHeuristicsRequest);
            const hasDomSignal = verdict.triggeredSignals.some(
                (s: string) => s.startsWith("dom:"),
            );
            expect(hasDomSignal).toBe(true);
        });

        it("includes content pattern signals when phishing text is present", () => {
            const verdict = handleScan(domHeuristicsRequest);
            const hasContentSignal = verdict.triggeredSignals.some(
                (s: string) => s.startsWith("content:"),
            );
            expect(hasContentSignal).toBe(true);
        });
    });

    /* ── Verdict Structure ── */

    describe("verdict structure", () => {
        it("includes domain in the verdict", () => {
            const verdict = handleScan(blocklistedScanRequest);
            expect(verdict.domain).toBe("secure-paypal-login.tk");
        });

        it("includes confidence value", () => {
            const verdict = handleScan(blocklistedScanRequest);
            expect(verdict.confidence).toBeGreaterThanOrEqual(0);
            expect(verdict.confidence).toBeLessThanOrEqual(1);
        });
    });
});
