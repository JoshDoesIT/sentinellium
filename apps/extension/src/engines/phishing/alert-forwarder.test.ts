/**
 * @module Alert Forwarder Tests
 * @description TDD tests for enterprise alert forwarding.
 * Sends confirmed threat assessments to the enterprise console
 * with queuing, batching, sanitization, and retry logic.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AlertForwarder, AlertStatus } from "./alert-forwarder";
import { ThreatLevel } from "./threat-scorer";

/* ── Mock Dependencies ── */

function createMockStorage() {
  const store = new Map<string, string>();
  return {
    get: vi.fn(async (key: string) => {
      const raw = store.get(key);
      return raw ? JSON.parse(raw) : undefined;
    }),
    set: vi.fn(async (key: string, value: unknown) => {
      store.set(key, JSON.stringify(value));
    }),
    _store: store,
  };
}

function createMockFetch() {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ received: true }),
  });
}

/* ── Test Alert Fixtures ── */

const sampleAlert = {
  url: "https://login-paypal.tk/signin",
  domain: "login-paypal.tk",
  threatLevel: ThreatLevel.CONFIRMED_PHISHING,
  score: 92,
  confidence: 0.98,
  triggeredSignals: ["url:homoglyph", "dom:password_form", "blocklisted"],
  reasoning: "Strong brand impersonation with credential harvesting",
  timestamp: Date.now(),
  pageTitle: "PayPal - Verify Account",
};

describe("Alert Forwarder", () => {
  let forwarder: AlertForwarder;
  let mockStorage: ReturnType<typeof createMockStorage>;
  let mockFetch: ReturnType<typeof createMockFetch>;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockStorage = createMockStorage();
    mockFetch = createMockFetch();
    forwarder = new AlertForwarder({
      storage: mockStorage,
      fetchFn: mockFetch,
      consoleEndpoint: "https://console.sentinellium.io/api/alerts",
      enterpriseEnabled: true,
    });
  });

  /* ── Initialization ── */

  describe("initialization", () => {
    it("creates an instance", () => {
      expect(forwarder).toBeInstanceOf(AlertForwarder);
    });

    it("starts with IDLE status", () => {
      expect(forwarder.status).toBe(AlertStatus.IDLE);
    });
  });

  /* ── Queuing ── */

  describe("alert queuing", () => {
    it("queues an alert to local storage", async () => {
      await forwarder.queueAlert(sampleAlert);
      expect(mockStorage.set).toHaveBeenCalled();
    });

    it("returns the queue length after queuing", async () => {
      const len = await forwarder.queueAlert(sampleAlert);
      expect(len).toBe(1);
    });

    it("accumulates multiple alerts", async () => {
      await forwarder.queueAlert(sampleAlert);
      const len = await forwarder.queueAlert({
        ...sampleAlert,
        url: "https://fake-bank.xyz",
      });
      expect(len).toBe(2);
    });
  });

  /* ── Sanitization ── */

  describe("sanitization", () => {
    it("strips sensitive page content from alerts", async () => {
      const alertWithSensitive = {
        ...sampleAlert,
        pageTitle: "PayPal - SSN: 123-45-6789",
        url: "https://evil.com/login?email=user@example.com",
      };

      await forwarder.queueAlert(alertWithSensitive);
      await forwarder.flush();

      const sentPayload = JSON.parse(
        mockFetch.mock.calls[0]?.[1]?.body as string,
      );
      const alert = sentPayload.alerts[0];

      // URL params should be stripped
      expect(alert.url).not.toContain("email=");
      // Page title should be truncated
      expect(alert.pageTitle.length).toBeLessThanOrEqual(100);
    });
  });

  /* ── Flushing / Sending ── */

  describe("flushing", () => {
    it("sends queued alerts to the console endpoint", async () => {
      await forwarder.queueAlert(sampleAlert);
      await forwarder.flush();

      expect(mockFetch).toHaveBeenCalledWith(
        "https://console.sentinellium.io/api/alerts",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        }),
      );
    });

    it("clears the queue after successful send", async () => {
      await forwarder.queueAlert(sampleAlert);
      await forwarder.flush();

      const len = await forwarder.getQueueLength();
      expect(len).toBe(0);
    });

    it("does not send when enterprise is disabled", async () => {
      forwarder = new AlertForwarder({
        storage: mockStorage,
        fetchFn: mockFetch,
        consoleEndpoint: "https://console.sentinellium.io/api/alerts",
        enterpriseEnabled: false,
      });

      await forwarder.queueAlert(sampleAlert);
      await forwarder.flush();

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("does nothing when queue is empty", async () => {
      await forwarder.flush();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  /* ── Retry Logic ── */

  describe("retry logic", () => {
    it("retains alerts in queue on network failure", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await forwarder.queueAlert(sampleAlert);
      await forwarder.flush();

      const len = await forwarder.getQueueLength();
      expect(len).toBe(1);
    });

    it("retains alerts on non-200 response", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 503 });

      await forwarder.queueAlert(sampleAlert);
      await forwarder.flush();

      const len = await forwarder.getQueueLength();
      expect(len).toBe(1);
    });
  });
});
