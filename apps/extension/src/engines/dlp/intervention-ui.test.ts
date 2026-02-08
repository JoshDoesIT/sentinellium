/**
 * @module Intervention UI Tests
 * @description TDD tests for the browser intervention blocking UI.
 * Modal overlay when PII is detected on LLM platforms.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { InterventionUi, InterventionAction } from "./intervention-ui";
import { PiiType } from "./pii-detector";

describe("Intervention UI", () => {
  let ui: InterventionUi;

  beforeEach(() => {
    vi.restoreAllMocks();
    ui = new InterventionUi();
  });

  /* ── Initialization ── */

  describe("initialization", () => {
    it("creates an instance", () => {
      expect(ui).toBeInstanceOf(InterventionUi);
    });
  });

  /* ── HTML Generation ── */

  describe("HTML generation", () => {
    it("generates a modal overlay", () => {
      const html = ui.buildModal({
        domain: "chatgpt.com",
        platform: "ChatGPT",
        piiSummary: [
          { type: PiiType.SSN, count: 1 },
          { type: PiiType.EMAIL, count: 2 },
        ],
      });

      expect(html).toContain("ChatGPT");
      expect(html).toContain("SSN");
    });

    it("includes action buttons", () => {
      const html = ui.buildModal({
        domain: "chatgpt.com",
        platform: "ChatGPT",
        piiSummary: [{ type: PiiType.SSN, count: 1 }],
      });

      expect(html).toContain("data-action");
      expect(html).toContain("Block");
      expect(html).toContain("Anonymize");
    });

    it("includes ARIA attributes", () => {
      const html = ui.buildModal({
        domain: "chatgpt.com",
        platform: "ChatGPT",
        piiSummary: [{ type: PiiType.SSN, count: 1 }],
      });

      expect(html).toContain('role="dialog"');
      expect(html).toContain("aria-label");
    });
  });

  /* ── PII Summary ── */

  describe("PII summary", () => {
    it("generates a human-readable PII summary", () => {
      const summary = ui.formatPiiSummary([
        { type: PiiType.SSN, count: 1 },
        { type: PiiType.CREDIT_CARD, count: 2 },
      ]);

      expect(summary).toContain("1 SSN");
      expect(summary).toContain("2 Credit Card");
    });
  });

  /* ── Action Mapping ── */

  describe("action mapping", () => {
    it("maps allow action", () => {
      expect(ui.parseAction("allow")).toBe(InterventionAction.ALLOW);
    });

    it("maps block action", () => {
      expect(ui.parseAction("block")).toBe(InterventionAction.BLOCK);
    });

    it("maps anonymize action", () => {
      expect(ui.parseAction("anonymize")).toBe(InterventionAction.ANONYMIZE);
    });

    it("defaults to block for unknown actions", () => {
      expect(ui.parseAction("unknown")).toBe(InterventionAction.BLOCK);
    });
  });
});
