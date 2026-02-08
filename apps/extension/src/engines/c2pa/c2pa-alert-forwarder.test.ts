/**
 * @module C2PA Alert Forwarder Tests
 * @description TDD tests for the C2PA enterprise alert forwarder.
 * Queues unverified/tampered media alerts for enterprise console.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { C2paAlertForwarder } from "./c2pa-alert-forwarder";
import { ValidationStatus } from "./manifest-validator";
import { ContextLevel } from "./high-stakes-detector";

describe("C2PA Alert Forwarder", () => {
  let forwarder: C2paAlertForwarder;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockFetch = vi.fn().mockResolvedValue({ ok: true });
    forwarder = new C2paAlertForwarder({
      consoleUrl: "https://console.sentinellium.io/api/c2pa-alerts",
      enabled: true,
      fetchFn: mockFetch,
    });
  });

  /* ── Initialization ── */

  describe("initialization", () => {
    it("creates an instance", () => {
      expect(forwarder).toBeInstanceOf(C2paAlertForwarder);
    });
  });

  /* ── Queuing ── */

  describe("queuing", () => {
    it("queues an alert for unverified media", () => {
      forwarder.queue({
        url: "https://example.com/photo.jpg?tracking=123",
        status: ValidationStatus.UNVERIFIED,
        contextLevel: ContextLevel.HIGH_STAKES,
        domain: "example.com",
        pageTitle: "Wire Transfer Confirmation",
      });

      expect(forwarder.pendingCount).toBe(1);
    });

    it("sanitizes URLs by stripping query params", () => {
      forwarder.queue({
        url: "https://example.com/photo.jpg?tracking=123&utm_source=test",
        status: ValidationStatus.UNVERIFIED,
        contextLevel: ContextLevel.NORMAL,
        domain: "example.com",
        pageTitle: "Test Page",
      });

      const pending = forwarder.getPending();
      expect(pending[0]?.url).toBe("https://example.com/photo.jpg");
    });

    it("truncates long page titles", () => {
      forwarder.queue({
        url: "https://example.com/photo.jpg",
        status: ValidationStatus.TAMPERED,
        contextLevel: ContextLevel.ELEVATED,
        domain: "example.com",
        pageTitle: "A".repeat(300),
      });

      const pending = forwarder.getPending();
      expect(pending[0]?.pageTitle.length).toBeLessThanOrEqual(200);
    });
  });

  /* ── Flushing ── */

  describe("flushing", () => {
    it("sends queued alerts via POST", async () => {
      forwarder.queue({
        url: "https://example.com/photo.jpg",
        status: ValidationStatus.UNVERIFIED,
        contextLevel: ContextLevel.HIGH_STAKES,
        domain: "example.com",
        pageTitle: "Test",
      });

      await forwarder.flush();

      expect(mockFetch).toHaveBeenCalledOnce();
      expect(forwarder.pendingCount).toBe(0);
    });

    it("retains queue on failure", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      forwarder.queue({
        url: "https://example.com/photo.jpg",
        status: ValidationStatus.TAMPERED,
        contextLevel: ContextLevel.ELEVATED,
        domain: "example.com",
        pageTitle: "Test",
      });

      await forwarder.flush();
      expect(forwarder.pendingCount).toBe(1);
    });
  });

  /* ── Enterprise Opt-in ── */

  describe("enterprise opt-in", () => {
    it("does not queue when disabled", () => {
      const disabled = new C2paAlertForwarder({
        consoleUrl: "https://console.sentinellium.io/api/c2pa-alerts",
        enabled: false,
        fetchFn: mockFetch,
      });

      disabled.queue({
        url: "https://example.com/photo.jpg",
        status: ValidationStatus.UNVERIFIED,
        contextLevel: ContextLevel.NORMAL,
        domain: "example.com",
        pageTitle: "Test",
      });

      expect(disabled.pendingCount).toBe(0);
    });

    it("does not flush when disabled", async () => {
      const disabled = new C2paAlertForwarder({
        consoleUrl: "https://console.sentinellium.io/api/c2pa-alerts",
        enabled: false,
        fetchFn: mockFetch,
      });

      await disabled.flush();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});
