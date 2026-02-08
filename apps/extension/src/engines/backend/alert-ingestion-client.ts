/**
 * @module Alert Ingestion Client
 * @description Client for batch and real-time alert submission.
 * Queues alerts locally, auto-flushes at batch size threshold,
 * and tracks batch history for retry/audit.
 */

/* ── Types ── */

/** Alert severity levels. */
export const AlertPriority = {
  CRITICAL: "CRITICAL",
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
} as const;

export type AlertPriority = (typeof AlertPriority)[keyof typeof AlertPriority];

/** Input for submitting an alert. */
export interface AlertInput {
  type: string;
  severity: AlertPriority;
  message: string;
  tenantId: string;
}

/** A queued alert with timestamp. */
export interface QueuedAlert extends AlertInput {
  timestamp: number;
}

/** Result of a submit operation. */
export interface SubmitResult {
  flushed: boolean;
  batchId?: string;
}

/** A flushed batch of alerts. */
export interface AlertBatch {
  batchId: string;
  alerts: QueuedAlert[];
  flushedAt: number;
}

/** Client configuration. */
export interface AlertIngestionConfig {
  batchSize: number;
  flushIntervalMs: number;
}

/* ── Client ── */

/**
 * Batched alert ingestion client.
 * Queues alerts and flushes when batch size is reached or on manual flush.
 */
export class AlertIngestionClient {
  private readonly config: AlertIngestionConfig;
  private queue: QueuedAlert[] = [];
  private readonly history: AlertBatch[] = [];
  private nextBatchId = 1;

  constructor(config: AlertIngestionConfig) {
    this.config = config;
  }

  /** Number of alerts waiting to be flushed. */
  get queueSize(): number {
    return this.queue.length;
  }

  /**
   * Submit an alert for batched ingestion.
   * Auto-flushes when batch size is reached.
   *
   * @param input - Alert data
   * @returns Submit result with flush status
   */
  submit(input: AlertInput): SubmitResult {
    this.queue.push({ ...input, timestamp: Date.now() });

    if (this.queue.length >= this.config.batchSize) {
      const batch = this.flush();
      return { flushed: true, batchId: batch.batchId };
    }

    return { flushed: false };
  }

  /**
   * Manually flush all pending alerts into a batch.
   *
   * @returns The flushed batch
   */
  flush(): AlertBatch {
    const batch: AlertBatch = {
      batchId: `batch-${String(this.nextBatchId++).padStart(4, "0")}`,
      alerts: [...this.queue],
      flushedAt: Date.now(),
    };

    if (batch.alerts.length > 0) {
      this.history.push(batch);
    }
    this.queue = [];
    return batch;
  }

  /** Get all pending (unflushed) alerts. */
  getPending(): QueuedAlert[] {
    return [...this.queue];
  }

  /** Get history of all flushed batches. */
  getBatchHistory(): AlertBatch[] {
    return [...this.history];
  }
}
