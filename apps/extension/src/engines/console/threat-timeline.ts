/**
 * @module Threat Timeline
 * @description Builds time-bucketed data for threat timeline
 * visualizations. Supports hourly and daily intervals,
 * trend direction, and per-source breakdown.
 */
import { type UnifiedAlert } from "./alert-aggregator";

/* ── Types ── */

/** Time interval for bucketing. */
export enum TimeInterval {
  HOUR = "HOUR",
  DAY = "DAY",
}

/** A time bucket with alert count. */
export interface TimeBucket {
  start: string;
  end: string;
  count: number;
}

/** Trend analysis result. */
export interface TrendResult {
  direction: "up" | "down" | "stable";
  recentCount: number;
  previousCount: number;
}

/* ── Constants ── */

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

/* ── Timeline ── */

/**
 * Builds time-bucketed data for chart visualization.
 */
export class ThreatTimeline {
  /**
   * Bucket alerts into time intervals.
   *
   * @param alerts - Alerts to bucket
   * @param interval - Time interval (HOUR or DAY)
   * @returns Array of time buckets with counts
   */
  bucket(
    alerts: readonly UnifiedAlert[],
    interval: TimeInterval,
  ): TimeBucket[] {
    if (alerts.length === 0) return [];

    const intervalMs = interval === TimeInterval.HOUR ? HOUR_MS : DAY_MS;
    const now = Date.now();
    const bucketCount = interval === TimeInterval.HOUR ? 24 : 30;

    const buckets: TimeBucket[] = [];
    for (let i = bucketCount - 1; i >= 0; i--) {
      const start = now - (i + 1) * intervalMs;
      const end = now - i * intervalMs;

      const count = alerts.filter((a) => {
        const t = new Date(a.timestamp).getTime();
        return t >= start && t < end;
      }).length;

      buckets.push({
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
        count,
      });
    }

    return buckets;
  }

  /**
   * Calculate trend direction by comparing recent vs previous period.
   *
   * @param alerts - All alerts
   * @returns Trend direction and counts
   */
  getTrend(alerts: readonly UnifiedAlert[]): TrendResult {
    const now = Date.now();
    const halfPeriod = HOUR_MS; // Compare last hour vs previous hour

    const recentCount = alerts.filter(
      (a) => new Date(a.timestamp).getTime() >= now - halfPeriod,
    ).length;

    const previousCount = alerts.filter((a) => {
      const t = new Date(a.timestamp).getTime();
      return t >= now - 2 * halfPeriod && t < now - halfPeriod;
    }).length;

    let direction: "up" | "down" | "stable";
    if (recentCount > previousCount) direction = "up";
    else if (recentCount < previousCount) direction = "down";
    else direction = "stable";

    return { direction, recentCount, previousCount };
  }

  /**
   * Count alerts per source engine.
   *
   * @param alerts - Alerts to break down
   * @returns Counts keyed by AlertSource
   */
  breakdownBySource(alerts: readonly UnifiedAlert[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const alert of alerts) {
      counts[alert.source] = (counts[alert.source] ?? 0) + 1;
    }
    return counts;
  }
}
