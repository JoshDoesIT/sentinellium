/**
 * @module Unverified Flagger Tests
 * @description TDD tests for the unverified media source flagger.
 * Flags media without C2PA provenance in sensitive contexts.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { UnverifiedFlagger } from "./unverified-flagger";

describe("Unverified Flagger", () => {
  let flagger: UnverifiedFlagger;

  beforeEach(() => {
    vi.restoreAllMocks();
    flagger = new UnverifiedFlagger();
  });

  /* ── Initialization ── */

  describe("initialization", () => {
    it("creates an instance", () => {
      expect(flagger).toBeInstanceOf(UnverifiedFlagger);
    });
  });

  /* ── Flagging Logic ── */

  describe("should flag", () => {
    it("flags unverified media in news contexts", () => {
      const result = flagger.shouldFlag({
        domain: "news.example.com",
        contextKeywords: ["breaking", "report"],
        isHighStakes: true,
      });

      expect(result.shouldFlag).toBe(true);
    });

    it("does not flag in normal browsing contexts", () => {
      const result = flagger.shouldFlag({
        domain: "reddit.com",
        contextKeywords: ["meme", "funny"],
        isHighStakes: false,
      });

      expect(result.shouldFlag).toBe(false);
    });

    it("flags when isHighStakes is true regardless of domain", () => {
      const result = flagger.shouldFlag({
        domain: "random.com",
        contextKeywords: [],
        isHighStakes: true,
      });

      expect(result.shouldFlag).toBe(true);
    });
  });

  /* ── HTML Generation ── */

  describe("HTML generation", () => {
    it("generates an unverified indicator", () => {
      const html = flagger.buildIndicatorHtml("photo.jpg");

      expect(html).toContain("Unverified");
      expect(html).toContain("aria-label");
    });

    it("includes dismiss action", () => {
      const html = flagger.buildIndicatorHtml("photo.jpg");
      expect(html).toContain("dismiss");
    });
  });

  /* ── Dismissal ── */

  describe("dismissal", () => {
    it("tracks dismissed URLs", () => {
      flagger.dismiss("https://example.com/photo.jpg");
      expect(flagger.isDismissed("https://example.com/photo.jpg")).toBe(true);
    });

    it("tracks dismissed domains", () => {
      flagger.dismissDomain("example.com");
      expect(flagger.isDomainDismissed("example.com")).toBe(true);
    });

    it("returns false for non-dismissed items", () => {
      expect(flagger.isDismissed("https://other.com/img.jpg")).toBe(false);
    });
  });
});
