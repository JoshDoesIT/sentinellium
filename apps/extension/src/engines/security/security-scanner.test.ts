/**
 * @module Security Scanner Tests
 * @description TDD tests for security scanning pipeline (SAST, DAST, SCA).
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { SecurityScanner, ScanType } from "./security-scanner";

describe("SecurityScanner", () => {
  let scanner: SecurityScanner;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
    scanner = new SecurityScanner();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("registerCheck", () => {
    it("registers a security check", () => {
      scanner.registerCheck({
        id: "sql-injection",
        name: "SQL Injection Detection",
        type: ScanType.SAST,
        check: () => ({ passed: true, details: "No SQL injection found" }),
      });

      expect(scanner.listChecks()).toHaveLength(1);
    });
  });

  describe("runScan", () => {
    it("runs all registered checks and produces a report", () => {
      scanner.registerCheck({
        id: "xss-check",
        name: "XSS Detection",
        type: ScanType.SAST,
        check: () => ({ passed: true, details: "Clean" }),
      });
      scanner.registerCheck({
        id: "dep-vuln",
        name: "Dependency Vulnerability",
        type: ScanType.SCA,
        check: () => ({
          passed: false,
          details: "lodash@4.17.20 has CVE-2021-23337",
        }),
      });

      const report = scanner.runScan();
      expect(report.results).toHaveLength(2);
      expect(report.passed).toBe(false);
      expect(report.timestamp).toBe(Date.now());
    });

    it("passes when all checks pass", () => {
      scanner.registerCheck({
        id: "clean",
        name: "Clean Check",
        type: ScanType.DAST,
        check: () => ({ passed: true, details: "OK" }),
      });

      expect(scanner.runScan().passed).toBe(true);
    });
  });

  describe("getScanHistory", () => {
    it("stores scan history", () => {
      scanner.registerCheck({
        id: "test",
        name: "Test",
        type: ScanType.SAST,
        check: () => ({ passed: true, details: "OK" }),
      });

      scanner.runScan();
      vi.advanceTimersByTime(60_000);
      scanner.runScan();

      expect(scanner.getScanHistory()).toHaveLength(2);
    });
  });
});
