/**
 * @module Report Generator Tests
 * @description TDD tests for executive summary report generation.
 * Supports JSON and plain-text export formats.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { ReportGenerator, ReportFormat } from "./report-generator";
import {
  AlertSource,
  AlertSeverity,
  type UnifiedAlert,
} from "./alert-aggregator";
import { type DashboardSnapshot, EngineStatus } from "./dashboard-state";

const makeSnapshot = (): DashboardSnapshot => ({
  engines: {
    phishing: EngineStatus.ACTIVE,
    c2pa: EngineStatus.ACTIVE,
    dlp: EngineStatus.ACTIVE,
  },
  totalAlerts: 42,
  threatsBlocked: 15,
  pagesScanned: 1200,
  connectedInstances: 8,
  lastUpdated: "2026-02-07T12:00:00Z",
});

const makeAlerts = (): UnifiedAlert[] => [
  {
    id: "1",
    source: AlertSource.PHISHING,
    severity: AlertSeverity.CRITICAL,
    title: "Phishing attack",
    domain: "evil.com",
    url: "https://evil.com",
    timestamp: "2026-02-07T12:00:00Z",
  },
  {
    id: "2",
    source: AlertSource.DLP,
    severity: AlertSeverity.HIGH,
    title: "SSN leaked",
    domain: "chatgpt.com",
    url: "https://chatgpt.com",
    timestamp: "2026-02-07T12:05:00Z",
  },
];

describe("Report Generator", () => {
  let generator: ReportGenerator;

  beforeEach(() => {
    generator = new ReportGenerator();
  });

  /* ── Initialization ── */

  describe("initialization", () => {
    it("creates an instance", () => {
      expect(generator).toBeInstanceOf(ReportGenerator);
    });
  });

  /* ── JSON Reports ── */

  describe("JSON reports", () => {
    it("generates a valid JSON report", () => {
      const report = generator.generate(
        makeSnapshot(),
        makeAlerts(),
        ReportFormat.JSON,
      );
      const parsed = JSON.parse(report);

      expect(parsed.version).toBe("1.0.0");
      expect(parsed.summary.totalAlerts).toBe(42);
      expect(parsed.alerts).toHaveLength(2);
    });
  });

  /* ── Text Reports ── */

  describe("text reports", () => {
    it("generates a plain-text executive summary", () => {
      const report = generator.generate(
        makeSnapshot(),
        makeAlerts(),
        ReportFormat.TEXT,
      );

      expect(report).toContain("Executive Summary");
      expect(report).toContain("42");
      expect(report).toContain("15");
    });

    it("includes alert details", () => {
      const report = generator.generate(
        makeSnapshot(),
        makeAlerts(),
        ReportFormat.TEXT,
      );

      expect(report).toContain("Phishing attack");
      expect(report).toContain("evil.com");
    });
  });

  /* ── Empty Reports ── */

  describe("empty reports", () => {
    it("handles zero alerts", () => {
      const report = generator.generate(makeSnapshot(), [], ReportFormat.JSON);
      const parsed = JSON.parse(report);
      expect(parsed.alerts).toHaveLength(0);
    });
  });
});
