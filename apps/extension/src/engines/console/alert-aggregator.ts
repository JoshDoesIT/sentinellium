/**
 * @module Alert Aggregator
 * @description Merges alerts from phishing, C2PA, and DLP engines
 * into a unified feed. Supports deduplication, severity sorting,
 * and counts per source/severity.
 */

/* ── Types ── */

/** Alert source engine. */
export enum AlertSource {
  PHISHING = "PHISHING",
  C2PA = "C2PA",
  DLP = "DLP",
}

/** Alert severity level. */
export enum AlertSeverity {
  CRITICAL = "CRITICAL",
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
  INFO = "INFO",
}

/** Unified alert from any engine. */
export interface UnifiedAlert {
  id: string;
  source: AlertSource;
  severity: AlertSeverity;
  title: string;
  domain: string;
  url: string;
  timestamp: string;
}

/** Input for adding an alert. */
export interface AlertInput {
  source: AlertSource;
  severity: AlertSeverity;
  title: string;
  domain: string;
  url: string;
}

/* ── Constants ── */

const SEVERITY_ORDER: Record<AlertSeverity, number> = {
  [AlertSeverity.CRITICAL]: 0,
  [AlertSeverity.HIGH]: 1,
  [AlertSeverity.MEDIUM]: 2,
  [AlertSeverity.LOW]: 3,
  [AlertSeverity.INFO]: 4,
};

/* ── Aggregator ── */

/**
 * Aggregates alerts from all security engines.
 */
export class AlertAggregator {
  private readonly alerts: UnifiedAlert[] = [];
  private readonly seen = new Set<string>();
  private nextId = 1;

  /**
   * Add an alert. Deduplicates by URL + source.
   *
   * @param input - Alert data
   */
  add(input: AlertInput): void {
    const dedupKey = `${input.source}:${input.url}`;
    if (this.seen.has(dedupKey)) return;
    this.seen.add(dedupKey);

    this.alerts.push({
      id: `alert-${this.nextId++}`,
      ...input,
      timestamp: new Date().toISOString(),
    });
  }

  /** Get all alerts (insertion order). */
  getAll(): readonly UnifiedAlert[] {
    return [...this.alerts];
  }

  /** Get alerts sorted by severity (most severe first). */
  getSorted(): UnifiedAlert[] {
    return [...this.alerts].sort(
      (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
    );
  }

  /** Count alerts by severity. */
  countsBySeverity(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const alert of this.alerts) {
      counts[alert.severity] = (counts[alert.severity] ?? 0) + 1;
    }
    return counts;
  }

  /** Count alerts by source engine. */
  countsBySource(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const alert of this.alerts) {
      counts[alert.source] = (counts[alert.source] ?? 0) + 1;
    }
    return counts;
  }

  /** Clear all alerts. */
  clear(): void {
    this.alerts.length = 0;
    this.seen.clear();
  }
}
