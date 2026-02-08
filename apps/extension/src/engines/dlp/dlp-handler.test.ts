/**
 * @module DLP Handler Tests
 * @description TDD tests for the DLP pipeline orchestrator.
 * Chains llm-domain-monitor → pii-detector to classify
 * input text for PII on LLM platforms.
 */
import { describe, it, expect } from "vitest";
import {
    handleDlpScan,
    type DlpScanRequest,
} from "./dlp-handler";
import { DomainRisk } from "./llm-domain-monitor";

/* ── Test Fixtures ── */

const chatGptPiiRequest: DlpScanRequest = {
    domain: "chatgpt.com",
    text: "My SSN is 123-45-6789 and my credit card is 4111111111111111",
    elementType: "textarea",
    isPaste: true,
};

const chatGptSafeRequest: DlpScanRequest = {
    domain: "chatgpt.com",
    text: "Tell me about the history of Rome",
    elementType: "textarea",
    isPaste: false,
};

const nonLlmPiiRequest: DlpScanRequest = {
    domain: "example.com",
    text: "My SSN is 123-45-6789",
    elementType: "input",
    isPaste: false,
};

const claudePiiRequest: DlpScanRequest = {
    domain: "claude.ai",
    text: "Here is my API key: sk-1234567890abcdef1234567890abcdef",
    elementType: "textarea",
    isPaste: true,
};

const emptyTextRequest: DlpScanRequest = {
    domain: "chatgpt.com",
    text: "",
    elementType: "textarea",
    isPaste: false,
};

describe("DLP Handler", () => {
    /* ── LLM Domain Detection ── */

    describe("LLM domain detection", () => {
        it("identifies ChatGPT as a HIGH risk LLM domain", () => {
            const result = handleDlpScan(chatGptPiiRequest);
            expect(result.isLlmDomain).toBe(true);
            expect(result.domainRisk).toBe(DomainRisk.HIGH);
        });

        it("identifies Claude as a HIGH risk LLM domain", () => {
            const result = handleDlpScan(claudePiiRequest);
            expect(result.isLlmDomain).toBe(true);
            expect(result.platform).toBe("Claude");
        });

        it("classifies non-LLM domains as NONE risk", () => {
            const result = handleDlpScan(nonLlmPiiRequest);
            expect(result.isLlmDomain).toBe(false);
            expect(result.domainRisk).toBe(DomainRisk.NONE);
        });
    });

    /* ── PII Detection ── */

    describe("PII detection on LLM domains", () => {
        it("detects SSN and credit card in text on ChatGPT", () => {
            const result = handleDlpScan(chatGptPiiRequest);
            expect(result.piiFound).toBe(true);
            expect(result.piiMatches.length).toBeGreaterThanOrEqual(2);
        });

        it("detects API keys on Claude", () => {
            const result = handleDlpScan(claudePiiRequest);
            expect(result.piiFound).toBe(true);
            expect(result.piiMatches.some((m: { type: string }) => m.type === "API_KEY")).toBe(true);
        });

        it("returns no PII for safe text on LLM domains", () => {
            const result = handleDlpScan(chatGptSafeRequest);
            expect(result.piiFound).toBe(false);
            expect(result.piiMatches).toHaveLength(0);
        });

        it("returns shouldIntervene true when PII found on LLM domain", () => {
            const result = handleDlpScan(chatGptPiiRequest);
            expect(result.shouldIntervene).toBe(true);
        });
    });

    /* ── Non-LLM Domains ── */

    describe("non-LLM domain behavior", () => {
        it("skips PII scanning on non-LLM domains", () => {
            const result = handleDlpScan(nonLlmPiiRequest);
            expect(result.shouldIntervene).toBe(false);
            expect(result.piiFound).toBe(false);
        });
    });

    /* ── Edge Cases ── */

    describe("edge cases", () => {
        it("handles empty text gracefully", () => {
            const result = handleDlpScan(emptyTextRequest);
            expect(result.shouldIntervene).toBe(false);
            expect(result.piiMatches).toHaveLength(0);
        });
    });
});
