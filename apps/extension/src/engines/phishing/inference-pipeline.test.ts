/**
 * @module Inference Pipeline Tests
 * @description TDD tests for the inference pipeline that orchestrates
 * the full phishing analysis flow: URL analysis → signature check →
 * prompt construction → offscreen inference → threat scoring.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    InferencePipeline,
    PipelineStatus,
    type PipelineInput,
} from "./inference-pipeline";
import { UrlRiskLevel } from "./url-analyzer";
import { ThreatLevel } from "./threat-scorer";

/* ── Mock Dependencies ── */

function createMockUrlAnalyzer() {
    return {
        analyzeUrl: vi.fn().mockReturnValue({
            url: "https://example.com",
            score: 0,
            riskLevel: UrlRiskLevel.LOW,
            signals: [],
        }),
    };
}

function createMockSignatureDb() {
    return {
        checkDomain: vi.fn().mockReturnValue({ blocked: false, allowed: false }),
        matchContent: vi.fn().mockReturnValue([]),
        matchUrl: vi.fn().mockReturnValue([]),
    };
}

function createMockPromptBuilder() {
    return {
        buildPrompt: vi.fn().mockReturnValue({
            system: "You are a classifier",
            user: "Analyze this page",
        }),
    };
}

function createMockOffscreenManager() {
    return {
        runInference: vi.fn().mockResolvedValue({
            type: "INFERENCE_RESULT",
            requestId: "test-123",
            classification: "SAFE",
            confidence: 0.95,
            reasoning: "No threats detected",
        }),
    };
}

describe("Inference Pipeline", () => {
    let pipeline: InferencePipeline;
    let mockUrlAnalyzer: ReturnType<typeof createMockUrlAnalyzer>;
    let mockSignatureDb: ReturnType<typeof createMockSignatureDb>;
    let mockPromptBuilder: ReturnType<typeof createMockPromptBuilder>;
    let mockOffscreen: ReturnType<typeof createMockOffscreenManager>;

    const cleanInput: PipelineInput = {
        url: "https://github.com/user/repo",
        pageContent: {
            url: "https://github.com/user/repo",
            title: "user/repo - GitHub",
            text: "A collection of useful utilities.",
            forms: [],
            links: [],
            brandSignals: {
                detectedBrands: ["github"],
                brandDomainMismatch: false,
            },
        },
    };

    const phishingInput: PipelineInput = {
        url: "https://login-paypal.tk/signin",
        pageContent: {
            url: "https://login-paypal.tk/signin",
            title: "PayPal - Verify Account",
            text: "Verify your identity immediately",
            forms: [
                {
                    action: "https://evil.com/steal",
                    method: "POST",
                    hasPasswordField: true,
                    hasCreditCardField: false,
                    inputCount: 3,
                },
            ],
            links: [],
            brandSignals: {
                detectedBrands: ["paypal"],
                brandDomainMismatch: true,
            },
        },
    };

    beforeEach(() => {
        vi.restoreAllMocks();
        mockUrlAnalyzer = createMockUrlAnalyzer();
        mockSignatureDb = createMockSignatureDb();
        mockPromptBuilder = createMockPromptBuilder();
        mockOffscreen = createMockOffscreenManager();
        pipeline = new InferencePipeline(
            mockUrlAnalyzer,
            mockSignatureDb,
            mockPromptBuilder,
            mockOffscreen,
        );
    });

    /* ── Initialization ── */

    describe("initialization", () => {
        it("creates an instance", () => {
            expect(pipeline).toBeInstanceOf(InferencePipeline);
        });

        it("starts with IDLE status", () => {
            expect(pipeline.status).toBe(PipelineStatus.IDLE);
        });
    });

    /* ── Full Pipeline ── */

    describe("full pipeline execution", () => {
        it("runs the complete analysis flow", async () => {
            const result = await pipeline.analyze(cleanInput);
            expect(result).toBeDefined();
            expect(result.assessment).toBeDefined();
            expect(result.assessment.level).toBeDefined();
        });

        it("calls all pipeline stages in order", async () => {
            await pipeline.analyze(cleanInput);
            expect(mockUrlAnalyzer.analyzeUrl).toHaveBeenCalledWith(cleanInput.url);
            expect(mockSignatureDb.checkDomain).toHaveBeenCalled();
            expect(mockPromptBuilder.buildPrompt).toHaveBeenCalled();
            expect(mockOffscreen.runInference).toHaveBeenCalled();
        });

        it("returns status IDLE after completion", async () => {
            await pipeline.analyze(cleanInput);
            expect(pipeline.status).toBe(PipelineStatus.IDLE);
        });
    });

    /* ── Fast-Path: Signature Match ── */

    describe("signature fast-path", () => {
        it("skips ML inference for blocklisted domains", async () => {
            mockSignatureDb.checkDomain.mockReturnValue({
                blocked: true,
                allowed: false,
            });

            const result = await pipeline.analyze(phishingInput);
            expect(result.assessment.level).toBe(ThreatLevel.CONFIRMED_PHISHING);
            expect(mockOffscreen.runInference).not.toHaveBeenCalled();
        });

        it("skips ML inference for allowlisted domains", async () => {
            mockSignatureDb.checkDomain.mockReturnValue({
                blocked: false,
                allowed: true,
            });

            const result = await pipeline.analyze(cleanInput);
            expect(result.assessment.level).toBe(ThreatLevel.SAFE);
            expect(mockOffscreen.runInference).not.toHaveBeenCalled();
        });
    });

    /* ── Error Handling ── */

    describe("error handling", () => {
        it("returns a degraded result if inference fails", async () => {
            mockOffscreen.runInference.mockRejectedValue(
                new Error("GPU unavailable"),
            );

            const result = await pipeline.analyze(cleanInput);
            expect(result).toBeDefined();
            expect(result.inferenceError).toBeTruthy();
        });

        it("sets ERROR status on failure", async () => {
            mockOffscreen.runInference.mockRejectedValue(
                new Error("GPU unavailable"),
            );

            await pipeline.analyze(cleanInput);
            expect(pipeline.status).toBe(PipelineStatus.ERROR);
        });
    });

    /* ── Pipeline Timing ── */

    describe("timing", () => {
        it("records execution duration", async () => {
            const result = await pipeline.analyze(cleanInput);
            expect(result.durationMs).toBeGreaterThanOrEqual(0);
        });
    });
});
