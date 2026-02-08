/**
 * @module Threat Timeline Tests
 * @description TDD tests for the threat timeline data builder.
 * Buckets alerts into time intervals for chart visualization.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { ThreatTimeline, TimeInterval } from "./threat-timeline";
import {
  AlertSource,
  AlertSeverity,
  type UnifiedAlert,
} from "./alert-aggregator";

const makeAlert = (
  minutesAgo: number,
  source: AlertSource = AlertSource.PHISHING,
  severity: AlertSeverity = AlertSeverity.HIGH,
): UnifiedAlert => ({
  id: `alert-${minutesAgo}`,
  source,
  severity,
  title: "Test",
  domain: "test.com",
  url: "https://test.com",
  timestamp: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
});

describe("Threat Timeline", () => {
  let timeline: ThreatTimeline;

  beforeEach(() => {
    timeline = new ThreatTimeline();
  });

  /* ── Initialization ── */

  describe("initialization", () => {
    it("creates an instance", () => {
      expect(timeline).toBeInstanceOf(ThreatTimeline);
    });
  });

  /* ── Time Bucketing ── */

  describe("time bucketing", () => {
    it("buckets alerts into hourly intervals", () => {
      const alerts = [
        makeAlert(5), // ~5 min ago
        makeAlert(10), // ~10 min ago
        makeAlert(65), // ~1 hour ago
      ];

      const buckets = timeline.bucket(alerts, TimeInterval.HOUR);
      expect(buckets.length).toBeGreaterThan(0);
      expect(buckets[0]?.count).toBeDefined();
    });

    it("buckets into daily intervals", () => {
      const buckets = timeline.bucket([makeAlert(5)], TimeInterval.DAY);
      expect(buckets.length).toBeGreaterThan(0);
    });
  });

  /* ── Trend Data ── */

  describe("trend data", () => {
    it("calculates trend direction", () => {
      const alerts = [
        makeAlert(5),
        makeAlert(10),
        makeAlert(15),
        makeAlert(120),
      ];

      const trend = timeline.getTrend(alerts);
      expect(trend.direction).toBeDefined();
      expect(["up", "down", "stable"]).toContain(trend.direction);
    });

    it("returns alert count per source", () => {
      const alerts = [
        makeAlert(5, AlertSource.PHISHING),
        makeAlert(10, AlertSource.DLP),
        makeAlert(15, AlertSource.PHISHING),
      ];

      const breakdown = timeline.breakdownBySource(alerts);
      expect(breakdown[AlertSource.PHISHING]).toBe(2);
      expect(breakdown[AlertSource.DLP]).toBe(1);
    });
  });

  /* ── Empty Input ── */

  describe("empty input", () => {
    it("handles empty alerts", () => {
      const buckets = timeline.bucket([], TimeInterval.HOUR);
      expect(buckets).toHaveLength(0);
    });
  });
});
