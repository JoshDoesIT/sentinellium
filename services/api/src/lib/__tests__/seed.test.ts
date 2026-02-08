/**
 * @module Seed Module Tests
 * @description Unit tests for the seed function that populates
 * engine singletons with demo data on startup.
 */

import { describe, it, expect } from "vitest";
import { aggregator, dashboard, fleet, users, auditLog } from "../state";
import { seed } from "../seed";

describe("seed", () => {
  it("should populate alerts in the aggregator", () => {
    seed();
    const alerts = aggregator.getAll();
    expect(alerts.length).toBeGreaterThanOrEqual(15);
  });

  it("should register fleet instances", () => {
    seed();
    const instances = fleet.getAll();
    expect(instances.length).toBeGreaterThanOrEqual(5);
  });

  it("should populate users", () => {
    seed();
    expect(users.length).toBeGreaterThanOrEqual(5);
  });

  it("should populate audit log entries", () => {
    seed();
    expect(auditLog.length).toBeGreaterThanOrEqual(18);
  });

  it("should set dashboard counters", () => {
    seed();
    const snap = dashboard.getSnapshot();
    expect(snap.totalAlerts).toBeGreaterThan(0);
    expect(snap.pagesScanned).toBeGreaterThan(0);
  });

  it("should be idempotent — calling seed twice should not duplicate alerts", () => {
    seed();
    const countAfterFirst = aggregator.getAll().length;
    seed();
    const countAfterSecond = aggregator.getAll().length;
    // AlertAggregator dedupes by url+source, so count should not grow
    expect(countAfterSecond).toBe(countAfterFirst);
  });
});
