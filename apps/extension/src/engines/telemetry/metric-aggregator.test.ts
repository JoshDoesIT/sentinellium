/**
 * @module Metric Aggregator Tests
 * @description TDD tests for time-bucketed metric aggregation.
 * Rolls up raw telemetry events into hourly/daily/weekly summaries
 * with counts, rates, and per-engine breakdowns.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { MetricAggregator, TimeBucket } from "./metric-aggregator";
import { TelemetryCategory, type RecordedEvent } from "./telemetry-collector";

/** Helper to create recorded events at specific timestamps. */
function makeEvent(
  overrides: Partial<RecordedEvent> & { timestamp: number },
): RecordedEvent {
  return {
    category: TelemetryCategory.SCAN,
    action: "page_scanned",
    engine: "phishing",
    timestamp: overrides.timestamp,
    ...overrides,
  };
}

describe("MetricAggregator", () => {
  let aggregator: MetricAggregator;

  beforeEach(() => {
    aggregator = new MetricAggregator();
  });

  /* ── Ingestion ── */

  describe("ingest", () => {
    it("accepts an array of recorded events", () => {
      const events = [makeEvent({ timestamp: Date.now() })];
      aggregator.ingest(events);
      expect(aggregator.totalIngested).toBe(1);
    });

    it("accumulates events across multiple ingestions", () => {
      aggregator.ingest([makeEvent({ timestamp: Date.now() })]);
      aggregator.ingest([makeEvent({ timestamp: Date.now() })]);
      expect(aggregator.totalIngested).toBe(2);
    });
  });

  /* ── Time Bucketing ── */

  describe("aggregate", () => {
    it("groups events into hourly buckets", () => {
      const hour1 = new Date("2026-02-07T10:00:00Z").getTime();
      const hour1b = new Date("2026-02-07T10:30:00Z").getTime();
      const hour2 = new Date("2026-02-07T11:15:00Z").getTime();

      aggregator.ingest([
        makeEvent({ timestamp: hour1 }),
        makeEvent({ timestamp: hour1b }),
        makeEvent({ timestamp: hour2 }),
      ]);

      const buckets = aggregator.aggregate(TimeBucket.HOURLY);
      expect(buckets.length).toBe(2);
    });

    it("groups events into daily buckets", () => {
      const day1 = new Date("2026-02-07T10:00:00Z").getTime();
      const day1b = new Date("2026-02-07T22:00:00Z").getTime();
      const day2 = new Date("2026-02-08T05:00:00Z").getTime();

      aggregator.ingest([
        makeEvent({ timestamp: day1 }),
        makeEvent({ timestamp: day1b }),
        makeEvent({ timestamp: day2 }),
      ]);

      const buckets = aggregator.aggregate(TimeBucket.DAILY);
      expect(buckets.length).toBe(2);
    });

    it("includes event count in each bucket", () => {
      const base = new Date("2026-02-07T10:00:00Z").getTime();

      aggregator.ingest([
        makeEvent({ timestamp: base }),
        makeEvent({ timestamp: base + 1000 }),
        makeEvent({ timestamp: base + 2000 }),
      ]);

      const buckets = aggregator.aggregate(TimeBucket.HOURLY);
      expect(buckets[0].count).toBe(3);
    });

    it("returns empty array when no events ingested", () => {
      const buckets = aggregator.aggregate(TimeBucket.HOURLY);
      expect(buckets).toEqual([]);
    });
  });

  /* ── Per-Engine Breakdown ── */

  describe("aggregateByEngine", () => {
    it("groups metrics by engine name", () => {
      const ts = Date.now();

      aggregator.ingest([
        makeEvent({ timestamp: ts, engine: "phishing" }),
        makeEvent({ timestamp: ts, engine: "phishing" }),
        makeEvent({ timestamp: ts, engine: "c2pa" }),
        makeEvent({ timestamp: ts, engine: "dlp" }),
      ]);

      const byEngine = aggregator.aggregateByEngine();
      expect(byEngine.phishing).toBe(2);
      expect(byEngine.c2pa).toBe(1);
      expect(byEngine.dlp).toBe(1);
    });

    it("returns empty object when no events ingested", () => {
      const byEngine = aggregator.aggregateByEngine();
      expect(byEngine).toEqual({});
    });
  });

  /* ── Category Breakdown ── */

  describe("aggregateByCategory", () => {
    it("groups metrics by telemetry category", () => {
      const ts = Date.now();

      aggregator.ingest([
        makeEvent({
          timestamp: ts,
          category: TelemetryCategory.SCAN,
        }),
        makeEvent({
          timestamp: ts,
          category: TelemetryCategory.DETECTION,
        }),
        makeEvent({
          timestamp: ts,
          category: TelemetryCategory.SCAN,
        }),
      ]);

      const byCat = aggregator.aggregateByCategory();
      expect(byCat[TelemetryCategory.SCAN]).toBe(2);
      expect(byCat[TelemetryCategory.DETECTION]).toBe(1);
    });
  });
});
