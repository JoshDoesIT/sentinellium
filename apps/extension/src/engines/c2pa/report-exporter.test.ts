/**
 * @module Report Exporter Tests
 * @description TDD tests for the media integrity report exporter.
 * Exports validation results as JSON and summary text.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { ReportExporter, ReportFormat } from "./report-exporter";
import { ValidationStatus } from "./manifest-validator";

describe("Report Exporter", () => {
  let exporter: ReportExporter;

  beforeEach(() => {
    exporter = new ReportExporter();
  });

  /* ── Initialization ── */

  describe("initialization", () => {
    it("creates an instance", () => {
      expect(exporter).toBeInstanceOf(ReportExporter);
    });
  });

  /* ── JSON Export ── */

  describe("JSON export", () => {
    it("exports a JSON report for a single result", () => {
      const report = exporter.export(
        [
          {
            url: "https://example.com/photo.jpg",
            status: ValidationStatus.VERIFIED,
            signer: "Adobe Inc.",
            claimGenerator: "Photoshop",
            assertions: ["c2pa.actions"],
            signedAt: "2026-01-15T10:30:00Z",
          },
        ],
        ReportFormat.JSON,
      );

      const parsed = JSON.parse(report);
      expect(parsed.results).toHaveLength(1);
      expect(parsed.results[0].status).toBe("VERIFIED");
    });

    it("includes export metadata", () => {
      const report = exporter.export(
        [
          {
            url: "https://example.com/photo.jpg",
            status: ValidationStatus.VERIFIED,
            signer: "Adobe Inc.",
            claimGenerator: "Photoshop",
            assertions: [],
            signedAt: "2026-01-15T10:30:00Z",
          },
        ],
        ReportFormat.JSON,
      );

      const parsed = JSON.parse(report);
      expect(parsed.exportedAt).toBeDefined();
      expect(parsed.version).toBe("1.0");
    });

    it("includes multiple results", () => {
      const report = exporter.export(
        [
          {
            url: "https://example.com/photo1.jpg",
            status: ValidationStatus.VERIFIED,
            signer: "Adobe",
            claimGenerator: "Photoshop",
            assertions: [],
            signedAt: null,
          },
          {
            url: "https://example.com/photo2.jpg",
            status: ValidationStatus.UNVERIFIED,
            signer: null,
            claimGenerator: null,
            assertions: [],
            signedAt: null,
          },
        ],
        ReportFormat.JSON,
      );

      const parsed = JSON.parse(report);
      expect(parsed.results).toHaveLength(2);
    });
  });

  /* ── Summary Export ── */

  describe("summary export", () => {
    it("generates plain text summary", () => {
      const report = exporter.export(
        [
          {
            url: "https://example.com/photo.jpg",
            status: ValidationStatus.VERIFIED,
            signer: "Adobe Inc.",
            claimGenerator: "Photoshop",
            assertions: ["c2pa.actions"],
            signedAt: "2026-01-15T10:30:00Z",
          },
        ],
        ReportFormat.SUMMARY,
      );

      expect(report).toContain("VERIFIED");
      expect(report).toContain("Adobe Inc.");
    });

    it("handles unverified results in summary", () => {
      const report = exporter.export(
        [
          {
            url: "https://example.com/photo.jpg",
            status: ValidationStatus.UNVERIFIED,
            signer: null,
            claimGenerator: null,
            assertions: [],
            signedAt: null,
          },
        ],
        ReportFormat.SUMMARY,
      );

      expect(report).toContain("UNVERIFIED");
    });
  });

  /* ── Empty Report ── */

  describe("empty report", () => {
    it("handles empty results", () => {
      const report = exporter.export([], ReportFormat.JSON);
      const parsed = JSON.parse(report);
      expect(parsed.results).toHaveLength(0);
    });
  });
});
