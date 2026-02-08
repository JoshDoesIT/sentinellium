/**
 * @module WebSocket Client Tests
 * @description TDD tests for the WebSocket alert streaming client.
 * Manages connection lifecycle and message handling.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AlertStreamClient, ConnectionState } from "./alert-stream-client";

describe("Alert Stream Client", () => {
  let client: AlertStreamClient;
  let mockHandlers: {
    onAlert: ReturnType<typeof vi.fn>;
    onStateChange: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    mockHandlers = {
      onAlert: vi.fn(),
      onStateChange: vi.fn(),
    };
    client = new AlertStreamClient({
      url: "wss://console.sentinellium.io/alerts",
      handlers: mockHandlers,
    });
  });

  /* ── Initialization ── */

  describe("initialization", () => {
    it("creates an instance", () => {
      expect(client).toBeInstanceOf(AlertStreamClient);
    });

    it("starts in disconnected state", () => {
      expect(client.getState()).toBe(ConnectionState.DISCONNECTED);
    });
  });

  /* ── Message Parsing ── */

  describe("message parsing", () => {
    it("parses a valid alert message", () => {
      const msg = JSON.stringify({
        type: "alert",
        data: {
          id: "alert-1",
          source: "PHISHING",
          severity: "HIGH",
          title: "Test",
          domain: "evil.com",
          url: "https://evil.com",
        },
      });

      const parsed = client.parseMessage(msg);
      expect(parsed?.type).toBe("alert");
      expect(parsed?.data.id).toBe("alert-1");
    });

    it("returns null for invalid JSON", () => {
      const parsed = client.parseMessage("not json");
      expect(parsed).toBeNull();
    });

    it("returns null for unknown message types", () => {
      const msg = JSON.stringify({ type: "unknown", data: {} });
      const parsed = client.parseMessage(msg);
      expect(parsed).toBeNull();
    });
  });

  /* ── Handler Dispatch ── */

  describe("handler dispatch", () => {
    it("dispatches alert to handler", () => {
      const alertData = {
        id: "alert-1",
        source: "PHISHING",
        severity: "HIGH",
        title: "Test",
        domain: "evil.com",
        url: "https://evil.com",
      };
      client.dispatchMessage({ type: "alert", data: alertData });

      expect(mockHandlers.onAlert).toHaveBeenCalledWith(alertData);
    });
  });

  /* ── Reconnection Config ── */

  describe("reconnection config", () => {
    it("calculates exponential backoff", () => {
      expect(client.getBackoffMs(0)).toBe(1000);
      expect(client.getBackoffMs(1)).toBe(2000);
      expect(client.getBackoffMs(2)).toBe(4000);
    });

    it("caps backoff at 30 seconds", () => {
      expect(client.getBackoffMs(10)).toBeLessThanOrEqual(30_000);
    });
  });
});
