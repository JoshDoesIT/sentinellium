/**
 * @module LLM Domain Monitor Tests
 * @description TDD tests for AI/LLM domain detection.
 * Identifies when the user is on a public LLM platform.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { LlmDomainMonitor, DomainRisk } from "./llm-domain-monitor";

describe("LLM Domain Monitor", () => {
  let monitor: LlmDomainMonitor;

  beforeEach(() => {
    monitor = new LlmDomainMonitor();
  });

  /* ── Initialization ── */

  describe("initialization", () => {
    it("creates an instance", () => {
      expect(monitor).toBeInstanceOf(LlmDomainMonitor);
    });
  });

  /* ── Known LLM Domains ── */

  describe("known LLM domains", () => {
    it("detects ChatGPT", () => {
      const result = monitor.classify("chatgpt.com");
      expect(result.isLlm).toBe(true);
      expect(result.platform).toBe("ChatGPT");
    });

    it("detects Claude", () => {
      const result = monitor.classify("claude.ai");
      expect(result.isLlm).toBe(true);
      expect(result.platform).toBe("Claude");
    });

    it("detects Google Gemini", () => {
      const result = monitor.classify("gemini.google.com");
      expect(result.isLlm).toBe(true);
      expect(result.platform).toBe("Gemini");
    });

    it("detects Microsoft Copilot", () => {
      const result = monitor.classify("copilot.microsoft.com");
      expect(result.isLlm).toBe(true);
      expect(result.platform).toBe("Copilot");
    });

    it("detects Hugging Face", () => {
      const result = monitor.classify("huggingface.co");
      expect(result.isLlm).toBe(true);
      expect(result.platform).toBe("Hugging Face");
    });
  });

  /* ── Risk Classification ── */

  describe("risk classification", () => {
    it("classifies public LLMs as HIGH risk", () => {
      const result = monitor.classify("chatgpt.com");
      expect(result.risk).toBe(DomainRisk.HIGH);
    });

    it("classifies code assistants as MEDIUM risk", () => {
      const result = monitor.classify("github.com");
      expect(result.risk).toBe(DomainRisk.MEDIUM);
    });

    it("classifies normal sites as NONE", () => {
      const result = monitor.classify("example.com");
      expect(result.risk).toBe(DomainRisk.NONE);
    });
  });

  /* ── Subdomain Matching ── */

  describe("subdomain matching", () => {
    it("matches subdomains of LLM platforms", () => {
      const result = monitor.classify("chat.openai.com");
      expect(result.isLlm).toBe(true);
    });
  });

  /* ── Custom Domains ── */

  describe("custom domains", () => {
    it("supports adding custom monitored domains", () => {
      const custom = new LlmDomainMonitor({
        additionalDomains: [
          {
            domain: "internal-ai.corp.com",
            platform: "Internal AI",
            risk: DomainRisk.MEDIUM,
          },
        ],
      });
      const result = custom.classify("internal-ai.corp.com");
      expect(result.isLlm).toBe(true);
      expect(result.platform).toBe("Internal AI");
    });
  });
});
