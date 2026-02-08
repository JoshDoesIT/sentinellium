/**
 * @module Analytics Dashboard Data Layer
 * @description Provides structured data for analytics views: trend lines,
 * engine comparisons, and threat category breakdowns. Transforms raw
 * telemetry events into chart-ready formats.
 */
import { type RecordedEvent } from "./telemetry-collector";

/* ── Types ── */

/** A single point on a trend line. */
export interface TrendPoint {
  timestamp: number;
  count: number;
}

/** Engine comparison entry. */
export interface EngineComparison {
  engine: string;
  count: number;
  percentage: number;
}

/** Category breakdown entry. */
export interface CategoryBreakdown {
  category: string;
  count: number;
}

/* ── Constants ── */

const MS_PER_HOUR = 3_600_000;

/* ── Dashboard ── */

/**
 * Transforms telemetry events into chart-ready analytics data.
 */
export class AnalyticsDashboard {
  private events: RecordedEvent[] = [];

  /**
   * Ingest recorded events for analysis.
   *
   * @param events - Events to add
   */
  ingest(events: readonly RecordedEvent[]): void {
    this.events.push(...events);
  }

  /**
   * Get trend line data points grouped by hour.
   * Returns points sorted chronologically with event counts.
   *
   * @returns Array of trend points
   */
  getTrendLine(): TrendPoint[] {
    if (this.events.length === 0) return [];

    const buckets = new Map<number, number>();

    for (const event of this.events) {
      const bucketKey = Math.floor(event.timestamp / MS_PER_HOUR) * MS_PER_HOUR;
      buckets.set(bucketKey, (buckets.get(bucketKey) ?? 0) + 1);
    }

    return Array.from(buckets.entries())
      .sort(([a], [b]) => a - b)
      .map(([timestamp, count]) => ({ timestamp, count }));
  }

  /**
   * Get engine comparison data with counts and percentages.
   *
   * @returns Array of engine comparison entries
   */
  getEngineComparison(): EngineComparison[] {
    const counts = new Map<string, number>();

    for (const event of this.events) {
      counts.set(event.engine, (counts.get(event.engine) ?? 0) + 1);
    }

    const total = this.events.length;

    return Array.from(counts.entries()).map(([engine, count]) => ({
      engine,
      count,
      percentage: Math.round((count / total) * 100),
    }));
  }

  /**
   * Get category breakdown sorted by count descending.
   *
   * @returns Array of category breakdown entries
   */
  getCategoryBreakdown(): CategoryBreakdown[] {
    const counts = new Map<string, number>();

    for (const event of this.events) {
      counts.set(event.category, (counts.get(event.category) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }
}
