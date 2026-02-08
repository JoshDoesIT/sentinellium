/**
 * @module Prompt Builder Tests
 * @description TDD tests for the prompt construction engine.
 * Converts PageContent + UrlAnalysisResult into a structured
 * prompt string for the phishing classification model.
 */
import { describe, it, expect } from "vitest";
import {
  buildPrompt,
  buildSystemPrompt,
  formatPageFeatures,
  formatUrlSignals,
  truncateToTokenBudget,
} from "./prompt-builder";
import { UrlRiskLevel } from "./url-analyzer";
import type { PageContent } from "./dom-extractor";
import type { UrlAnalysisResult } from "./url-analyzer";

/* ── Test Fixtures ── */

const mockPageContent: PageContent = {
  url: "https://login-paypal-verify.tk/signin",
  title: "PayPal - Verify Your Account",
  text: "Your account has been suspended. Please verify your identity immediately by entering your credentials below. Failure to do so within 24 hours will result in permanent account closure.",
  forms: [
    {
      action: "https://evil.com/steal",
      method: "POST",
      hasPasswordField: true,
      hasCreditCardField: false,
      inputCount: 3,
    },
  ],
  links: [
    {
      href: "https://evil.com/phish",
      text: "https://paypal.com/security",
      mismatch: true,
    },
  ],
  brandSignals: {
    detectedBrands: ["paypal"],
    brandDomainMismatch: true,
  },
};

const mockUrlAnalysis: UrlAnalysisResult = {
  url: "https://login-paypal-verify.tk/signin",
  score: 45,
  riskLevel: UrlRiskLevel.HIGH,
  signals: ["suspicious_tld", "typosquat"],
};

const benignPageContent: PageContent = {
  url: "https://github.com/user/repo",
  title: "user/repo - GitHub",
  text: "A collection of useful utilities for JavaScript developers.",
  forms: [],
  links: [],
  brandSignals: {
    detectedBrands: ["github"],
    brandDomainMismatch: false,
  },
};

const benignUrlAnalysis: UrlAnalysisResult = {
  url: "https://github.com/user/repo",
  score: 0,
  riskLevel: UrlRiskLevel.LOW,
  signals: [],
};

describe("Prompt Builder", () => {
  /* ── buildSystemPrompt ── */

  describe("buildSystemPrompt", () => {
    it("returns a system prompt with classification instructions", () => {
      const prompt = buildSystemPrompt();
      expect(prompt).toContain("phishing");
      expect(prompt).toContain("SAFE");
      expect(prompt).toContain("PHISHING");
    });

    it("includes response format instructions", () => {
      const prompt = buildSystemPrompt();
      expect(prompt).toContain("classification");
      expect(prompt).toContain("confidence");
    });
  });

  /* ── formatPageFeatures ── */

  describe("formatPageFeatures", () => {
    it("includes page title and URL", () => {
      const features = formatPageFeatures(mockPageContent);
      expect(features).toContain("PayPal - Verify Your Account");
      expect(features).toContain("login-paypal-verify.tk");
    });

    it("includes form analysis when password fields present", () => {
      const features = formatPageFeatures(mockPageContent);
      expect(features).toContain("password");
      expect(features).toContain("https://evil.com/steal");
    });

    it("includes brand mismatch signals", () => {
      const features = formatPageFeatures(mockPageContent);
      expect(features).toContain("paypal");
      expect(features).toContain("mismatch");
    });

    it("includes link mismatch data", () => {
      const features = formatPageFeatures(mockPageContent);
      expect(features).toContain("mismatch");
    });

    it("handles benign pages with minimal features", () => {
      const features = formatPageFeatures(benignPageContent);
      expect(features).toContain("github.com");
      expect(features).not.toContain("password");
    });
  });

  /* ── formatUrlSignals ── */

  describe("formatUrlSignals", () => {
    it("includes risk level and triggered signals", () => {
      const signals = formatUrlSignals(mockUrlAnalysis);
      expect(signals).toContain("HIGH");
      expect(signals).toContain("suspicious_tld");
      expect(signals).toContain("typosquat");
    });

    it("includes the score", () => {
      const signals = formatUrlSignals(mockUrlAnalysis);
      expect(signals).toContain("45");
    });

    it("handles clean URLs with no signals", () => {
      const signals = formatUrlSignals(benignUrlAnalysis);
      expect(signals).toContain("LOW");
      expect(signals).toContain("0");
    });
  });

  /* ── truncateToTokenBudget ── */

  describe("truncateToTokenBudget", () => {
    it("does not truncate short text", () => {
      const result = truncateToTokenBudget("short text", 1000);
      expect(result).toBe("short text");
    });

    it("truncates text exceeding the token budget", () => {
      const longText = "word ".repeat(5000);
      const result = truncateToTokenBudget(longText, 500);
      expect(result.length).toBeLessThan(longText.length);
    });

    it("adds truncation marker when text is cut", () => {
      const longText = "word ".repeat(5000);
      const result = truncateToTokenBudget(longText, 500);
      expect(result).toContain("[TRUNCATED]");
    });
  });

  /* ── buildPrompt (integration) ── */

  describe("buildPrompt", () => {
    it("produces a complete prompt with system + user sections", () => {
      const prompt = buildPrompt(mockPageContent, mockUrlAnalysis);
      expect(prompt.system).toBeTruthy();
      expect(prompt.user).toBeTruthy();
    });

    it("includes page features in the user prompt", () => {
      const prompt = buildPrompt(mockPageContent, mockUrlAnalysis);
      expect(prompt.user).toContain("PayPal");
      expect(prompt.user).toContain("login-paypal-verify.tk");
    });

    it("includes URL analysis in the user prompt", () => {
      const prompt = buildPrompt(mockPageContent, mockUrlAnalysis);
      expect(prompt.user).toContain("HIGH");
      expect(prompt.user).toContain("suspicious_tld");
    });

    it("stays within a reasonable token budget", () => {
      const prompt = buildPrompt(mockPageContent, mockUrlAnalysis);
      // System + user combined should be under ~4000 chars (~1000 tokens)
      const totalLength = prompt.system.length + prompt.user.length;
      expect(totalLength).toBeLessThan(8000);
    });

    it("works with benign page content", () => {
      const prompt = buildPrompt(benignPageContent, benignUrlAnalysis);
      expect(prompt.system).toBeTruthy();
      expect(prompt.user).toContain("github.com");
    });
  });
});
