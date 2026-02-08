/**
 * @module Load Tester Tests
 * @description TDD tests for API load testing (k6-style).
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { LoadTester } from "./load-tester";

describe("LoadTester", () => {
  let tester: LoadTester;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
    tester = new LoadTester({
      targetUrl: "https://api.sentinellium.com",
      virtualUsers: 50,
      durationMs: 30_000,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("addScenario", () => {
    it("adds a load test scenario", () => {
      tester.addScenario({
        name: "GET /alerts",
        method: "GET",
        path: "/api/v1/alerts",
        weight: 70,
      });

      expect(tester.listScenarios()).toHaveLength(1);
    });
  });

  describe("simulate", () => {
    it("simulates load and produces metrics", () => {
      tester.addScenario({
        name: "GET /alerts",
        method: "GET",
        path: "/api/v1/alerts",
        weight: 100,
      });

      const result = tester.simulate();
      expect(result.totalRequests).toBeGreaterThan(0);
      expect(result.p95LatencyMs).toBeDefined();
      expect(result.errorRate).toBeDefined();
    });
  });

  describe("getThresholds", () => {
    it("validates results against thresholds", () => {
      tester.setThresholds({
        maxP95LatencyMs: 200,
        maxErrorRate: 0.01,
        minRequestsPerSec: 100,
      });

      tester.addScenario({
        name: "GET /health",
        method: "GET",
        path: "/health",
        weight: 100,
      });

      tester.simulate();
      const check = tester.checkThresholds();
      expect(check.passed).toBeDefined();
      expect(check.violations).toBeDefined();
    });
  });

  describe("getReport", () => {
    it("generates a load test report", () => {
      tester.addScenario({
        name: "POST /alerts",
        method: "POST",
        path: "/api/v1/alerts",
        weight: 100,
      });

      tester.simulate();
      const report = tester.getReport();
      expect(report.targetUrl).toBe("https://api.sentinellium.com");
      expect(report.virtualUsers).toBe(50);
    });
  });
});
