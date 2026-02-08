/**
 * @module Verified Overlay Tests
 * @description TDD tests for the C2PA verified media overlay.
 * Injects visual badges (green checkmark / CR pin) on media
 * with valid C2PA manifests.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { VerifiedOverlay, BadgeType } from "./verified-overlay";

describe("Verified Overlay", () => {
  let overlay: VerifiedOverlay;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  /* ── Initialization ── */

  describe("initialization", () => {
    it("creates an instance", () => {
      overlay = new VerifiedOverlay();
      expect(overlay).toBeInstanceOf(VerifiedOverlay);
    });
  });

  /* ── Badge Type Selection ── */

  describe("badge type selection", () => {
    it("returns CHECKMARK for generic verified media", () => {
      const badge = VerifiedOverlay.getBadgeType({
        signer: "Adobe Inc.",
        assertions: ["c2pa.actions"],
      });
      expect(badge).toBe(BadgeType.CHECKMARK);
    });

    it("returns CR_PIN for Content Credentials signed media", () => {
      const badge = VerifiedOverlay.getBadgeType({
        signer: "Adobe Inc.",
        assertions: ["c2pa.actions", "c2pa.hash.data"],
        isContentCredentials: true,
      });
      expect(badge).toBe(BadgeType.CR_PIN);
    });
  });

  /* ── HTML Generation ── */

  describe("HTML generation", () => {
    it("generates a badge with signer info", () => {
      overlay = new VerifiedOverlay();
      const html = overlay.buildBadgeHtml({
        badgeType: BadgeType.CHECKMARK,
        signer: "Adobe Inc.",
        signedAt: "2026-01-15T10:30:00Z",
        claimGenerator: "Photoshop",
      });

      expect(html).toContain("Adobe Inc.");
      expect(html).toContain("verified");
    });

    it("includes ARIA attributes for accessibility", () => {
      overlay = new VerifiedOverlay();
      const html = overlay.buildBadgeHtml({
        badgeType: BadgeType.CHECKMARK,
        signer: "Adobe Inc.",
        signedAt: "2026-01-15T10:30:00Z",
        claimGenerator: "Photoshop",
      });

      expect(html).toContain("aria-label");
      expect(html).toContain("role");
    });

    it("generates CR pin for Content Credentials", () => {
      overlay = new VerifiedOverlay();
      const html = overlay.buildBadgeHtml({
        badgeType: BadgeType.CR_PIN,
        signer: "Adobe Inc.",
        signedAt: "2026-01-15T10:30:00Z",
        claimGenerator: "Lightroom",
      });

      expect(html).toContain("cr-pin");
    });

    it("includes the claim generator tool", () => {
      overlay = new VerifiedOverlay();
      const html = overlay.buildBadgeHtml({
        badgeType: BadgeType.CHECKMARK,
        signer: "Adobe Inc.",
        signedAt: "2026-01-15T10:30:00Z",
        claimGenerator: "Photoshop",
      });

      expect(html).toContain("Photoshop");
    });
  });

  /* ── Positioning ── */

  describe("positioning", () => {
    it("returns top-right position by default", () => {
      overlay = new VerifiedOverlay();
      const pos = overlay.getPosition();
      expect(pos.corner).toBe("top-right");
    });

    it("supports custom positioning", () => {
      overlay = new VerifiedOverlay({ position: "bottom-left" });
      const pos = overlay.getPosition();
      expect(pos.corner).toBe("bottom-left");
    });
  });
});
