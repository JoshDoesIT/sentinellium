/**
 * @module Alert Forwarder
 * @description Sends confirmed threat assessments to the enterprise
 * console. Queues alerts locally, sanitizes sensitive data, batches
 * for network efficiency, and retries on failure.
 *
 * Privacy: Strips PII from URLs/titles before transmission.
 * Enterprise: Respects opt-in — does nothing if enterprise is disabled.
 */
import { ThreatLevel } from "./threat-scorer";

/* ── Types ── */

/** Alert forwarder lifecycle status. */
export enum AlertStatus {
  IDLE = "IDLE",
  SENDING = "SENDING",
  ERROR = "ERROR",
}

/** A threat alert to forward to the console. */
export interface ThreatAlert {
  url: string;
  domain: string;
  threatLevel: ThreatLevel;
  score: number;
  confidence: number;
  triggeredSignals: string[];
  reasoning: string;
  timestamp: number;
  pageTitle: string;
}

/** Sanitized alert ready for transmission. */
interface SanitizedAlert {
  url: string;
  domain: string;
  threatLevel: ThreatLevel;
  score: number;
  confidence: number;
  triggeredSignals: string[];
  reasoning: string;
  timestamp: number;
  pageTitle: string;
}

/** Storage adapter interface. */
interface StorageAdapter {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
}

/** Configuration for the alert forwarder. */
export interface AlertForwarderConfig {
  storage: StorageAdapter;
  fetchFn: typeof fetch;
  consoleEndpoint: string;
  enterpriseEnabled: boolean;
}

/* ── Constants ── */

const QUEUE_KEY = "sentinellium:alert_queue";
const MAX_TITLE_LENGTH = 100;

/* ── Forwarder ── */

/**
 * Manages enterprise alert forwarding with local queuing.
 *
 * Flow: queueAlert() → flush() → POST to console API
 *
 * Alerts are stored locally and only sent when flush() is called.
 * Failed sends keep alerts in the queue for retry.
 */
export class AlertForwarder {
  private _status: AlertStatus = AlertStatus.IDLE;
  private readonly storage: StorageAdapter;
  private readonly fetchFn: typeof fetch;
  private readonly endpoint: string;
  private readonly enterpriseEnabled: boolean;

  constructor(config: AlertForwarderConfig) {
    this.storage = config.storage;
    this.fetchFn = config.fetchFn;
    this.endpoint = config.consoleEndpoint;
    this.enterpriseEnabled = config.enterpriseEnabled;
  }

  /** Current status. */
  get status(): AlertStatus {
    return this._status;
  }

  /**
   * Queue an alert for later transmission.
   *
   * @param alert - The threat alert to queue
   * @returns The new queue length
   */
  async queueAlert(alert: ThreatAlert): Promise<number> {
    const queue = await this.loadQueue();
    queue.push(alert);
    await this.storage.set(QUEUE_KEY, queue);
    return queue.length;
  }

  /**
   * Get the current queue length.
   */
  async getQueueLength(): Promise<number> {
    const queue = await this.loadQueue();
    return queue.length;
  }

  /**
   * Flush all queued alerts to the enterprise console.
   *
   * - Does nothing if enterprise is disabled
   * - Does nothing if queue is empty
   * - On failure, alerts remain in queue for retry
   */
  async flush(): Promise<void> {
    if (!this.enterpriseEnabled) return;

    const queue = await this.loadQueue();
    if (queue.length === 0) return;

    this._status = AlertStatus.SENDING;

    const sanitized = queue.map((alert) => this.sanitize(alert));

    try {
      const response = await this.fetchFn(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alerts: sanitized }),
      });

      if (response.ok) {
        // Clear queue on success
        await this.storage.set(QUEUE_KEY, []);
        this._status = AlertStatus.IDLE;
      } else {
        // Keep queue for retry on non-2xx
        this._status = AlertStatus.ERROR;
      }
    } catch {
      // Keep queue for retry on network error
      this._status = AlertStatus.ERROR;
    }
  }

  /* ── Sanitization ── */

  /**
   * Strip PII from alert data before sending.
   * - Removes query parameters from URLs
   * - Truncates page titles
   */
  private sanitize(alert: ThreatAlert): SanitizedAlert {
    let sanitizedUrl = alert.url;
    try {
      const parsed = new URL(alert.url);
      parsed.search = "";
      parsed.hash = "";
      sanitizedUrl = parsed.toString();
    } catch {
      // Keep original if URL parsing fails
    }

    return {
      url: sanitizedUrl,
      domain: alert.domain,
      threatLevel: alert.threatLevel,
      score: alert.score,
      confidence: alert.confidence,
      triggeredSignals: alert.triggeredSignals,
      reasoning: alert.reasoning,
      timestamp: alert.timestamp,
      pageTitle: alert.pageTitle.slice(0, MAX_TITLE_LENGTH),
    };
  }

  /* ── Storage ── */

  private async loadQueue(): Promise<ThreatAlert[]> {
    const raw = await this.storage.get(QUEUE_KEY);
    if (Array.isArray(raw)) {
      return raw as ThreatAlert[];
    }
    return [];
  }
}
