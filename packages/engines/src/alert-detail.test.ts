/**
 * @module Alert Detail Tests
 * @description TDD tests for the alert detail context builder.
 * Builds full context views for individual alerts.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { AlertDetailBuilder } from "./alert-detail";
import {
  AlertSource,
  AlertSeverity,
  type UnifiedAlert,
} from "./alert-aggregator";

describe("Alert Detail Builder", () => {
  let builder: AlertDetailBuilder;
  let sampleAlert: UnifiedAlert;

  beforeEach(() => {
    builder = new AlertDetailBuilder();
    sampleAlert = {
      id: "alert-1",
      source: AlertSource.PHISHING,
      severity: AlertSeverity.CRITICAL,
      title: "Phishing site detected",
      domain: "evil-bank.com",
      url: "https://evil-bank.com/login",
      timestamp: "2026-02-07T12:00:00Z",
    };
  });

  /* ── Initialization ── */

  describe("initialization", () => {
    it("creates an instance", () => {
      expect(builder).toBeInstanceOf(AlertDetailBuilder);
    });
  });

  /* ── Detail Building ── */

  describe("detail building", () => {
    it("builds a detail view from an alert", () => {
      const detail = builder.build(sampleAlert);

      expect(detail.alertId).toBe("alert-1");
      expect(detail.source).toBe(AlertSource.PHISHING);
      expect(detail.severity).toBe(AlertSeverity.CRITICAL);
    });

    it("includes formatted timestamp", () => {
      const detail = builder.build(sampleAlert);

      expect(detail.formattedTime).toBeDefined();
      expect(detail.formattedTime.length).toBeGreaterThan(0);
    });
  });

  /* ── Severity Label ── */

  describe("severity label", () => {
    it("returns human-readable severity", () => {
      expect(builder.getSeverityLabel(AlertSeverity.CRITICAL)).toBe("Critical");
      expect(builder.getSeverityLabel(AlertSeverity.HIGH)).toBe("High");
      expect(builder.getSeverityLabel(AlertSeverity.MEDIUM)).toBe("Medium");
      expect(builder.getSeverityLabel(AlertSeverity.LOW)).toBe("Low");
    });
  });

  /* ── Source Label ── */

  describe("source label", () => {
    it("returns engine display names", () => {
      expect(builder.getSourceLabel(AlertSource.PHISHING)).toBe(
        "Phishing Detection",
      );
      expect(builder.getSourceLabel(AlertSource.C2PA)).toBe("Deepfake Defense");
      expect(builder.getSourceLabel(AlertSource.DLP)).toBe(
        "Data Loss Prevention",
      );
    });
  });

  /* ── Context Summary ── */

  describe("context summary", () => {
    it("generates a context summary", () => {
      const summary = builder.buildSummary(sampleAlert);

      expect(summary).toContain("evil-bank.com");
      expect(summary).toContain("Phishing");
    });
  });

  /* ── Evidence Links ── */

  describe("evidence links", () => {
    it("builds evidence links from alert data", () => {
      const links = builder.buildEvidenceLinks(sampleAlert);

      expect(links).toHaveLength(1);
      expect(links[0]?.label).toBe("Original URL");
    });
  });
});
