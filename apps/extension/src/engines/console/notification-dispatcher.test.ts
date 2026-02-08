/**
 * @module Notification Dispatcher Tests
 * @description TDD tests for the notification dispatch system.
 * Routes alerts to email, Slack, and webhook channels.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  NotificationDispatcher,
  NotificationChannel,
} from "./notification-dispatcher";
import { AlertSeverity } from "./alert-aggregator";

describe("Notification Dispatcher", () => {
  let dispatcher: NotificationDispatcher;
  let mockSend: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockSend = vi.fn().mockResolvedValue({ ok: true });
    dispatcher = new NotificationDispatcher({
      channels: [
        {
          type: NotificationChannel.WEBHOOK,
          url: "https://hooks.example.com/alert",
          minSeverity: AlertSeverity.HIGH,
        },
        {
          type: NotificationChannel.SLACK,
          url: "https://hooks.slack.com/xxx",
          minSeverity: AlertSeverity.CRITICAL,
        },
      ],
      fetchFn: mockSend,
    });
  });

  /* ── Initialization ── */

  describe("initialization", () => {
    it("creates an instance", () => {
      expect(dispatcher).toBeInstanceOf(NotificationDispatcher);
    });
  });

  /* ── Channel Filtering ── */

  describe("channel filtering", () => {
    it("filters channels by minimum severity", () => {
      const channels = dispatcher.getEligibleChannels(AlertSeverity.HIGH);
      expect(channels).toHaveLength(1);
      expect(channels[0]?.type).toBe(NotificationChannel.WEBHOOK);
    });

    it("includes higher-severity channels", () => {
      const channels = dispatcher.getEligibleChannels(AlertSeverity.CRITICAL);
      expect(channels).toHaveLength(2);
    });

    it("excludes channels below severity threshold", () => {
      const channels = dispatcher.getEligibleChannels(AlertSeverity.LOW);
      expect(channels).toHaveLength(0);
    });
  });

  /* ── Dispatching ── */

  describe("dispatching", () => {
    it("sends to eligible channels", async () => {
      await dispatcher.dispatch({
        severity: AlertSeverity.CRITICAL,
        title: "Critical phishing attack",
        domain: "evil.com",
      });

      expect(mockSend).toHaveBeenCalledTimes(2);
    });

    it("skips ineligible channels", async () => {
      await dispatcher.dispatch({
        severity: AlertSeverity.MEDIUM,
        title: "Medium alert",
        domain: "test.com",
      });

      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  /* ── Payload Building ── */

  describe("payload building", () => {
    it("builds a webhook payload", () => {
      const payload = dispatcher.buildPayload(NotificationChannel.WEBHOOK, {
        severity: AlertSeverity.HIGH,
        title: "Test alert",
        domain: "test.com",
      });

      expect(payload).toContain("Test alert");
    });

    it("builds a Slack payload", () => {
      const payload = dispatcher.buildPayload(NotificationChannel.SLACK, {
        severity: AlertSeverity.CRITICAL,
        title: "Critical alert",
        domain: "evil.com",
      });

      expect(payload).toContain("Critical alert");
    });
  });
});
