/**
 * @module Service Registry Tests
 * @description TDD tests for service discovery, registration, and heartbeat liveness.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { ServiceRegistry, ServiceStatus } from "./service-registry";

describe("ServiceRegistry", () => {
  let registry: ServiceRegistry;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
    registry = new ServiceRegistry({ heartbeatTimeoutMs: 30_000 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("register", () => {
    it("registers a service with endpoint and version", () => {
      registry.register({
        name: "alert-service",
        endpoint: "http://localhost:3001",
        version: "1.0.0",
      });

      const service = registry.get("alert-service");
      expect(service).toBeDefined();
      expect(service!.endpoint).toBe("http://localhost:3001");
      expect(service!.status).toBe(ServiceStatus.HEALTHY);
    });

    it("updates existing service on re-register", () => {
      registry.register({
        name: "alert-service",
        endpoint: "http://localhost:3001",
        version: "1.0.0",
      });
      registry.register({
        name: "alert-service",
        endpoint: "http://localhost:3002",
        version: "1.1.0",
      });

      expect(registry.get("alert-service")!.endpoint).toBe(
        "http://localhost:3002",
      );
    });
  });

  describe("heartbeat", () => {
    it("updates lastHeartbeat timestamp", () => {
      registry.register({
        name: "alert-service",
        endpoint: "http://localhost:3001",
        version: "1.0.0",
      });

      vi.advanceTimersByTime(10_000);
      registry.heartbeat("alert-service");

      expect(registry.get("alert-service")!.lastHeartbeat).toBe(Date.now());
    });

    it("marks service unhealthy after timeout", () => {
      registry.register({
        name: "alert-service",
        endpoint: "http://localhost:3001",
        version: "1.0.0",
      });

      vi.advanceTimersByTime(31_000);
      registry.checkHealth();

      expect(registry.get("alert-service")!.status).toBe(
        ServiceStatus.UNHEALTHY,
      );
    });

    it("keeps service healthy within timeout", () => {
      registry.register({
        name: "alert-service",
        endpoint: "http://localhost:3001",
        version: "1.0.0",
      });

      vi.advanceTimersByTime(20_000);
      registry.heartbeat("alert-service");
      registry.checkHealth();

      expect(registry.get("alert-service")!.status).toBe(ServiceStatus.HEALTHY);
    });
  });

  describe("deregister", () => {
    it("removes a service", () => {
      registry.register({
        name: "alert-service",
        endpoint: "http://localhost:3001",
        version: "1.0.0",
      });
      registry.deregister("alert-service");

      expect(registry.get("alert-service")).toBeUndefined();
    });
  });

  describe("listAll", () => {
    it("returns all registered services", () => {
      registry.register({
        name: "alerts",
        endpoint: "http://localhost:3001",
        version: "1.0.0",
      });
      registry.register({
        name: "policies",
        endpoint: "http://localhost:3002",
        version: "1.0.0",
      });

      expect(registry.listAll()).toHaveLength(2);
    });
  });

  describe("getHealthy", () => {
    it("returns only healthy services", () => {
      registry.register({
        name: "alerts",
        endpoint: "http://localhost:3001",
        version: "1.0.0",
      });
      registry.register({
        name: "policies",
        endpoint: "http://localhost:3002",
        version: "1.0.0",
      });

      vi.advanceTimersByTime(31_000);
      registry.heartbeat("alerts");
      registry.checkHealth();

      const healthy = registry.getHealthy();
      expect(healthy).toHaveLength(1);
      expect(healthy[0]!.name).toBe("alerts");
    });
  });
});
