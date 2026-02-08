/**
 * @module C2PA Alert Forwarder
 * @description Queues C2PA validation alerts (unverified/tampered media)
 * for enterprise console ingestion. Follows the same pattern as
 * the phishing engine alert forwarder.
 *
 * Features:
 *   - URL sanitization (strip query params)
 *   - Title truncation (max 200 chars)
 *   - Retry-on-failure (keep queue on network errors)
 *   - Enterprise opt-in guard
 */
import { type ValidationStatus } from "./manifest-validator";
import { type ContextLevel } from "./high-stakes-detector";

/* ── Types ── */

/** A queued C2PA alert. */
export interface C2paAlert {
  url: string;
  status: ValidationStatus;
  contextLevel: ContextLevel;
  domain: string;
  pageTitle: string;
  timestamp?: string;
}

/** Forwarder configuration. */
interface ForwarderConfig {
  consoleUrl: string;
  enabled: boolean;
  fetchFn: typeof fetch;
}

/* ── Constants ── */

const MAX_TITLE_LENGTH = 200;

/* ── Forwarder ── */

/**
 * Queues and forwards C2PA alerts to the enterprise console.
 */
export class C2paAlertForwarder {
  private readonly config: ForwarderConfig;
  private readonly alerts: C2paAlert[] = [];

  constructor(config: ForwarderConfig) {
    this.config = config;
  }

  /** Number of pending alerts in the queue. */
  get pendingCount(): number {
    return this.alerts.length;
  }

  /** Get a copy of the pending alerts. */
  getPending(): readonly C2paAlert[] {
    return [...this.alerts];
  }

  /**
   * Queue a C2PA alert for forwarding.
   * No-op if enterprise forwarding is disabled.
   *
   * @param alert - Alert data to queue
   */
  queue(alert: C2paAlert): void {
    if (!this.config.enabled) return;

    this.alerts.push({
      ...alert,
      url: this.sanitizeUrl(alert.url),
      pageTitle: this.truncateTitle(alert.pageTitle),
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Flush all queued alerts to the console API.
   * Retains queue on failure for retry.
   */
  async flush(): Promise<void> {
    if (!this.config.enabled || this.alerts.length === 0) return;

    try {
      await this.config.fetchFn(this.config.consoleUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alerts: this.alerts }),
      });

      // Clear queue on success
      this.alerts.length = 0;
    } catch {
      // Retain queue for retry on failure
    }
  }

  /** Strip query parameters from URLs. */
  private sanitizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      return `${parsed.origin}${parsed.pathname}`;
    } catch {
      return url;
    }
  }

  /** Truncate page titles to max length. */
  private truncateTitle(title: string): string {
    if (title.length <= MAX_TITLE_LENGTH) return title;
    return title.slice(0, MAX_TITLE_LENGTH);
  }
}
