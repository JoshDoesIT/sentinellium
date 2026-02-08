/**
 * @module Notification Service Client Tests
 * @description TDD tests for async notification delivery to multiple channels.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  NotificationServiceClient,
  NotificationChannel,
} from "./notification-service-client";

describe("NotificationServiceClient", () => {
  let client: NotificationServiceClient;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
    client = new NotificationServiceClient();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("channels", () => {
    it("defines all notification channels", () => {
      expect(NotificationChannel.WEBHOOK).toBe("WEBHOOK");
      expect(NotificationChannel.EMAIL).toBe("EMAIL");
      expect(NotificationChannel.SLACK).toBe("SLACK");
    });
  });

  describe("send", () => {
    it("queues a notification for delivery", () => {
      client.send({
        channel: NotificationChannel.WEBHOOK,
        recipient: "https://hooks.example.com/alerts",
        subject: "Alert Triggered",
        body: '{"alert":"phishing"}',
        tenantId: "acme-corp",
      });

      expect(client.getPending()).toHaveLength(1);
    });

    it("assigns delivery ID and timestamp", () => {
      client.send({
        channel: NotificationChannel.EMAIL,
        recipient: "admin@acme.com",
        subject: "Weekly Report",
        body: "Your report is ready",
        tenantId: "acme-corp",
      });

      const pending = client.getPending();
      expect(pending[0]!.deliveryId).toBeTruthy();
      expect(pending[0]!.queuedAt).toBe(Date.now());
    });
  });

  describe("deliver", () => {
    it("moves notification from pending to delivered", () => {
      client.send({
        channel: NotificationChannel.SLACK,
        recipient: "#security-alerts",
        subject: "DLP Alert",
        body: "Sensitive data detected",
        tenantId: "acme-corp",
      });

      const delivered = client.deliver();
      expect(delivered).toHaveLength(1);
      expect(client.getPending()).toHaveLength(0);
      expect(client.getDelivered()).toHaveLength(1);
    });
  });

  describe("fan-out", () => {
    it("sends to multiple channels for same event", () => {
      client.send({
        channel: NotificationChannel.EMAIL,
        recipient: "admin@acme.com",
        subject: "Critical Alert",
        body: "details",
        tenantId: "acme-corp",
      });
      client.send({
        channel: NotificationChannel.SLACK,
        recipient: "#alerts",
        subject: "Critical Alert",
        body: "details",
        tenantId: "acme-corp",
      });
      client.send({
        channel: NotificationChannel.WEBHOOK,
        recipient: "https://hooks.example.com",
        subject: "Critical Alert",
        body: "details",
        tenantId: "acme-corp",
      });

      expect(client.getPending()).toHaveLength(3);
      const delivered = client.deliver();
      expect(delivered).toHaveLength(3);
    });
  });
});
