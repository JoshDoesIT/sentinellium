/**
 * @module Extension Registration Client Tests
 * @description TDD tests for extension instance registration, heartbeat, and capabilities.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { ExtensionRegistrationClient } from "./extension-registration-client";

describe("ExtensionRegistrationClient", () => {
  let client: ExtensionRegistrationClient;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
    client = new ExtensionRegistrationClient({
      heartbeatIntervalMs: 30_000,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("register", () => {
    it("assigns a unique instance ID", () => {
      const result = client.register({
        extensionVersion: "1.2.0",
        browserInfo: "Chrome 120",
        capabilities: ["phishing", "dlp", "c2pa"],
        tenantId: "acme-corp",
      });

      expect(result.instanceId).toBeTruthy();
      expect(result.registeredAt).toBe(Date.now());
    });

    it("stores capabilities for reporting", () => {
      client.register({
        extensionVersion: "1.2.0",
        browserInfo: "Chrome 120",
        capabilities: ["phishing", "dlp"],
        tenantId: "acme-corp",
      });

      const info = client.getInstanceInfo();
      expect(info!.capabilities).toEqual(["phishing", "dlp"]);
    });
  });

  describe("heartbeat", () => {
    it("updates last heartbeat timestamp", () => {
      client.register({
        extensionVersion: "1.2.0",
        browserInfo: "Chrome 120",
        capabilities: [],
        tenantId: "acme-corp",
      });

      vi.advanceTimersByTime(30_000);
      client.heartbeat();

      expect(client.getInstanceInfo()!.lastHeartbeat).toBe(Date.now());
    });

    it("throws when not registered", () => {
      expect(() => client.heartbeat()).toThrow();
    });
  });

  describe("deregister", () => {
    it("clears instance info", () => {
      client.register({
        extensionVersion: "1.2.0",
        browserInfo: "Chrome 120",
        capabilities: [],
        tenantId: "acme-corp",
      });

      client.deregister();
      expect(client.getInstanceInfo()).toBeUndefined();
    });
  });

  describe("isRegistered", () => {
    it("returns true when registered", () => {
      client.register({
        extensionVersion: "1.2.0",
        browserInfo: "Chrome 120",
        capabilities: [],
        tenantId: "acme-corp",
      });
      expect(client.isRegistered()).toBe(true);
    });

    it("returns false when not registered", () => {
      expect(client.isRegistered()).toBe(false);
    });
  });
});
