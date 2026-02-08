/**
 * @module High-Stakes Detector Tests
 * @description TDD tests for high-stakes context detection.
 * Determines if media appears in sensitive contexts where
 * provenance verification is critical.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { HighStakesDetector, ContextLevel } from "./high-stakes-detector";

describe("High-Stakes Detector", () => {
  let detector: HighStakesDetector;

  beforeEach(() => {
    detector = new HighStakesDetector();
  });

  /* ── Initialization ── */

  describe("initialization", () => {
    it("creates an instance", () => {
      expect(detector).toBeInstanceOf(HighStakesDetector);
    });
  });

  /* ── Context Classification ── */

  describe("context classification", () => {
    it("detects HIGH_STAKES for financial pages", () => {
      const result = detector.classify({
        domain: "bank.example.com",
        pageTitle: "Wire Transfer Confirmation",
        pageText: "Please confirm this wire transfer of $50,000",
        url: "https://bank.example.com/transfers",
      });

      expect(result.level).toBe(ContextLevel.HIGH_STAKES);
    });

    it("detects HIGH_STAKES for executive communication keywords", () => {
      const result = detector.classify({
        domain: "mail.google.com",
        pageTitle: "Important: CEO Video Message",
        pageText: "From the desk of the CEO regarding quarterly earnings",
        url: "https://mail.google.com/mail",
      });

      expect(result.level).toBe(ContextLevel.HIGH_STAKES);
    });

    it("detects ELEVATED for news domains", () => {
      const result = detector.classify({
        domain: "cnn.com",
        pageTitle: "Breaking News",
        pageText: "Reports indicate a major development today",
        url: "https://cnn.com/article",
      });

      expect(result.level).toBe(ContextLevel.ELEVATED);
    });

    it("detects ELEVATED for known news sites", () => {
      const result = detector.classify({
        domain: "bbc.co.uk",
        pageTitle: "World News",
        pageText: "Latest updates from around the world",
        url: "https://bbc.co.uk/news",
      });

      expect(result.level).toBe(ContextLevel.ELEVATED);
    });

    it("detects HIGH_STAKES for HR/legal keywords", () => {
      const result = detector.classify({
        domain: "internal.corp.com",
        pageTitle: "Employment Agreement",
        pageText: "This contract outlines the terms of employment",
        url: "https://internal.corp.com/hr",
      });

      expect(result.level).toBe(ContextLevel.HIGH_STAKES);
    });

    it("returns NORMAL for general browsing", () => {
      const result = detector.classify({
        domain: "reddit.com",
        pageTitle: "r/funny - Best memes",
        pageText: "Check out these hilarious cat photos",
        url: "https://reddit.com/r/funny",
      });

      expect(result.level).toBe(ContextLevel.NORMAL);
    });

    it("returns NORMAL for social media", () => {
      const result = detector.classify({
        domain: "twitter.com",
        pageTitle: "Home / Twitter",
        pageText: "What is happening today",
        url: "https://twitter.com/home",
      });

      expect(result.level).toBe(ContextLevel.NORMAL);
    });
  });

  /* ── Signal Extraction ── */

  describe("signal extraction", () => {
    it("returns matching signals for financial context", () => {
      const result = detector.classify({
        domain: "bank.com",
        pageTitle: "Invoice Details",
        pageText: "Invoice #12345 for wire transfer",
        url: "https://bank.com/invoice",
      });

      expect(result.signals.length).toBeGreaterThan(0);
      expect(result.signals.some((s) => s.includes("financial"))).toBe(true);
    });

    it("returns empty signals for normal context", () => {
      const result = detector.classify({
        domain: "example.com",
        pageTitle: "Welcome",
        pageText: "Just a normal page",
        url: "https://example.com",
      });

      expect(result.signals).toHaveLength(0);
    });
  });
});
