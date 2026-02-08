/**
 * @module Telemetry Event Collector
 * @description Centralized, privacy-gated telemetry event collection.
 * Records engine events (scans, blocks, detections, latency) with
 * timestamps. All collection is gated behind the analytics opt-in.
 * Batches events in a bounded queue for efficient processing.
 */

/* ── Types ── */

/** Telemetry event category. */
export enum TelemetryCategory {
  SCAN = "SCAN",
  DETECTION = "DETECTION",
  BLOCK = "BLOCK",
  PERFORMANCE = "PERFORMANCE",
  ERROR = "ERROR",
}

/** A raw telemetry event before timestamping. */
export interface TelemetryEvent {
  category: TelemetryCategory;
  action: string;
  engine: string;
  metadata?: Record<string, unknown>;
}

/** A recorded telemetry event with timestamp. */
export interface RecordedEvent extends TelemetryEvent {
  timestamp: number;
}

/** Analytics gate interface (subset of createAnalytics return). */
interface AnalyticsGate {
  isOptedIn: () => Promise<boolean>;
}

/** Collector configuration. */
interface CollectorConfig {
  analytics: AnalyticsGate;
  maxQueueSize: number;
}

/* ── Collector ── */

/**
 * Privacy-gated telemetry event collector.
 * Events are only recorded when the user has opted in.
 * Queue is bounded to prevent unbounded memory growth.
 */
export class TelemetryCollector {
  private readonly config: CollectorConfig;
  private readonly queue: RecordedEvent[] = [];

  constructor(config: CollectorConfig) {
    this.config = config;
  }

  /** Number of pending events in the queue. */
  get pendingCount(): number {
    return this.queue.length;
  }

  /**
   * Record a telemetry event.
   * Silently drops the event if analytics is opted out.
   * Drops oldest events when queue exceeds max size.
   *
   * @param event - Event to record
   */
  async record(event: TelemetryEvent): Promise<void> {
    const optedIn = await this.config.analytics.isOptedIn();
    if (!optedIn) return;

    const recorded: RecordedEvent = {
      ...event,
      timestamp: Date.now(),
    };

    this.queue.push(recorded);

    while (this.queue.length > this.config.maxQueueSize) {
      this.queue.shift();
    }
  }

  /**
   * Drain all pending events from the queue.
   * Returns a copy and clears the internal queue.
   *
   * @returns All pending recorded events
   */
  drain(): RecordedEvent[] {
    const events = [...this.queue];
    this.queue.length = 0;
    return events;
  }
}
