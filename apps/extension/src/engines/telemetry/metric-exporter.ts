/**
 * @module Metric Exporter
 * @description Exports telemetry metrics to external systems (SIEM, SOAR,
 * custom webhooks). Queues events and flushes in batches with retry-on-failure.
 */
import { type RecordedEvent } from "./telemetry-collector";

/* ── Types ── */

/** Exporter configuration. */
export interface ExportConfig {
    endpoint: string;
    enabled: boolean;
    fetchFn: typeof fetch;
}

/* ── Exporter ── */

/**
 * Queues and exports telemetry metrics to external endpoints.
 * Retains queue on failure for automatic retry.
 */
export class MetricExporter {
    private readonly config: ExportConfig;
    private readonly queue: RecordedEvent[] = [];

    constructor(config: ExportConfig) {
        this.config = config;
    }

    /** Number of pending events awaiting export. */
    get pendingCount(): number {
        return this.queue.length;
    }

    /**
     * Enqueue events for export.
     *
     * @param events - Events to queue
     */
    enqueue(events: readonly RecordedEvent[]): void {
        this.queue.push(...events);
    }

    /**
     * Flush all queued events to the configured endpoint.
     * No-op if disabled or queue is empty.
     * Retains queue on failure for retry.
     */
    async flush(): Promise<void> {
        if (!this.config.enabled || this.queue.length === 0) return;

        try {
            await this.config.fetchFn(this.config.endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ metrics: this.queue }),
            });
            this.queue.length = 0;
        } catch {
            // Retain for retry
        }
    }
}
