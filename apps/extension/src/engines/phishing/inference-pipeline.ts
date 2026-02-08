/**
 * @module Inference Pipeline
 * @description Orchestrates the full phishing analysis flow:
 *   1. URL analysis (sync, fast)
 *   2. Signature DB check (fast-path: skip inference if matched)
 *   3. Prompt construction from page features
 *   4. Offscreen document inference via ONNX Runtime
 *   5. Threat scoring and classification
 *
 * All dependencies are injected for testability.
 */
import type { PageContent } from "./dom-extractor";
import type { UrlAnalysisResult } from "./url-analyzer";
import type { InferenceRequest, InferenceResult } from "./offscreen-manager";
import type { PromptPair } from "./prompt-builder";
import {
    ThreatScorer,
    type ThreatAssessment,
    type ThreatSignals,
} from "./threat-scorer";
import { UrlRiskLevel } from "./url-analyzer";

/* ── Types ── */

/** Pipeline lifecycle status. */
export enum PipelineStatus {
    IDLE = "IDLE",
    ANALYZING_URL = "ANALYZING_URL",
    CHECKING_SIGNATURES = "CHECKING_SIGNATURES",
    BUILDING_PROMPT = "BUILDING_PROMPT",
    RUNNING_INFERENCE = "RUNNING_INFERENCE",
    SCORING = "SCORING",
    ERROR = "ERROR",
}

/** Input to the inference pipeline. */
export interface PipelineInput {
    url: string;
    pageContent: PageContent;
}

/** Domain check result from signature DB. */
interface DomainCheckResult {
    blocked: boolean;
    allowed: boolean;
}

/** Full pipeline result. */
export interface PipelineResult {
    /** The threat assessment. */
    assessment: ThreatAssessment;
    /** URL analysis details. */
    urlAnalysis: UrlAnalysisResult;
    /** Whether inference was skipped (signature fast-path). */
    inferenceSkipped: boolean;
    /** Error message if inference failed. */
    inferenceError?: string;
    /** Pipeline execution time in ms. */
    durationMs: number;
}

/* ── Dependency Interfaces ── */

interface UrlAnalyzerDep {
    analyzeUrl(url: string): UrlAnalysisResult;
}

interface SignatureDbDep {
    checkDomain(domain: string): DomainCheckResult;
    matchContent(text: string): string[];
    matchUrl(url: string): string[];
}

interface PromptBuilderDep {
    buildPrompt(page: PageContent, urlAnalysis: UrlAnalysisResult): PromptPair;
}

interface OffscreenDep {
    runInference(request: InferenceRequest): Promise<InferenceResult>;
}

/* ── Pipeline ── */

/**
 * Orchestrates the full phishing detection flow.
 *
 * Fast-path: If a domain is blocklisted or allowlisted,
 * the pipeline skips ML inference entirely.
 */
export class InferencePipeline {
    private _status: PipelineStatus = PipelineStatus.IDLE;
    private readonly urlAnalyzer: UrlAnalyzerDep;
    private readonly signatureDb: SignatureDbDep;
    private readonly promptBuilder: PromptBuilderDep;
    private readonly offscreen: OffscreenDep;
    private readonly scorer: ThreatScorer;

    constructor(
        urlAnalyzer: UrlAnalyzerDep,
        signatureDb: SignatureDbDep,
        promptBuilder: PromptBuilderDep,
        offscreen: OffscreenDep,
        scorer?: ThreatScorer,
    ) {
        this.urlAnalyzer = urlAnalyzer;
        this.signatureDb = signatureDb;
        this.promptBuilder = promptBuilder;
        this.offscreen = offscreen;
        this.scorer = scorer ?? new ThreatScorer();
    }

    /** Current pipeline status. */
    get status(): PipelineStatus {
        return this._status;
    }

