/**
 * @module Console API Client Tests
 * @description Unit tests for the console's API fetch helpers and formatting utilities.
 * Tests the apiFetch wrapper, query string construction, and time formatting.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatTime, relativeTime } from "./api";

/* ── Formatting Helpers ── */

describe("formatTime", () => {
  it("should format a valid ISO string to readable date", () => {
    const result = formatTime("2025-06-15T14:30:00.000Z");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
    // Should contain some date components
    expect(result).toMatch(/2025/);
  });

  it("should return original string for invalid input", () => {
    const result = formatTime("not-a-date");
    expect(typeof result).toBe("string");
  });

  it("should handle empty string gracefully", () => {
    const result = formatTime("");
    expect(typeof result).toBe("string");
  });

  it("should format ISO string with timezone offset", () => {
    const result = formatTime("2025-03-10T08:00:00-05:00");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("relativeTime", () => {
  it('should return "Just now" for timestamps less than 1 minute ago', () => {
    const tenSecsAgo = new Date(Date.now() - 10_000).toISOString();
    expect(relativeTime(tenSecsAgo)).toBe("Just now");
  });

  it('should return "Just now" for current time', () => {
    const now = new Date().toISOString();
    expect(relativeTime(now)).toBe("Just now");
  });

  it("should return minutes for timestamps < 1 hour ago", () => {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60_000).toISOString();
    expect(relativeTime(thirtyMinsAgo)).toBe("30m ago");
  });

  it("should return 1m ago for exactly 1 minute", () => {
    const oneMinAgo = new Date(Date.now() - 60_000).toISOString();
    expect(relativeTime(oneMinAgo)).toBe("1m ago");
  });

  it("should return 59m ago for 59 minutes", () => {
    const fiftyNineMins = new Date(Date.now() - 59 * 60_000).toISOString();
    expect(relativeTime(fiftyNineMins)).toBe("59m ago");
  });

  it("should return hours for timestamps < 24 hours ago", () => {
    const sixHoursAgo = new Date(Date.now() - 6 * 3_600_000).toISOString();
    expect(relativeTime(sixHoursAgo)).toBe("6h ago");
  });

  it("should return 1h for exactly 60 minutes", () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60_000).toISOString();
    expect(relativeTime(oneHourAgo)).toBe("1h ago");
  });

  it("should return days for timestamps > 24 hours ago", () => {
    const twoDaysAgo = new Date(Date.now() - 48 * 3_600_000).toISOString();
    expect(relativeTime(twoDaysAgo)).toBe("2d ago");
  });

  it("should return 1d for exactly 24 hours", () => {
    const oneDayAgo = new Date(Date.now() - 24 * 3_600_000).toISOString();
    expect(relativeTime(oneDayAgo)).toBe("1d ago");
  });

  it("should handle large time differences", () => {
    const ninetyDaysAgo = new Date(
      Date.now() - 90 * 24 * 3_600_000,
    ).toISOString();
    expect(relativeTime(ninetyDaysAgo)).toBe("90d ago");
  });
});

/* ── apiFetch & Fetch Wrappers ── */

describe("apiFetch (via fetchDashboard)", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.stubGlobal("fetch", originalFetch);
  });

  it("should throw on non-200 response", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(null, { status: 500, statusText: "Internal Server Error" }),
    );

    // Dynamically import to use the stubbed fetch
    const { fetchDashboard } = await import("./api");
    await expect(fetchDashboard()).rejects.toThrow("API 500");
  });

  it("should throw on success: false response", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          error: { code: "ERR", message: "Something failed" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const { fetchDashboard } = await import("./api");
    await expect(fetchDashboard()).rejects.toThrow("Something failed");
  });

  it("should throw generic error when no error message in success: false", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ success: false }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const { fetchDashboard } = await import("./api");
    await expect(fetchDashboard()).rejects.toThrow("Unknown API error");
  });

  it("should return data on success", async () => {
    const mockData = {
      engines: {},
      totalAlerts: 5,
      threatsBlocked: 1,
      pagesScanned: 100,
      connectedInstances: 2,
      lastUpdated: "",
      severityCounts: {},
    };
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: mockData }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const { fetchDashboard } = await import("./api");
    const result = await fetchDashboard();
    expect(result).toEqual(mockData);
  });
});

describe("fetchAlerts query string construction", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            data: { items: [], currentPage: 1, totalPages: 0, totalItems: 0 },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
  });

  afterEach(() => {
    vi.stubGlobal("fetch", originalFetch);
  });

  it("should send no query params when none provided", async () => {
    const { fetchAlerts } = await import("./api");
    await fetchAlerts();
    const url = vi.mocked(globalThis.fetch).mock.calls[0]?.[0] as string;
    expect(url).toMatch(/\/api\/alerts$/);
  });

  it("should include source filter in query string", async () => {
    const { fetchAlerts } = await import("./api");
    await fetchAlerts({ source: "PHISHING" });
    const url = vi.mocked(globalThis.fetch).mock.calls[0]?.[0] as string;
    expect(url).toContain("source=PHISHING");
  });

  it("should include multiple params in query string", async () => {
    const { fetchAlerts } = await import("./api");
    await fetchAlerts({ source: "DLP", page: 2, pageSize: 25 });
    const url = vi.mocked(globalThis.fetch).mock.calls[0]?.[0] as string;
    expect(url).toContain("source=DLP");
    expect(url).toContain("page=2");
    expect(url).toContain("pageSize=25");
  });

  it("should omit undefined params", async () => {
    const { fetchAlerts } = await import("./api");
    await fetchAlerts({ source: "C2PA" });
    const url = vi.mocked(globalThis.fetch).mock.calls[0]?.[0] as string;
    expect(url).not.toContain("page=");
    expect(url).not.toContain("minSeverity=");
  });
});
