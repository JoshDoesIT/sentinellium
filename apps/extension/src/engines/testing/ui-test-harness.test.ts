/**
 * @module UI Test Harness Tests
 * @description TDD tests for the Playwright-based extension UI test harness.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { UiTestHarness, TestStatus } from "./ui-test-harness";

describe("UiTestHarness", () => {
  let harness: UiTestHarness;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
    harness = new UiTestHarness({ browser: "chromium", headless: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("registerTest", () => {
    it("registers a UI test case", () => {
      harness.registerTest({
        id: "popup-renders",
        name: "Extension popup renders correctly",
        suite: "popup",
        run: () => ({ passed: true }),
      });

      expect(harness.listTests()).toHaveLength(1);
    });
  });

  describe("runAll", () => {
    it("runs all registered tests and collects results", () => {
      harness.registerTest({
        id: "popup-renders",
        name: "Popup renders",
        suite: "popup",
        run: () => ({ passed: true }),
      });
      harness.registerTest({
        id: "options-form",
        name: "Options form submits",
        suite: "options",
        run: () => ({ passed: false, error: "Form not found" }),
      });

      const report = harness.runAll();
      expect(report.total).toBe(2);
      expect(report.passed).toBe(1);
      expect(report.failed).toBe(1);
    });
  });

  describe("runSuite", () => {
    it("runs tests in a specific suite", () => {
      harness.registerTest({
        id: "popup-1",
        name: "Popup test 1",
        suite: "popup",
        run: () => ({ passed: true }),
      });
      harness.registerTest({
        id: "options-1",
        name: "Options test 1",
        suite: "options",
        run: () => ({ passed: true }),
      });

      const report = harness.runSuite("popup");
      expect(report.total).toBe(1);
      expect(report.passed).toBe(1);
    });
  });

  describe("getReport", () => {
    it("generates a summary report", () => {
      harness.registerTest({
        id: "test-1",
        name: "Test 1",
        suite: "core",
        run: () => ({ passed: true }),
      });

      harness.runAll();
      const report = harness.getReport();
      expect(report.browser).toBe("chromium");
      expect(report.results).toHaveLength(1);
      expect(report.results[0]!.status).toBe(TestStatus.PASSED);
    });
  });

  describe("getHistory", () => {
    it("stores run history", () => {
      harness.registerTest({
        id: "test-1",
        name: "Test 1",
        suite: "core",
        run: () => ({ passed: true }),
      });

      harness.runAll();
      vi.advanceTimersByTime(60_000);
      harness.runAll();

      expect(harness.getHistory()).toHaveLength(2);
    });
  });
});
