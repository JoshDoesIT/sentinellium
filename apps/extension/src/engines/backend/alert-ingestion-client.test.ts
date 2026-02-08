/**
 * @module Alert Ingestion Client Tests
 * @description TDD tests for batch and real-time alert submission.
 * Queues alerts locally, batches for efficiency, supports retry on failure.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { AlertIngestionClient, AlertPriority } from "./alert-ingestion-client";

describe("AlertIngestionClient", () => {
  let client: AlertIngestionClient;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
    client = new AlertIngestionClient({ batchSize: 3, flushIntervalMs: 5000 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /* ── Submit ── */

  describe("submit", () => {
    it("queues an alert for batching", () => {
      client.submit({
        type: "phishing",
        severity: AlertPriority.HIGH,
        message: "Phishing attempt detected",
        tenantId: "acme-corp",
      });

      expect(client.queueSize).toBe(1);
    });

    it("auto-flushes when batch size reached", () => {
      client.submit({
        type: "phishing",
        severity: AlertPriority.LOW,
        message: "a",
        tenantId: "acme-corp",
      });
      client.submit({
        type: "dlp",
        severity: AlertPriority.MEDIUM,
        message: "b",
        tenantId: "acme-corp",
      });
      const result = client.submit({
        type: "c2pa",
        severity: AlertPriority.HIGH,
        message: "c",
        tenantId: "acme-corp",
      });

      expect(client.queueSize).toBe(0);
      expect(result.flushed).toBe(true);
      expect(result.batchId).toBeTruthy();
    });

    it("assigns timestamp to each alert", () => {
      client.submit({
        type: "phishing",
        severity: AlertPriority.HIGH,
        message: "test",
        tenantId: "acme-corp",
      });

      const pending = client.getPending();
      expect(pending[0]!.timestamp).toBe(Date.now());
    });
  });

  /* ── Flush ── */

  describe("flush", () => {
    it("flushes all pending alerts manually", () => {
      client.submit({
        type: "phishing",
        severity: AlertPriority.HIGH,
        message: "a",
        tenantId: "acme-corp",
      });
      client.submit({
        type: "dlp",
        severity: AlertPriority.LOW,
        message: "b",
        tenantId: "acme-corp",
      });

      const batch = client.flush();
      expect(batch.alerts).toHaveLength(2);
      expect(batch.batchId).toBeTruthy();
      expect(client.queueSize).toBe(0);
    });

    it("returns empty batch when queue is empty", () => {
      const batch = client.flush();
      expect(batch.alerts).toHaveLength(0);
    });
  });

  /* ── Batch History ── */

  describe("getBatchHistory", () => {
    it("tracks flushed batches", () => {
      client.submit({
        type: "phishing",
        severity: AlertPriority.HIGH,
        message: "a",
        tenantId: "acme-corp",
      });
      client.flush();

      client.submit({
        type: "dlp",
        severity: AlertPriority.LOW,
        message: "b",
        tenantId: "acme-corp",
      });
      client.flush();

      expect(client.getBatchHistory()).toHaveLength(2);
    });
  });

  /* ── Priority Filtering ── */

  describe("priority", () => {
    it("defines all severity levels", () => {
      expect(AlertPriority.CRITICAL).toBe("CRITICAL");
      expect(AlertPriority.HIGH).toBe("HIGH");
      expect(AlertPriority.MEDIUM).toBe("MEDIUM");
      expect(AlertPriority.LOW).toBe("LOW");
    });
  });
});
