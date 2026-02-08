/**
 * @module Report Exporter
 * @description Exports media integrity reports in JSON and summary formats.
 * Includes validation results, signer info, and export metadata.
 */
import { ValidationStatus } from "./manifest-validator";

/* ── Types ── */

/** Export format. */
export enum ReportFormat {
  JSON = "JSON",
  SUMMARY = "SUMMARY",
}

/** A single validation result for export. */
export interface ExportableResult {
  url: string;
  status: ValidationStatus;
  signer: string | null;
  claimGenerator: string | null;
  assertions: string[];
  signedAt: string | null;
}

/** JSON report structure. */
interface JsonReport {
  version: string;
  exportedAt: string;
  results: ExportableResult[];
}

/* ── Exporter ── */

/**
 * Exports media integrity reports in JSON or summary format.
 */
export class ReportExporter {
  /**
   * Export validation results to the specified format.
   *
   * @param results - Validation results to export
   * @param format - Output format
   * @returns Formatted report string
   */
  export(results: ExportableResult[], format: ReportFormat): string {
    switch (format) {
      case ReportFormat.JSON:
        return this.exportJson(results);
      case ReportFormat.SUMMARY:
        return this.exportSummary(results);
    }
  }

  /** Export as JSON with metadata. */
  private exportJson(results: ExportableResult[]): string {
    const report: JsonReport = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      results,
    };
    return JSON.stringify(report, null, 2);
  }

  /** Export as plain text summary. */
  private exportSummary(results: ExportableResult[]): string {
    if (results.length === 0) {
      return "No media validation results to export.";
    }

    const lines = ["Sentinellium Media Integrity Report", "=".repeat(35), ""];

    for (const result of results) {
      lines.push(`URL: ${result.url}`);
      lines.push(`Status: ${result.status}`);
      if (result.signer) lines.push(`Signer: ${result.signer}`);
      if (result.claimGenerator) lines.push(`Tool: ${result.claimGenerator}`);
      if (result.signedAt) lines.push(`Signed: ${result.signedAt}`);
      lines.push("");
    }

    return lines.join("\n");
  }
}
