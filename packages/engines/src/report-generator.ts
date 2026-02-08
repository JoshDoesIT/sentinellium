/**
 * @module Report Generator
 * @description Generates executive summary reports from dashboard
 * state and alert data. Supports JSON and plain-text formats.
 */
import { type UnifiedAlert } from "./alert-aggregator";
import { type DashboardSnapshot } from "./dashboard-state";

/* ── Types ── */

/** Report format. */
export enum ReportFormat {
  JSON = "JSON",
  TEXT = "TEXT",
}

/* ── Generator ── */

/**
 * Generates executive summary reports.
 */
export class ReportGenerator {
  /**
   * Generate a report from dashboard state and alerts.
   *
   * @param snapshot - Current dashboard snapshot
   * @param alerts - Alert data
   * @param format - Output format
   * @returns Formatted report string
   */
  generate(
    snapshot: DashboardSnapshot,
    alerts: readonly UnifiedAlert[],
    format: ReportFormat,
  ): string {
    if (format === ReportFormat.JSON) {
      return this.generateJson(snapshot, alerts);
    }
    return this.generateText(snapshot, alerts);
  }

  /** Generate JSON report. */
  private generateJson(
    snapshot: DashboardSnapshot,
    alerts: readonly UnifiedAlert[],
  ): string {
    return JSON.stringify(
      {
        version: "1.0.0",
        generatedAt: new Date().toISOString(),
        summary: {
          totalAlerts: snapshot.totalAlerts,
          threatsBlocked: snapshot.threatsBlocked,
          pagesScanned: snapshot.pagesScanned,
          connectedInstances: snapshot.connectedInstances,
          engines: snapshot.engines,
        },
        alerts: alerts.map((a) => ({
          id: a.id,
          source: a.source,
          severity: a.severity,
          title: a.title,
          domain: a.domain,
          url: a.url,
          timestamp: a.timestamp,
        })),
      },
      null,
      2,
    );
  }

  /** Generate plain-text executive summary. */
  private generateText(
    snapshot: DashboardSnapshot,
    alerts: readonly UnifiedAlert[],
  ): string {
    const lines: string[] = [
      "═══════════════════════════════════════════",
      "  Sentinellium — Executive Summary Report  ",
      "═══════════════════════════════════════════",
      "",
      `Generated: ${new Date().toISOString()}`,
      "",
      "── Dashboard Overview ──",
      `  Total Alerts:        ${snapshot.totalAlerts}`,
      `  Threats Blocked:     ${snapshot.threatsBlocked}`,
      `  Pages Scanned:       ${snapshot.pagesScanned}`,
      `  Connected Instances: ${snapshot.connectedInstances}`,
      "",
    ];

    if (alerts.length > 0) {
      lines.push("── Recent Alerts ──");
      for (const alert of alerts) {
        lines.push(
          `  [${alert.severity}] ${alert.title} — ${alert.domain} (${alert.source})`,
        );
      }
    }

    return lines.join("\n");
  }
}
