/**
 * @module Console E2E Suite Tests
 * @description TDD tests for console dashboard E2E test suite.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { ConsoleE2eSuite } from "./console-e2e-suite";

describe("ConsoleE2eSuite", () => {
  let suite: ConsoleE2eSuite;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
    suite = new ConsoleE2eSuite({ baseUrl: "http://localhost:3000" });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("registerFlow", () => {
    it("registers an E2E user flow", () => {
      suite.registerFlow({
        id: "login-flow",
        name: "User Login Flow",
        steps: ["Navigate to /login", "Enter credentials", "Click submit"],
        verify: () => ({ passed: true }),
      });

      expect(suite.listFlows()).toHaveLength(1);
    });
  });

  describe("runFlow", () => {
    it("runs a single flow and reports result", () => {
      suite.registerFlow({
        id: "dashboard-load",
        name: "Dashboard loads",
        steps: ["Navigate to /dashboard"],
        verify: () => ({ passed: true }),
      });

      const result = suite.runFlow("dashboard-load");
      expect(result.passed).toBe(true);
    });

    it("captures failure details", () => {
      suite.registerFlow({
        id: "broken-flow",
        name: "Broken flow",
        steps: ["Navigate to /broken"],
        verify: () => ({ passed: false, error: "404 Not Found" }),
      });

      const result = suite.runFlow("broken-flow");
      expect(result.passed).toBe(false);
      expect(result.error).toBe("404 Not Found");
    });
  });

  describe("runAll", () => {
    it("runs all flows and produces a summary", () => {
      suite.registerFlow({
        id: "flow-a",
        name: "Flow A",
        steps: ["Step 1"],
        verify: () => ({ passed: true }),
      });
      suite.registerFlow({
        id: "flow-b",
        name: "Flow B",
        steps: ["Step 1"],
        verify: () => ({ passed: false, error: "Timeout" }),
      });

      const report = suite.runAll();
      expect(report.total).toBe(2);
      expect(report.passed).toBe(1);
      expect(report.failed).toBe(1);
    });
  });

  describe("getReport", () => {
    it("includes base URL and timestamp", () => {
      suite.registerFlow({
        id: "f1",
        name: "F1",
        steps: [],
        verify: () => ({ passed: true }),
      });
      suite.runAll();

      const report = suite.getReport();
      expect(report.baseUrl).toBe("http://localhost:3000");
      expect(report.timestamp).toBe(Date.now());
    });
  });
});
