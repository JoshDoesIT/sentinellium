/**
 * @module DLP Reporter
 * @description Queues and forwards DLP incidents to the enterprise console.
 * Follows the same retry-on-failure pattern as the alert forwarders.
 */
import { type PiiType } from "./pii-detector";

/* ── Types ── */

/** A DLP incident for reporting. */
export interface DlpIncident {
  domain: string;
  platform: string;
  action: string;
  piiTypes: PiiType[];
  piiCount: number;
  timestamp?: string;
}

/** Reporter configuration. */
interface ReporterConfig {
  consoleUrl: string;
  enabled: boolean;
  fetchFn: typeof fetch;
}

/* ── Reporter ── */

/**
 * Queues and forwards DLP incidents to the enterprise console.
 */
export class DlpReporter {
  private readonly config: ReporterConfig;
  private readonly incidents: DlpIncident[] = [];

  constructor(config: ReporterConfig) {
    this.config = config;
  }

  /** Number of pending incidents. */
  get pendingCount(): number {
    return this.incidents.length;
  }

  /**
   * Record a DLP incident.
   * No-op if enterprise reporting is disabled.
   *
   * @param incident - Incident data
   */
  record(incident: DlpIncident): void {
    if (!this.config.enabled) return;

    this.incidents.push({
      ...incident,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Flush all pending incidents to the console.
   * Retains queue on failure for retry.
   */
  async flush(): Promise<void> {
    if (!this.config.enabled || this.incidents.length === 0) return;

    try {
      await this.config.fetchFn(this.config.consoleUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incidents: this.incidents }),
      });
      this.incidents.length = 0;
    } catch {
      // Retain for retry
    }
  }
}
