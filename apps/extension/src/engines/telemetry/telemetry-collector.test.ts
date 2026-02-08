/**
 * @module Telemetry Event Collector Tests
 * @description TDD tests for privacy-gated telemetry event collection.
 * Events are only recorded when the user has opted in via analytics settings.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  TelemetryCollector,
  type TelemetryEvent,
  TelemetryCategory,
} from "./telemetry-collector";

/** Stub analytics gate. */
function createStubAnalytics(optedIn: boolean) {
  return {
    isOptedIn: vi.fn().mockResolvedValue(optedIn),
  };
}

describe("TelemetryCollector", () => {
  let collector: TelemetryCollector;

  describe("when opted in", () => {
    beforeEach(() => {
      collector = new TelemetryCollector({
        analytics: createStubAnalytics(true),
        maxQueueSize: 100,
      });
    });

    it("records a scan event", async () => {
      const event: TelemetryEvent = {
        category: TelemetryCategory.SCAN,
        action: "page_scanned",
        engine: "phishing",
      };

      await collector.record(event);

      expect(collector.pendingCount).toBe(1);
    });

    it("records a detection event with metadata", async () => {
      const event: TelemetryEvent = {
        category: TelemetryCategory.DETECTION,
        action: "threat_detected",
        engine: "phishing",
        metadata: { score: 85, riskLevel: "HIGH" },
      };

      await collector.record(event);

      const pending = collector.drain();
      expect(pending).toHaveLength(1);
      expect(pending[0].category).toBe(TelemetryCategory.DETECTION);
      expect(pending[0].metadata).toEqual({ score: 85, riskLevel: "HIGH" });
    });

    it("adds timestamps to recorded events", async () => {
      const before = Date.now();

      await collector.record({
        category: TelemetryCategory.SCAN,
        action: "page_scanned",
        engine: "c2pa",
      });

      const pending = collector.drain();
      expect(pending[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(pending[0].timestamp).toBeLessThanOrEqual(Date.now());
    });

    it("drains all pending events and clears the queue", async () => {
      await collector.record({
        category: TelemetryCategory.SCAN,
        action: "page_scanned",
        engine: "phishing",
      });
      await collector.record({
        category: TelemetryCategory.BLOCK,
        action: "threat_blocked",
        engine: "phishing",
      });

      const drained = collector.drain();
      expect(drained).toHaveLength(2);
      expect(collector.pendingCount).toBe(0);
    });

    it("enforces max queue size by dropping oldest events", async () => {
      const small = new TelemetryCollector({
        analytics: createStubAnalytics(true),
        maxQueueSize: 2,
      });

      await small.record({
        category: TelemetryCategory.SCAN,
        action: "first",
        engine: "phishing",
      });
      await small.record({
        category: TelemetryCategory.SCAN,
        action: "second",
        engine: "phishing",
      });
      await small.record({
        category: TelemetryCategory.SCAN,
        action: "third",
        engine: "phishing",
      });

      const pending = small.drain();
      expect(pending).toHaveLength(2);
      expect(pending[0].action).toBe("second");
      expect(pending[1].action).toBe("third");
    });

    it("records engine latency events", async () => {
      await collector.record({
        category: TelemetryCategory.PERFORMANCE,
        action: "inference_latency",
        engine: "phishing",
        metadata: { durationMs: 142 },
      });

      const pending = collector.drain();
      expect(pending[0].category).toBe(TelemetryCategory.PERFORMANCE);
      expect(pending[0].metadata?.durationMs).toBe(142);
    });
  });

  describe("when opted out", () => {
    beforeEach(() => {
      collector = new TelemetryCollector({
        analytics: createStubAnalytics(false),
        maxQueueSize: 100,
      });
    });

    it("silently drops events when analytics is opted out", async () => {
      await collector.record({
        category: TelemetryCategory.SCAN,
        action: "page_scanned",
        engine: "phishing",
      });

      expect(collector.pendingCount).toBe(0);
    });

    it("checks opt-in status on every record call", async () => {
      const analytics = createStubAnalytics(false);
      const c = new TelemetryCollector({
        analytics,
        maxQueueSize: 100,
      });

      await c.record({
        category: TelemetryCategory.SCAN,
        action: "page_scanned",
        engine: "phishing",
      });

      expect(analytics.isOptedIn).toHaveBeenCalledOnce();
    });
  });

  describe("categories", () => {
    it("supports all expected telemetry categories", () => {
      expect(TelemetryCategory.SCAN).toBe("SCAN");
      expect(TelemetryCategory.DETECTION).toBe("DETECTION");
      expect(TelemetryCategory.BLOCK).toBe("BLOCK");
      expect(TelemetryCategory.PERFORMANCE).toBe("PERFORMANCE");
      expect(TelemetryCategory.ERROR).toBe("ERROR");
    });
  });
});
