/**
 * @module Metric Aggregator
 * @description Rolls up raw telemetry events into time-bucketed metrics.
 * Supports hourly and daily grouping with per-engine and per-category
 * breakdowns. Computes counts for each time window.
 */
import { type RecordedEvent } from "./telemetry-collector";

/* ── Types ── */

/** Time bucket granularity. */
export enum TimeBucket {
    HOURLY = "HOURLY",
    DAILY = "DAILY",
}

/** An aggregated metric for a single time bucket. */
export interface AggregatedMetric {
    bucketStart: string;
    count: number;
}

/* ── Constants ── */

const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;

/* ── Aggregator ── */

/**
 * Aggregates raw telemetry events into time-bucketed metrics
 * and per-engine/per-category breakdowns.
 */
export class MetricAggregator {
    private events: RecordedEvent[] = [];
    private ingested = 0;

    /** Total number of events ingested across all calls. */
    get totalIngested(): number {
        return this.ingested;
    }

    /**
     * Ingest an array of recorded events for aggregation.
     *
     * @param events - Events to add
     */
    ingest(events: readonly RecordedEvent[]): void {
        this.events.push(...events);
        this.ingested += events.length;
    }

    /**
     * Aggregate events into time buckets.
     *
     * @param bucket - Granularity (HOURLY or DAILY)
     * @returns Array of aggregated metrics sorted by bucket start
     */
    aggregate(bucket: TimeBucket): AggregatedMetric[] {
        if (this.events.length === 0) return [];

        const divisor = bucket === TimeBucket.HOURLY ? MS_PER_HOUR : MS_PER_DAY;
        const groups = new Map<string, number>();

        for (const event of this.events) {
            const bucketStart = new Date(
                Math.floor(event.timestamp / divisor) * divisor,
            ).toISOString();

            groups.set(bucketStart, (groups.get(bucketStart) ?? 0) + 1);
        }

        return Array.from(groups.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([bucketStart, count]) => ({ bucketStart, count }));
    }

    /**
     * Aggregate counts by engine name.
     *
     * @returns Record mapping engine name to event count
     */
    aggregateByEngine(): Record<string, number> {
        const result: Record<string, number> = {};

        for (const event of this.events) {
            result[event.engine] = (result[event.engine] ?? 0) + 1;
        }

        return result;
    }

    /**
     * Aggregate counts by telemetry category.
     *
     * @returns Record mapping category to event count
     */
    aggregateByCategory(): Record<string, number> {
        const result: Record<string, number> = {};

        for (const event of this.events) {
            result[event.category] = (result[event.category] ?? 0) + 1;
        }

        return result;
    }
}