    /**
     * Run the full analysis pipeline.
     *
     * @param input - Page URL and extracted content
     * @returns The scored threat assessment with metadata
     */
    async analyze(input: PipelineInput): Promise<PipelineResult> {
        const start = Date.now();

        try {
            // Stage 1: URL Analysis
            this._status = PipelineStatus.ANALYZING_URL;
            const urlAnalysis = this.urlAnalyzer.analyzeUrl(input.url);

            // Stage 2: Signature Check
            this._status = PipelineStatus.CHECKING_SIGNATURES;
            const hostname = this.extractHostname(input.url);
            const domainCheck = this.signatureDb.checkDomain(hostname);
            const contentPatterns = this.signatureDb.matchContent(
                input.pageContent.text,
            );
            const urlPatterns = this.signatureDb.matchUrl(input.url);

            // Fast-path: blocklisted
            if (domainCheck.blocked) {
                this._status = PipelineStatus.IDLE;
                return this.buildResult(
                    urlAnalysis,
                    {
                        urlAnalysis: {
                            score: urlAnalysis.score,
                            riskLevel: urlAnalysis.riskLevel,
                            signals: urlAnalysis.signals,
                        },
                        signatureMatch: {
                            matched: true,
                            blocklisted: true,
                            allowlisted: false,
                            contentPatterns,
                            urlPatterns,
                        },
                        mlInference: {
                            classification: "CONFIRMED_PHISHING",
                            confidence: 1.0,
                            reasoning: "Domain is blocklisted",
                        },
                        domHeuristics: this.buildDomSignals(input.pageContent),
                    },
                    true,
                    undefined,
                    start,
                );
            }

            // Fast-path: allowlisted
            if (domainCheck.allowed) {
                this._status = PipelineStatus.IDLE;
                return this.buildResult(
                    urlAnalysis,
                    {
                        urlAnalysis: {
                            score: 0,
                            riskLevel: UrlRiskLevel.LOW,
                            signals: [],
                        },
                        signatureMatch: {
                            matched: true,
                            blocklisted: false,
                            allowlisted: true,
                            contentPatterns: [],
                            urlPatterns: [],
                        },
                        mlInference: {
                            classification: "SAFE",
                            confidence: 1.0,
                            reasoning: "Domain is allowlisted",
                        },
                        domHeuristics: this.buildDomSignals(input.pageContent),
                    },
                    true,
                    undefined,
                    start,
                );
            }

            // Stage 3: Prompt Construction
            this._status = PipelineStatus.BUILDING_PROMPT;
            const prompt = this.promptBuilder.buildPrompt(
                input.pageContent,
                urlAnalysis,
            );

            // Stage 4: ML Inference
            this._status = PipelineStatus.RUNNING_INFERENCE;
            let mlResult: InferenceResult;
            try {
                mlResult = await this.offscreen.runInference({
                    type: "INFERENCE_REQUEST",
                    system: prompt.system,
                    user: prompt.user,
                    requestId: crypto.randomUUID(),
                });
            } catch (error) {
                // Degraded mode: score without ML
                this._status = PipelineStatus.ERROR;
                const errorMsg =
                    error instanceof Error ? error.message : "Unknown inference error";
                return this.buildResult(
                    urlAnalysis,
                    {
                        urlAnalysis: {
                            score: urlAnalysis.score,
                            riskLevel: urlAnalysis.riskLevel,
                            signals: urlAnalysis.signals,
                        },
                        signatureMatch: {
                            matched: contentPatterns.length > 0 || urlPatterns.length > 0,
                            blocklisted: false,
                            allowlisted: false,
                            contentPatterns,
                            urlPatterns,
                        },
                        mlInference: {
                            classification: "SUSPICIOUS",
                            confidence: 0.3,
                            reasoning: `ML inference unavailable: ${errorMsg}`,
                        },
                        domHeuristics: this.buildDomSignals(input.pageContent),
                    },
                    false,
                    errorMsg,
                    start,
                );
            }

            // Stage 5: Threat Scoring
            this._status = PipelineStatus.SCORING;
            const signals: ThreatSignals = {
                urlAnalysis: {
                    score: urlAnalysis.score,
                    riskLevel: urlAnalysis.riskLevel,
                    signals: urlAnalysis.signals,
                },
                signatureMatch: {
                    matched: contentPatterns.length > 0 || urlPatterns.length > 0,
                    blocklisted: false,
                    allowlisted: false,
                    contentPatterns,
                    urlPatterns,
                },
                mlInference: {
                    classification: mlResult.classification,
                    confidence: mlResult.confidence,
                    reasoning: mlResult.reasoning,
                },
                domHeuristics: this.buildDomSignals(input.pageContent),
            };

            this._status = PipelineStatus.IDLE;
            return this.buildResult(urlAnalysis, signals, false, undefined, start);
        } catch (error) {
            this._status = PipelineStatus.ERROR;
            throw error;
        }
    }

    /* ── Helpers ── */

    private buildResult(
        urlAnalysis: UrlAnalysisResult,
        signals: ThreatSignals,
        inferenceSkipped: boolean,
        inferenceError: string | undefined,
        startTime: number,
    ): PipelineResult {
        const assessment = this.scorer.assess(signals);
        return {
            assessment,
            urlAnalysis,
            inferenceSkipped,
            inferenceError,
            durationMs: Date.now() - startTime,
        };
    }

    private buildDomSignals(page: PageContent) {
        return {
            hasPasswordForm: page.forms.some((f) => f.hasPasswordField),
            hasCreditCardForm: page.forms.some((f) => f.hasCreditCardField),
            linkMismatchCount: page.links.filter((l) => l.mismatch).length,
            brandDomainMismatch: page.brandSignals.brandDomainMismatch,
            urgencySignals: 0,
        };
    }

    private extractHostname(url: string): string {
        try {
            return new URL(url).hostname;
        } catch {
            return url;
        }
    }
}
