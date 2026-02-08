/**
 * @module Metric Exporter Tests
 * @description TDD tests for exporting telemetry metrics to external
 * systems (SIEM, SOAR, custom webhooks). Retry-on-failure pattern.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { MetricExporter } from "./metric-exporter";
import { TelemetryCategory, type RecordedEvent } from "./telemetry-collector";

/** Helper to create a recorded event. */
function makeEvent(overrides?: Partial<RecordedEvent>): RecordedEvent {
  return {
    category: TelemetryCategory.SCAN,
    action: "page_scanned",
    engine: "phishing",
    timestamp: Date.now(),
    ...overrides,
  };
}

describe("MetricExporter", () => {
  let exporter: MetricExporter;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn().mockResolvedValue({ ok: true });
    exporter = new MetricExporter({
      endpoint: "https://siem.example.com/ingest",
      enabled: true,
      fetchFn: mockFetch,
    });
  });

  /* ── Queueing ── */

  describe("enqueue", () => {
    it("queues events for export", () => {
      exporter.enqueue([makeEvent()]);
      expect(exporter.pendingCount).toBe(1);
    });

    it("accumulates across multiple enqueue calls", () => {
      exporter.enqueue([makeEvent()]);
      exporter.enqueue([makeEvent(), makeEvent()]);
      expect(exporter.pendingCount).toBe(3);
    });
  });

  /* ── Export ── */

  describe("flush", () => {
    it("sends queued events to the configured endpoint", async () => {
      exporter.enqueue([makeEvent()]);
      await exporter.flush();

      expect(mockFetch).toHaveBeenCalledOnce();
      expect(mockFetch).toHaveBeenCalledWith(
        "https://siem.example.com/ingest",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    it("clears queue after successful export", async () => {
      exporter.enqueue([makeEvent()]);
      await exporter.flush();

      expect(exporter.pendingCount).toBe(0);
    });

    it("retains queue on export failure for retry", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));
      exporter.enqueue([makeEvent()]);
      await exporter.flush();

      expect(exporter.pendingCount).toBe(1);
    });

    it("does nothing when queue is empty", async () => {
      await exporter.flush();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("does nothing when exporter is disabled", async () => {
      const disabled = new MetricExporter({
        endpoint: "https://siem.example.com/ingest",
        enabled: false,
        fetchFn: mockFetch,
      });

      disabled.enqueue([makeEvent()]);
      await disabled.flush();

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("includes all queued events in the export payload", async () => {
      exporter.enqueue([
        makeEvent({ action: "a" }),
        makeEvent({ action: "b" }),
      ]);
      await exporter.flush();

      const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
      expect(body.metrics).toHaveLength(2);
      expect(body.metrics[0].action).toBe("a");
      expect(body.metrics[1].action).toBe("b");
    });
  });

  /* ── Disabled State ── */

  describe("when disabled", () => {
    it("still accepts enqueue calls without error", () => {
      const disabled = new MetricExporter({
        endpoint: "https://siem.example.com/ingest",
        enabled: false,
        fetchFn: mockFetch,
      });

      disabled.enqueue([makeEvent()]);
      expect(disabled.pendingCount).toBe(1);
    });
  });
});
