/**
 * @module Telemetry Service Client Tests
 * @description TDD tests for metrics aggregation and SIEM export client.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { TelemetryServiceClient, MetricType } from "./telemetry-service-client";

describe("TelemetryServiceClient", () => {
  let client: TelemetryServiceClient;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
    client = new TelemetryServiceClient({ batchSize: 5 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("record", () => {
    it("records a counter metric", () => {
      client.record({
        name: "alerts.detected",
        type: MetricType.COUNTER,
        value: 1,
        tenantId: "acme-corp",
      });
      expect(client.queueSize).toBe(1);
    });

    it("records a gauge metric", () => {
      client.record({
        name: "cpu.usage",
        type: MetricType.GAUGE,
        value: 72.5,
        tenantId: "acme-corp",
      });
      expect(client.queueSize).toBe(1);
    });

    it("auto-flushes at batch size", () => {
      for (let i = 0; i < 5; i++) {
        client.record({
          name: "test",
          type: MetricType.COUNTER,
          value: i,
          tenantId: "acme-corp",
        });
      }
      expect(client.queueSize).toBe(0);
    });
  });

  describe("flush", () => {
    it("returns all queued metrics", () => {
      client.record({
        name: "a",
        type: MetricType.COUNTER,
        value: 1,
        tenantId: "acme-corp",
      });
      client.record({
        name: "b",
        type: MetricType.GAUGE,
        value: 2,
        tenantId: "acme-corp",
      });

      const batch = client.flush();
      expect(batch.metrics).toHaveLength(2);
      expect(client.queueSize).toBe(0);
    });
  });

  describe("aggregate", () => {
    it("sums counter metrics by name", () => {
      client.record({
        name: "alerts.detected",
        type: MetricType.COUNTER,
        value: 3,
        tenantId: "acme-corp",
      });
      client.record({
        name: "alerts.detected",
        type: MetricType.COUNTER,
        value: 7,
        tenantId: "acme-corp",
      });

      const summary = client.aggregate("acme-corp");
      expect(summary.get("alerts.detected")).toBe(10);
    });
  });
});
