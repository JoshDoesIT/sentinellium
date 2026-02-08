/**
 * @module Alert Detail Builder
 * @description Builds full context views for individual alerts.
 * Provides formatted labels, summaries, and evidence links.
 */
import {
  type UnifiedAlert,
  AlertSeverity,
  AlertSource,
} from "./alert-aggregator";

/* ── Types ── */

/** Full alert detail view. */
export interface AlertDetail {
  alertId: string;
  source: AlertSource;
  severity: AlertSeverity;
  title: string;
  domain: string;
  url: string;
  formattedTime: string;
  severityLabel: string;
  sourceLabel: string;
}

/** Evidence link. */
export interface EvidenceLink {
  label: string;
  url: string;
}

/* ── Constants ── */

const SEVERITY_LABELS: Record<AlertSeverity, string> = {
  [AlertSeverity.CRITICAL]: "Critical",
  [AlertSeverity.HIGH]: "High",
  [AlertSeverity.MEDIUM]: "Medium",
  [AlertSeverity.LOW]: "Low",
  [AlertSeverity.INFO]: "Info",
};

const SOURCE_LABELS: Record<AlertSource, string> = {
  [AlertSource.PHISHING]: "Phishing Detection",
  [AlertSource.C2PA]: "Deepfake Defense",
  [AlertSource.DLP]: "Data Loss Prevention",
};

/* ── Builder ── */

/**
 * Builds detailed context views for individual alerts.
 */
export class AlertDetailBuilder {
  /**
   * Build a full detail view from an alert.
   *
   * @param alert - The unified alert
   * @returns Detailed view with formatted fields
   */
  build(alert: UnifiedAlert): AlertDetail {
    return {
      alertId: alert.id,
      source: alert.source,
      severity: alert.severity,
      title: alert.title,
      domain: alert.domain,
      url: alert.url,
      formattedTime: this.formatTime(alert.timestamp),
      severityLabel: this.getSeverityLabel(alert.severity),
      sourceLabel: this.getSourceLabel(alert.source),
    };
  }

  /** Get human-readable severity label. */
  getSeverityLabel(severity: AlertSeverity): string {
    return SEVERITY_LABELS[severity];
  }

  /** Get engine display name. */
  getSourceLabel(source: AlertSource): string {
    return SOURCE_LABELS[source];
  }

  /**
   * Generate a context summary for an alert.
   *
   * @param alert - The alert
   * @returns Human-readable summary
   */
  buildSummary(alert: UnifiedAlert): string {
    const engine = this.getSourceLabel(alert.source);
    const severity = this.getSeverityLabel(alert.severity);
    return `${severity} ${engine} alert on ${alert.domain}: ${alert.title}`;
  }

  /**
   * Build evidence links from alert data.
   *
   * @param alert - The alert
   * @returns Array of evidence links
   */
  buildEvidenceLinks(alert: UnifiedAlert): EvidenceLink[] {
    return [{ label: "Original URL", url: alert.url }];
  }

  /** Format an ISO timestamp for display. */
  private formatTime(iso: string): string {
    try {
      const date = new Date(iso);
      return date.toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return iso;
    }
  }
}
