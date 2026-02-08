/**
 * @module Alert Aggregator Tests
 * @description TDD tests for the multi-engine alert aggregator.
 * Merges alerts from phishing, C2PA, and DLP engines.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  AlertAggregator,
  AlertSeverity,
  AlertSource,
} from "./alert-aggregator";

describe("Alert Aggregator", () => {
  let aggregator: AlertAggregator;

  beforeEach(() => {
    aggregator = new AlertAggregator();
  });

  /* ── Initialization ── */

  describe("initialization", () => {
    it("creates an instance", () => {
      expect(aggregator).toBeInstanceOf(AlertAggregator);
    });

    it("starts with empty alerts", () => {
      expect(aggregator.getAll()).toHaveLength(0);
    });
  });

  /* ── Adding Alerts ── */

  describe("adding alerts", () => {
    it("adds a phishing alert", () => {
      aggregator.add({
        source: AlertSource.PHISHING,
        severity: AlertSeverity.HIGH,
        title: "Phishing site detected",
        domain: "evil.com",
        url: "https://evil.com/login",
      });

      expect(aggregator.getAll()).toHaveLength(1);
      expect(aggregator.getAll()[0]?.source).toBe(AlertSource.PHISHING);
    });

    it("adds a C2PA alert", () => {
      aggregator.add({
        source: AlertSource.C2PA,
        severity: AlertSeverity.MEDIUM,
        title: "Unverified media detected",
        domain: "news.com",
        url: "https://news.com/image.jpg",
      });

      expect(aggregator.getAll()).toHaveLength(1);
    });

    it("adds a DLP alert", () => {
      aggregator.add({
        source: AlertSource.DLP,
        severity: AlertSeverity.CRITICAL,
        title: "SSN detected in ChatGPT input",
        domain: "chatgpt.com",
        url: "https://chatgpt.com",
      });

      expect(aggregator.getAll()).toHaveLength(1);
    });
  });

  /* ── Severity Sorting ── */

  describe("severity sorting", () => {
    it("sorts by severity descending", () => {
      aggregator.add({
        source: AlertSource.C2PA,
        severity: AlertSeverity.LOW,
        title: "Low",
        domain: "a.com",
        url: "https://a.com",
      });
      aggregator.add({
        source: AlertSource.PHISHING,
        severity: AlertSeverity.CRITICAL,
        title: "Critical",
        domain: "b.com",
        url: "https://b.com",
      });
      aggregator.add({
        source: AlertSource.DLP,
        severity: AlertSeverity.MEDIUM,
        title: "Medium",
        domain: "c.com",
        url: "https://c.com",
      });

      const sorted = aggregator.getSorted();
      expect(sorted[0]?.severity).toBe(AlertSeverity.CRITICAL);
      expect(sorted[2]?.severity).toBe(AlertSeverity.LOW);
    });
  });

  /* ── Deduplication ── */

  describe("deduplication", () => {
    it("deduplicates by URL and source", () => {
      const alert = {
        source: AlertSource.PHISHING,
        severity: AlertSeverity.HIGH,
        title: "Phishing",
        domain: "evil.com",
        url: "https://evil.com/login",
      };
      aggregator.add(alert);
      aggregator.add(alert);

      expect(aggregator.getAll()).toHaveLength(1);
    });

    it("allows same URL from different sources", () => {
      aggregator.add({
        source: AlertSource.PHISHING,
        severity: AlertSeverity.HIGH,
        title: "Phishing",
        domain: "evil.com",
        url: "https://evil.com/login",
      });
      aggregator.add({
        source: AlertSource.C2PA,
        severity: AlertSeverity.MEDIUM,
        title: "Unverified",
        domain: "evil.com",
        url: "https://evil.com/login",
      });

      expect(aggregator.getAll()).toHaveLength(2);
    });
  });

  /* ── Counts ── */

  describe("counts", () => {
    it("returns counts by severity", () => {
      aggregator.add({
        source: AlertSource.PHISHING,
        severity: AlertSeverity.CRITICAL,
        title: "A",
        domain: "a.com",
        url: "https://a.com",
      });
      aggregator.add({
        source: AlertSource.DLP,
        severity: AlertSeverity.CRITICAL,
        title: "B",
        domain: "b.com",
        url: "https://b.com",
      });
      aggregator.add({
        source: AlertSource.C2PA,
        severity: AlertSeverity.LOW,
        title: "C",
        domain: "c.com",
        url: "https://c.com",
      });

      const counts = aggregator.countsBySeverity();
      expect(counts[AlertSeverity.CRITICAL]).toBe(2);
      expect(counts[AlertSeverity.LOW]).toBe(1);
    });

    it("returns counts by source", () => {
      aggregator.add({
        source: AlertSource.PHISHING,
        severity: AlertSeverity.HIGH,
        title: "A",
        domain: "a.com",
        url: "https://a.com",
      });
      aggregator.add({
        source: AlertSource.PHISHING,
        severity: AlertSeverity.MEDIUM,
        title: "B",
        domain: "b.com",
        url: "https://b.com",
      });

      const counts = aggregator.countsBySource();
      expect(counts[AlertSource.PHISHING]).toBe(2);
    });
  });

  /* ── Clearing ── */

  describe("clearing", () => {
    it("clears all alerts", () => {
      aggregator.add({
        source: AlertSource.DLP,
        severity: AlertSeverity.HIGH,
        title: "A",
        domain: "a.com",
        url: "https://a.com",
      });
      aggregator.clear();
      expect(aggregator.getAll()).toHaveLength(0);
    });
  });
});
