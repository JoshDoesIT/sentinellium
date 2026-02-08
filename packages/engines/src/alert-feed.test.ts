/**
 * @module Alert Feed Tests
 * @description TDD tests for the alert feed with filtering,
 * search, and severity tier support.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { AlertFeed } from "./alert-feed";
import {
  AlertSource,
  AlertSeverity,
  type UnifiedAlert,
} from "./alert-aggregator";

const createAlert = (overrides: Partial<UnifiedAlert> = {}): UnifiedAlert => ({
  id: `alert-${Math.random()}`,
  source: AlertSource.PHISHING,
  severity: AlertSeverity.MEDIUM,
  title: "Test Alert",
  domain: "test.com",
  url: "https://test.com",
  timestamp: new Date().toISOString(),
  ...overrides,
});

describe("Alert Feed", () => {
  let feed: AlertFeed;
  let alerts: UnifiedAlert[];

  beforeEach(() => {
    feed = new AlertFeed();
    alerts = [
      createAlert({
        id: "1",
        source: AlertSource.PHISHING,
        severity: AlertSeverity.CRITICAL,
        title: "Phishing attack on bank.com",
        domain: "bank.com",
      }),
      createAlert({
        id: "2",
        source: AlertSource.C2PA,
        severity: AlertSeverity.LOW,
        title: "Unverified image on news.com",
        domain: "news.com",
      }),
      createAlert({
        id: "3",
        source: AlertSource.DLP,
        severity: AlertSeverity.HIGH,
        title: "SSN leaked to ChatGPT",
        domain: "chatgpt.com",
      }),
      createAlert({
        id: "4",
        source: AlertSource.PHISHING,
        severity: AlertSeverity.MEDIUM,
        title: "Suspicious login page",
        domain: "phish.net",
      }),
    ];
  });

  /* ── Initialization ── */

  describe("initialization", () => {
    it("creates an instance", () => {
      expect(feed).toBeInstanceOf(AlertFeed);
    });
  });

  /* ── Filtering by Source ── */

  describe("filtering by source", () => {
    it("filters alerts by source engine", () => {
      const result = feed.filter(alerts, { source: AlertSource.PHISHING });
      expect(result).toHaveLength(2);
      expect(result.every((a) => a.source === AlertSource.PHISHING)).toBe(true);
    });
  });

  /* ── Filtering by Severity ── */

  describe("filtering by severity", () => {
    it("filters by minimum severity", () => {
      const result = feed.filter(alerts, { minSeverity: AlertSeverity.HIGH });
      expect(result).toHaveLength(2);
      expect(result.some((a) => a.severity === AlertSeverity.LOW)).toBe(false);
    });
  });

  /* ── Search ── */

  describe("search", () => {
    it("searches by title text", () => {
      const result = feed.filter(alerts, { search: "SSN" });
      expect(result).toHaveLength(1);
      expect(result[0]?.title).toContain("SSN");
    });

    it("searches by domain", () => {
      const result = feed.filter(alerts, { search: "bank.com" });
      expect(result).toHaveLength(1);
    });

    it("search is case-insensitive", () => {
      const result = feed.filter(alerts, { search: "chatgpt" });
      expect(result).toHaveLength(1);
    });
  });

  /* ── Combined Filters ── */

  describe("combined filters", () => {
    it("applies source and severity together", () => {
      const result = feed.filter(alerts, {
        source: AlertSource.PHISHING,
        minSeverity: AlertSeverity.HIGH,
      });
      expect(result).toHaveLength(1);
      expect(result[0]?.severity).toBe(AlertSeverity.CRITICAL);
    });
  });

  /* ── Pagination ── */

  describe("pagination", () => {
    it("paginates results", () => {
      const page = feed.paginate(alerts, { page: 1, pageSize: 2 });
      expect(page.items).toHaveLength(2);
      expect(page.totalPages).toBe(2);
      expect(page.totalItems).toBe(4);
    });

    it("returns correct page", () => {
      const page = feed.paginate(alerts, { page: 2, pageSize: 2 });
      expect(page.items).toHaveLength(2);
      expect(page.currentPage).toBe(2);
    });
  });
});
