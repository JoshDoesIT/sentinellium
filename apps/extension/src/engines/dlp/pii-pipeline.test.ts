/**
 * @module PII Pipeline Tests
 * @description TDD tests for the full DLP pipeline.
 * Orchestrates: input → PII detection → sensitivity check → action.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PiiPipeline, PipelineAction } from "./pii-pipeline";
import { PiiType } from "./pii-detector";
import { DomainRisk } from "./llm-domain-monitor";

describe("PII Pipeline", () => {
  let pipeline: PiiPipeline;
  let mockDetector: { scan: ReturnType<typeof vi.fn> };
  let mockMonitor: { classify: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.restoreAllMocks();
    mockDetector = {
      scan: vi.fn().mockReturnValue([]),
    };
    mockMonitor = {
      classify: vi.fn().mockReturnValue({
        isLlm: true,
        platform: "ChatGPT",
        risk: DomainRisk.HIGH,
        domain: "chatgpt.com",
      }),
    };
    pipeline = new PiiPipeline(mockDetector, mockMonitor);
  });

  /* ── Initialization ── */

  describe("initialization", () => {
    it("creates an instance", () => {
      expect(pipeline).toBeInstanceOf(PiiPipeline);
    });
  });

  /* ── No PII Detected ── */

  describe("no PII detected", () => {
    it("returns ALLOW when text has no PII", () => {
      const result = pipeline.evaluate("Hello world", "chatgpt.com");
      expect(result.action).toBe(PipelineAction.ALLOW);
      expect(result.matches).toHaveLength(0);
    });
  });

  /* ── PII on LLM Domain ── */

  describe("PII on LLM domain", () => {
    it("returns BLOCK for SSN on high-risk LLM", () => {
      mockDetector.scan.mockReturnValue([
        {
          type: PiiType.SSN,
          value: "123-45-6789",
          start: 0,
          end: 11,
          confidence: 0.95,
        },
      ]);

      const result = pipeline.evaluate("123-45-6789", "chatgpt.com");
      expect(result.action).toBe(PipelineAction.BLOCK);
    });

    it("returns WARN for email on medium-risk domain", () => {
      mockDetector.scan.mockReturnValue([
        {
          type: PiiType.EMAIL,
          value: "john@example.com",
          start: 0,
          end: 16,
          confidence: 0.95,
        },
      ]);
      mockMonitor.classify.mockReturnValue({
        isLlm: true,
        platform: "GitHub",
        risk: DomainRisk.MEDIUM,
        domain: "github.com",
      });

      const result = pipeline.evaluate("john@example.com", "github.com");
      expect(result.action).toBe(PipelineAction.WARN);
    });
  });

  /* ── Non-LLM Domain ── */

  describe("non-LLM domain", () => {
    it("returns ALLOW for PII on non-LLM sites", () => {
      mockDetector.scan.mockReturnValue([
        {
          type: PiiType.EMAIL,
          value: "john@example.com",
          start: 0,
          end: 16,
          confidence: 0.95,
        },
      ]);
      mockMonitor.classify.mockReturnValue({
        isLlm: false,
        platform: null,
        risk: DomainRisk.NONE,
        domain: "example.com",
      });

      const result = pipeline.evaluate("john@example.com", "example.com");
      expect(result.action).toBe(PipelineAction.ALLOW);
    });
  });

  /* ── Severity Escalation ── */

  describe("severity escalation", () => {
    it("escalates to BLOCK for credit cards on any LLM", () => {
      mockDetector.scan.mockReturnValue([
        {
          type: PiiType.CREDIT_CARD,
          value: "4111111111111111",
          start: 0,
          end: 16,
          confidence: 0.9,
        },
      ]);

      const result = pipeline.evaluate("4111111111111111", "chatgpt.com");
      expect(result.action).toBe(PipelineAction.BLOCK);
    });

    it("escalates to BLOCK for API keys on any LLM", () => {
      mockDetector.scan.mockReturnValue([
        {
          type: PiiType.API_KEY,
          value: "AKIAIOSFODNN7EXAMPLE",
          start: 0,
          end: 20,
          confidence: 0.95,
        },
      ]);

      const result = pipeline.evaluate("AKIAIOSFODNN7EXAMPLE", "chatgpt.com");
      expect(result.action).toBe(PipelineAction.BLOCK);
    });
  });

  /* ── Pipeline Details ── */

  describe("pipeline details", () => {
    it("includes detected PII in results", () => {
      mockDetector.scan.mockReturnValue([
        {
          type: PiiType.SSN,
          value: "123-45-6789",
          start: 0,
          end: 11,
          confidence: 0.95,
        },
      ]);

      const result = pipeline.evaluate("123-45-6789", "chatgpt.com");
      expect(result.matches).toHaveLength(1);
      expect(result.platform).toBe("ChatGPT");
    });
  });
});
