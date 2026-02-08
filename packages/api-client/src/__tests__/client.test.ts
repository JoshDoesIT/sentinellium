/**
 * @module API Client Unit Tests
 * @description Tests for the SentinelliumClient class — request handling,
 * error paths, query string construction, and all endpoint methods.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SentinelliumClient } from "../index";

const BASE_URL = "http://localhost:4000";

describe("SentinelliumClient", () => {
  let client: SentinelliumClient;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    client = new SentinelliumClient(BASE_URL);
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.stubGlobal("fetch", originalFetch);
  });

  /* ── Helper ── */

  function mockResponse(data: unknown, status = 200) {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data }), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
    );
  }

  function mockError(code: string, message: string, status = 200) {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ success: false, error: { code, message } }),
        { status, headers: { "Content-Type": "application/json" } },
      ),
    );
  }

  function mockHttpError(status: number, statusText: string) {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(null, { status, statusText }),
    );
  }

  function lastFetchUrl(): string {
    return vi.mocked(globalThis.fetch).mock.calls[0]?.[0] as string;
  }

  /* ── Constructor ── */

  describe("constructor", () => {
    it("should accept a base URL", () => {
      const c = new SentinelliumClient("http://example.com");
      expect(c).toBeInstanceOf(SentinelliumClient);
    });
  });

  /* ── Error Handling ── */

  describe("request error handling", () => {
    it("should throw on HTTP error (non-2xx)", async () => {
      mockHttpError(500, "Internal Server Error");
      await expect(client.getDashboard()).rejects.toThrow(/500/);
    });

    it("should throw on HTTP 404", async () => {
      mockHttpError(404, "Not Found");
      await expect(client.getDashboard()).rejects.toThrow(/404/);
    });

    it("should throw on success: false with error message", async () => {
      mockError("AUTH_REQUIRED", "Authentication required");
      await expect(client.getDashboard()).rejects.toThrow(
        "Authentication required",
      );
    });

    it("should throw generic message when no error details", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ success: false }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
      await expect(client.getDashboard()).rejects.toThrow("Unknown API error");
    });

    it("should throw on network failure", async () => {
      vi.mocked(globalThis.fetch).mockRejectedValueOnce(
        new Error("Network error"),
      );
      await expect(client.getDashboard()).rejects.toThrow("Network error");
    });
  });

  /* ── Health ── */

  describe("health", () => {
    it("should call /health endpoint directly (no envelope)", async () => {
      // health() bypasses request() — calls fetch directly and returns raw JSON
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status: "ok",
            service: "sentinellium-api",
            timestamp: "",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
      const result = await client.health();
      expect(lastFetchUrl()).toBe(`${BASE_URL}/health`);
      expect(result.status).toBe("ok");
      expect(result.service).toBe("sentinellium-api");
    });
  });

  /* ── Dashboard ── */

  describe("getDashboard", () => {
    it("should call /api/dashboard endpoint", async () => {
      const data = {
        engines: {},
        totalAlerts: 5,
        threatsBlocked: 1,
        pagesScanned: 100,
        connectedInstances: 2,
        lastUpdated: "",
        severityCounts: {},
      };
      mockResponse(data);
      const result = await client.getDashboard();
      expect(lastFetchUrl()).toBe(`${BASE_URL}/api/dashboard`);
      expect(result.totalAlerts).toBe(5);
    });
  });

  describe("getTimeline", () => {
    it("should call /api/dashboard/timeline endpoint", async () => {
      const data = {
        buckets: [],
        trend: { direction: "stable", recentCount: 0, previousCount: 0 },
      };
      mockResponse(data);
      const result = await client.getTimeline();
      expect(lastFetchUrl()).toBe(`${BASE_URL}/api/dashboard/timeline`);
      expect(result.trend.direction).toBe("stable");
    });
  });

  describe("getGeoHeatmap", () => {
    it("should call /api/dashboard/geo endpoint", async () => {
      const data = [{ region: "US", count: 5 }];
      mockResponse(data);
      const result = await client.getGeoHeatmap();
      expect(lastFetchUrl()).toBe(`${BASE_URL}/api/dashboard/geo`);
      expect(result).toHaveLength(1);
    });
  });

  /* ── Alerts ── */

  describe("getAlerts", () => {
    it("should call /api/alerts with no params by default", async () => {
      mockResponse({ items: [], currentPage: 1, totalPages: 0, totalItems: 0 });
      await client.getAlerts();
      expect(lastFetchUrl()).toBe(`${BASE_URL}/api/alerts`);
    });

    it("should include source filter in query string", async () => {
      mockResponse({ items: [], currentPage: 1, totalPages: 0, totalItems: 0 });
      await client.getAlerts({ source: "PHISHING" });
      expect(lastFetchUrl()).toContain("source=PHISHING");
    });

    it("should include multiple filters", async () => {
      mockResponse({ items: [], currentPage: 1, totalPages: 0, totalItems: 0 });
      await client.getAlerts({ source: "DLP", page: 2, pageSize: 25 });
      const url = lastFetchUrl();
      expect(url).toContain("source=DLP");
      expect(url).toContain("page=2");
      expect(url).toContain("pageSize=25");
    });

    it("should omit undefined filters", async () => {
      mockResponse({ items: [], currentPage: 1, totalPages: 0, totalItems: 0 });
      await client.getAlerts({ source: "C2PA" });
      const url = lastFetchUrl();
      expect(url).not.toContain("page=");
      expect(url).not.toContain("minSeverity=");
    });
  });

  describe("getAlertById", () => {
    it("should call /api/alerts/:id", async () => {
      mockResponse({ alertId: "alert-1", summary: "", evidence: [] });
      const result = await client.getAlertById("alert-1");
      expect(lastFetchUrl()).toBe(`${BASE_URL}/api/alerts/alert-1`);
      expect(result.alertId).toBe("alert-1");
    });
  });

  describe("ingestAlert", () => {
    it("should POST to /api/alerts", async () => {
      mockResponse({ message: "Alert ingested" });
      await client.ingestAlert({
        source: "PHISHING",
        severity: "HIGH",
        title: "Test",
        domain: "example.com",
        url: "https://example.com",
      });
      const [url, init] = vi.mocked(globalThis.fetch).mock.calls[0]!;
      expect(url).toBe(`${BASE_URL}/api/alerts`);
      expect((init as RequestInit).method).toBe("POST");
    });
  });

  describe("getAlertsBySeverity", () => {
    it("should call /api/alerts/stats/severity", async () => {
      mockResponse({ CRITICAL: 2, HIGH: 5 });
      const result = await client.getAlertsBySeverity();
      expect(lastFetchUrl()).toBe(`${BASE_URL}/api/alerts/stats/severity`);
      expect(result.CRITICAL).toBe(2);
    });
  });

  describe("getAlertsBySource", () => {
    it("should call /api/alerts/stats/source", async () => {
      mockResponse({ PHISHING: 6, DLP: 4 });
      const result = await client.getAlertsBySource();
      expect(lastFetchUrl()).toBe(`${BASE_URL}/api/alerts/stats/source`);
      expect(result.PHISHING).toBe(6);
    });
  });

  /* ── Fleet ── */

  describe("getFleet", () => {
    it("should call /api/fleet", async () => {
      mockResponse({ instances: [], stats: { total: 0, online: 0 } });
      const result = await client.getFleet();
      expect(lastFetchUrl()).toBe(`${BASE_URL}/api/fleet`);
      expect(result.instances).toEqual([]);
    });
  });

  describe("registerInstance", () => {
    it("should POST to /api/fleet/register", async () => {
      mockResponse({ instanceId: "new-inst" });
      await client.registerInstance({
        instanceId: "new-inst",
        hostname: "ws-1",
        browser: "Chrome 121",
        version: "1.0.0",
      });
      const [url, init] = vi.mocked(globalThis.fetch).mock.calls[0]!;
      expect(url).toBe(`${BASE_URL}/api/fleet/register`);
      expect((init as RequestInit).method).toBe("POST");
    });
  });

  /* ── Users ── */

  describe("getUsers", () => {
    it("should call /api/users", async () => {
      mockResponse([{ id: "usr-01", name: "Test" }]);
      const result = await client.getUsers();
      expect(lastFetchUrl()).toBe(`${BASE_URL}/api/users`);
      expect(result).toHaveLength(1);
    });
  });

  describe("createUser", () => {
    it("should POST to /api/users", async () => {
      mockResponse({ id: "usr-02", name: "New User", role: "Viewer" });
      const result = await client.createUser({
        name: "New User",
        email: "new@test.io",
        role: "Viewer",
      });
      const [url, init] = vi.mocked(globalThis.fetch).mock.calls[0]!;
      expect(url).toBe(`${BASE_URL}/api/users`);
      expect((init as RequestInit).method).toBe("POST");
      expect(result.name).toBe("New User");
    });
  });

  /* ── Audit ── */

  describe("getAuditLog", () => {
    it("should call /api/audit with no params by default", async () => {
      mockResponse([]);
      await client.getAuditLog();
      expect(lastFetchUrl()).toBe(`${BASE_URL}/api/audit`);
    });

    it("should include action filter in query string", async () => {
      mockResponse([]);
      await client.getAuditLog({ action: "LOGIN" });
      expect(lastFetchUrl()).toContain("action=LOGIN");
    });
  });
});
