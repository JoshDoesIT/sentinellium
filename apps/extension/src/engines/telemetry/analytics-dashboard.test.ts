/**
 * @module Analytics Dashboard Data Layer Tests
 * @description TDD tests for structured analytics data views.
 * Transforms aggregated metrics into chart-ready formats: trend lines,
 * engine comparisons, and threat category breakdowns.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { AnalyticsDashboard } from "./analytics-dashboard";
import { TelemetryCategory, type RecordedEvent } from "./telemetry-collector";

/** Helper to create events at timestamps. */
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

describe("AnalyticsDashboard", () => {
  let dashboard: AnalyticsDashboard;

  beforeEach(() => {
    dashboard = new AnalyticsDashboard();
  });

  /* ── Trend Lines ── */

  describe("getTrendLine", () => {
    it("returns trend points sorted by time", () => {
      const t1 = new Date("2026-02-07T10:00:00Z").getTime();
      const t2 = new Date("2026-02-07T11:00:00Z").getTime();
      const t3 = new Date("2026-02-07T12:00:00Z").getTime();

      dashboard.ingest([
        makeEvent({ timestamp: t1 }),
        makeEvent({ timestamp: t2 }),
        makeEvent({ timestamp: t2 + 1000 }),
        makeEvent({ timestamp: t3 }),
      ]);

      const trend = dashboard.getTrendLine();
      expect(trend.length).toBeGreaterThanOrEqual(2);
      expect(trend[0].timestamp).toBeLessThan(
        trend[trend.length - 1].timestamp,
      );
    });

    it("includes count per time point", () => {
      const ts = new Date("2026-02-07T10:00:00Z").getTime();

      dashboard.ingest([
        makeEvent({ timestamp: ts }),
        makeEvent({ timestamp: ts + 1000 }),
        makeEvent({ timestamp: ts + 2000 }),
      ]);

      const trend = dashboard.getTrendLine();
      const totalCount = trend.reduce((sum, p) => sum + p.count, 0);
      expect(totalCount).toBe(3);
    });

    it("returns empty array when no data", () => {
      expect(dashboard.getTrendLine()).toEqual([]);
    });
  });

  /* ── Engine Comparison ── */

  describe("getEngineComparison", () => {
    it("returns counts per engine", () => {
      const ts = Date.now();

      dashboard.ingest([
        makeEvent({ timestamp: ts, engine: "phishing" }),
        makeEvent({ timestamp: ts, engine: "phishing" }),
        makeEvent({ timestamp: ts, engine: "c2pa" }),
        makeEvent({ timestamp: ts, engine: "dlp" }),
        makeEvent({ timestamp: ts, engine: "dlp" }),
        makeEvent({ timestamp: ts, engine: "dlp" }),
      ]);

      const comparison = dashboard.getEngineComparison();
      expect(comparison).toHaveLength(3);

      const phishing = comparison.find((e) => e.engine === "phishing");
      expect(phishing?.count).toBe(2);

      const dlp = comparison.find((e) => e.engine === "dlp");
      expect(dlp?.count).toBe(3);
    });

    it("includes percentage of total", () => {
      const ts = Date.now();

      dashboard.ingest([
        makeEvent({ timestamp: ts, engine: "phishing" }),
        makeEvent({ timestamp: ts, engine: "c2pa" }),
        makeEvent({ timestamp: ts, engine: "c2pa" }),
        makeEvent({ timestamp: ts, engine: "c2pa" }),
      ]);

      const comparison = dashboard.getEngineComparison();
      const c2pa = comparison.find((e) => e.engine === "c2pa");
      expect(c2pa?.percentage).toBe(75);
    });
  });

  /* ── Category Breakdown ── */

  describe("getCategoryBreakdown", () => {
    it("returns counts per telemetry category", () => {
      const ts = Date.now();

      dashboard.ingest([
        makeEvent({ timestamp: ts, category: TelemetryCategory.SCAN }),
        makeEvent({ timestamp: ts, category: TelemetryCategory.SCAN }),
        makeEvent({ timestamp: ts, category: TelemetryCategory.DETECTION }),
        makeEvent({ timestamp: ts, category: TelemetryCategory.BLOCK }),
      ]);

      const breakdown = dashboard.getCategoryBreakdown();
      expect(breakdown).toHaveLength(3);

      const scans = breakdown.find(
        (b) => b.category === TelemetryCategory.SCAN,
      );
      expect(scans?.count).toBe(2);
    });

    it("sorts by count descending", () => {
      const ts = Date.now();

      dashboard.ingest([
        makeEvent({ timestamp: ts, category: TelemetryCategory.SCAN }),
        makeEvent({ timestamp: ts, category: TelemetryCategory.SCAN }),
        makeEvent({ timestamp: ts, category: TelemetryCategory.SCAN }),
        makeEvent({ timestamp: ts, category: TelemetryCategory.DETECTION }),
      ]);

      const breakdown = dashboard.getCategoryBreakdown();
      expect(breakdown[0].category).toBe(TelemetryCategory.SCAN);
      expect(breakdown[0].count).toBe(3);
    });
  });
});
