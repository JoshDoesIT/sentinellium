/**
 * @module Fleet Manager Tests
 * @description TDD tests for the instance fleet manager.
 * Tracks connected extension instances, their health, and status.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { FleetManager, InstanceStatus } from "./fleet-manager";

describe("Fleet Manager", () => {
  let fleet: FleetManager;

  beforeEach(() => {
    fleet = new FleetManager();
  });

  /* ── Initialization ── */

  describe("initialization", () => {
    it("creates an instance", () => {
      expect(fleet).toBeInstanceOf(FleetManager);
    });

    it("starts with no instances", () => {
      expect(fleet.getAll()).toHaveLength(0);
    });
  });

  /* ── Instance Registration ── */

  describe("instance registration", () => {
    it("registers a new instance", () => {
      fleet.register({
        instanceId: "ext-001",
        hostname: "workstation-1",
        browser: "Chrome 122",
        version: "1.0.0",
      });

      expect(fleet.getAll()).toHaveLength(1);
    });

    it("updates existing instance on re-register", () => {
      fleet.register({
        instanceId: "ext-001",
        hostname: "ws-1",
        browser: "Chrome 122",
        version: "1.0.0",
      });
      fleet.register({
        instanceId: "ext-001",
        hostname: "ws-1",
        browser: "Chrome 123",
        version: "1.1.0",
      });

      expect(fleet.getAll()).toHaveLength(1);
      expect(fleet.getInstance("ext-001")?.browser).toBe("Chrome 123");
    });
  });

  /* ── Health Tracking ── */

  describe("health tracking", () => {
    it("tracks heartbeat", () => {
      fleet.register({
        instanceId: "ext-001",
        hostname: "ws-1",
        browser: "Chrome",
        version: "1.0.0",
      });
      fleet.heartbeat("ext-001");

      const instance = fleet.getInstance("ext-001");
      expect(instance?.status).toBe(InstanceStatus.ONLINE);
    });

    it("marks stale instances", () => {
      fleet.register({
        instanceId: "ext-001",
        hostname: "ws-1",
        browser: "Chrome",
        version: "1.0.0",
      });
      fleet.markStale("ext-001");

      expect(fleet.getInstance("ext-001")?.status).toBe(InstanceStatus.STALE);
    });
  });

  /* ── Instance Removal ── */

  describe("instance removal", () => {
    it("removes an instance", () => {
      fleet.register({
        instanceId: "ext-001",
        hostname: "ws-1",
        browser: "Chrome",
        version: "1.0.0",
      });
      fleet.remove("ext-001");

      expect(fleet.getAll()).toHaveLength(0);
    });
  });

  /* ── Fleet Stats ── */

  describe("fleet stats", () => {
    it("returns online instance count", () => {
      fleet.register({
        instanceId: "ext-001",
        hostname: "ws-1",
        browser: "Chrome",
        version: "1.0.0",
      });
      fleet.register({
        instanceId: "ext-002",
        hostname: "ws-2",
        browser: "Firefox",
        version: "1.0.0",
      });
      fleet.heartbeat("ext-001");
      fleet.heartbeat("ext-002");
      fleet.markStale("ext-002");

      expect(fleet.getOnlineCount()).toBe(1);
    });

    it("returns total instance count", () => {
      fleet.register({
        instanceId: "ext-001",
        hostname: "ws-1",
        browser: "Chrome",
        version: "1.0.0",
      });
      fleet.register({
        instanceId: "ext-002",
        hostname: "ws-2",
        browser: "Firefox",
        version: "1.0.0",
      });

      expect(fleet.getTotalCount()).toBe(2);
    });
  });
});
