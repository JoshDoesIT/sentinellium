/**
 * @module Telemetry Service Client
 * @description Client for metrics submission, batching, and aggregation.
 */

/* ── Types ── */

export const MetricType = {
  COUNTER: "COUNTER",
  GAUGE: "GAUGE",
  HISTOGRAM: "HISTOGRAM",
} as const;

export type MetricType = (typeof MetricType)[keyof typeof MetricType];

export interface MetricInput {
  name: string;
  type: MetricType;
  value: number;
  tenantId: string;
}

export interface QueuedMetric extends MetricInput {
  timestamp: number;
}

export interface MetricBatch {
  batchId: string;
  metrics: QueuedMetric[];
  flushedAt: number;
}

export interface TelemetryServiceConfig {
  batchSize: number;
}

/* ── Client ── */

export class TelemetryServiceClient {
  private readonly config: TelemetryServiceConfig;
  private queue: QueuedMetric[] = [];
  private readonly history: QueuedMetric[] = [];
  private nextBatchId = 1;

  constructor(config: TelemetryServiceConfig) {
    this.config = config;
  }

  get queueSize(): number {
    return this.queue.length;
  }

  /**
   * Record a metric.
   *
   * @param input - Metric data
   */
  record(input: MetricInput): void {
    const queued: QueuedMetric = { ...input, timestamp: Date.now() };
    this.queue.push(queued);
    this.history.push(queued);

    if (this.queue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /** Flush all queued metrics into a batch. */
  flush(): MetricBatch {
    const batch: MetricBatch = {
      batchId: `mbatch-${String(this.nextBatchId++).padStart(4, "0")}`,
      metrics: [...this.queue],
      flushedAt: Date.now(),
    };
    this.queue = [];
    return batch;
  }

  /**
   * Aggregate counter metrics by name for a tenant.
   *
   * @param tenantId - Tenant to aggregate for
   * @returns Map of metric name → summed value
   */
  aggregate(tenantId: string): Map<string, number> {
    const result = new Map<string, number>();
    for (const metric of this.history) {
      if (metric.tenantId === tenantId && metric.type === MetricType.COUNTER) {
        result.set(metric.name, (result.get(metric.name) ?? 0) + metric.value);
      }
    }
    return result;
  }
}
