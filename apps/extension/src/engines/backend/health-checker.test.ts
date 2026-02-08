/**
 * @module Health Checker Tests
 * @description TDD tests for health/readiness probe system.
 * Aggregates component health into overall service status.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { HealthChecker, HealthStatus } from "./health-checker";

describe("HealthChecker", () => {
  let checker: HealthChecker;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
    checker = new HealthChecker();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("status values", () => {
    it("defines all health statuses", () => {
      expect(HealthStatus.HEALTHY).toBe("HEALTHY");
      expect(HealthStatus.DEGRADED).toBe("DEGRADED");
      expect(HealthStatus.UNHEALTHY).toBe("UNHEALTHY");
    });
  });

  describe("registerCheck", () => {
    it("registers a named health check", () => {
      checker.registerCheck("database", () => HealthStatus.HEALTHY);
      expect(checker.listChecks()).toContain("database");
    });
  });

  describe("check", () => {
    it("returns HEALTHY when all checks pass", () => {
      checker.registerCheck("db", () => HealthStatus.HEALTHY);
      checker.registerCheck("cache", () => HealthStatus.HEALTHY);

      const result = checker.check();
      expect(result.overall).toBe(HealthStatus.HEALTHY);
      expect(result.components.db).toBe(HealthStatus.HEALTHY);
      expect(result.components.cache).toBe(HealthStatus.HEALTHY);
    });

    it("returns DEGRADED when any check is degraded", () => {
      checker.registerCheck("db", () => HealthStatus.HEALTHY);
      checker.registerCheck("cache", () => HealthStatus.DEGRADED);

      expect(checker.check().overall).toBe(HealthStatus.DEGRADED);
    });

    it("returns UNHEALTHY when any check is unhealthy", () => {
      checker.registerCheck("db", () => HealthStatus.UNHEALTHY);
      checker.registerCheck("cache", () => HealthStatus.HEALTHY);

      expect(checker.check().overall).toBe(HealthStatus.UNHEALTHY);
    });

    it("UNHEALTHY takes precedence over DEGRADED", () => {
      checker.registerCheck("db", () => HealthStatus.UNHEALTHY);
      checker.registerCheck("cache", () => HealthStatus.DEGRADED);

      expect(checker.check().overall).toBe(HealthStatus.UNHEALTHY);
    });
  });

  describe("isReady", () => {
    it("returns true when healthy", () => {
      checker.registerCheck("db", () => HealthStatus.HEALTHY);
      expect(checker.isReady()).toBe(true);
    });

    it("returns true when degraded", () => {
      checker.registerCheck("db", () => HealthStatus.DEGRADED);
      expect(checker.isReady()).toBe(true);
    });

    it("returns false when unhealthy", () => {
      checker.registerCheck("db", () => HealthStatus.UNHEALTHY);
      expect(checker.isReady()).toBe(false);
    });

    it("returns true with no checks registered", () => {
      expect(checker.isReady()).toBe(true);
    });
  });
});
