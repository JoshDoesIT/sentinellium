/**
 * @module DLP Reporter Tests
 * @description TDD tests for DLP incident reporting.
 * Queues and forwards DLP events to the enterprise console.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DlpReporter } from "./dlp-reporter";
import { PiiType } from "./pii-detector";

describe("DLP Reporter", () => {
  let reporter: DlpReporter;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockFetch = vi.fn().mockResolvedValue({ ok: true });
    reporter = new DlpReporter({
      consoleUrl: "https://console.sentinellium.io/api/dlp-incidents",
      enabled: true,
      fetchFn: mockFetch,
    });
  });

  /* ── Initialization ── */

  describe("initialization", () => {
    it("creates an instance", () => {
      expect(reporter).toBeInstanceOf(DlpReporter);
    });
  });

  /* ── Incident Recording ── */

  describe("incident recording", () => {
    it("records a DLP incident", () => {
      reporter.record({
        domain: "chatgpt.com",
        platform: "ChatGPT",
        action: "BLOCK",
        piiTypes: [PiiType.SSN],
        piiCount: 1,
      });

      expect(reporter.pendingCount).toBe(1);
    });

    it("records multiple incidents", () => {
      reporter.record({
        domain: "chatgpt.com",
        platform: "ChatGPT",
        action: "BLOCK",
        piiTypes: [PiiType.SSN],
        piiCount: 1,
      });
      reporter.record({
        domain: "claude.ai",
        platform: "Claude",
        action: "ANONYMIZE",
        piiTypes: [PiiType.EMAIL, PiiType.PHONE],
        piiCount: 3,
      });

      expect(reporter.pendingCount).toBe(2);
    });
  });

  /* ── Flushing ── */

  describe("flushing", () => {
    it("sends incidents via POST", async () => {
      reporter.record({
        domain: "chatgpt.com",
        platform: "ChatGPT",
        action: "BLOCK",
        piiTypes: [PiiType.SSN],
        piiCount: 1,
      });

      await reporter.flush();

      expect(mockFetch).toHaveBeenCalledOnce();
      expect(reporter.pendingCount).toBe(0);
    });

    it("retains incidents on failure", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      reporter.record({
        domain: "chatgpt.com",
        platform: "ChatGPT",
        action: "BLOCK",
        piiTypes: [PiiType.SSN],
        piiCount: 1,
      });

      await reporter.flush();
      expect(reporter.pendingCount).toBe(1);
    });
  });

  /* ── Enterprise Guard ── */

  describe("enterprise guard", () => {
    it("does not record when disabled", () => {
      const disabled = new DlpReporter({
        consoleUrl: "https://console.sentinellium.io/api/dlp-incidents",
        enabled: false,
        fetchFn: mockFetch,
      });

      disabled.record({
        domain: "chatgpt.com",
        platform: "ChatGPT",
        action: "BLOCK",
        piiTypes: [PiiType.SSN],
        piiCount: 1,
      });

      expect(disabled.pendingCount).toBe(0);
    });
  });
});
