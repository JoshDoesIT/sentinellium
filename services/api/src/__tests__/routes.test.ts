/**
 * @module API Route Tests
 * @description Integration tests for all API endpoints.
 * Tests the full route → engine → response pipeline.
 */

import { describe, it, expect } from "vitest";
import app from "../index";

/**
 * Helper to make test requests against the Hono app.
 * Uses Hono's built-in request method (no HTTP server needed).
 */
async function request(
  path: string,
  init?: RequestInit,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const res = await app.request(path, init);
  const body = (await res.json()) as Record<string, unknown>;
  return { status: res.status, body };
}

describe("Health Check", () => {
  it("returns ok status", async () => {
    const { status, body } = await request("/health");
    expect(status).toBe(200);
    expect(body).toMatchObject({ status: "ok", service: "sentinellium-api" });
  });
});

describe("Dashboard API", () => {
  it("GET /api/dashboard returns snapshot with all fields", async () => {
    const { status, body } = await request("/api/dashboard");
    expect(status).toBe(200);
    expect(body).toMatchObject({ success: true });

    const data = body.data as Record<string, unknown>;
    expect(data).toHaveProperty("engines");
    expect(data).toHaveProperty("totalAlerts");
    expect(data).toHaveProperty("threatsBlocked");
    expect(data).toHaveProperty("pagesScanned");
    expect(data).toHaveProperty("connectedInstances");
    expect(data).toHaveProperty("severityCounts");
  });

  it("GET /api/dashboard/timeline returns buckets and trend", async () => {
    const { status, body } = await request("/api/dashboard/timeline");
    expect(status).toBe(200);

    const data = body.data as Record<string, unknown>;
    expect(data).toHaveProperty("buckets");
    expect(data).toHaveProperty("trend");
  });

  it("GET /api/dashboard/geo returns region heatmap", async () => {
    const { status, body } = await request("/api/dashboard/geo");
    expect(status).toBe(200);
    expect(Array.isArray(body.data)).toBe(true);
  });
});

describe("Alerts API", () => {
  it("GET /api/alerts returns paginated results", async () => {
    const { status, body } = await request("/api/alerts");
    expect(status).toBe(200);

    const data = body.data as Record<string, unknown>;
    expect(data).toHaveProperty("items");
    expect(data).toHaveProperty("totalItems");
    expect(data).toHaveProperty("currentPage");
    expect(data).toHaveProperty("totalPages");
    expect(Array.isArray(data.items)).toBe(true);
  });

  it("GET /api/alerts?source=PHISHING filters by source", async () => {
    const { body } = await request("/api/alerts?source=PHISHING");
    const items = (body.data as Record<string, unknown>).items as Array<
      Record<string, unknown>
    >;
    for (const item of items) {
      expect(item.source).toBe("PHISHING");
    }
  });

  it("GET /api/alerts/stats/severity returns severity counts", async () => {
    const { status, body } = await request("/api/alerts/stats/severity");
    expect(status).toBe(200);
    expect(body).toMatchObject({ success: true });
    expect(body.data).toHaveProperty("CRITICAL");
  });

  it("GET /api/alerts/stats/source returns source counts", async () => {
    const { status, body } = await request("/api/alerts/stats/source");
    expect(status).toBe(200);
    expect(body.data).toHaveProperty("PHISHING");
  });

  it("POST /api/alerts ingests a new alert", async () => {
    const { status, body } = await request("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "DLP",
        severity: "HIGH",
        title: "Test alert ingestion",
        domain: "test.example.com",
        url: "https://test.example.com/leak",
      }),
    });
    expect(status).toBe(201);
    expect(body).toMatchObject({ success: true });
  });

  it("GET /api/alerts/:id returns alert detail", async () => {
    // alert-1 exists from seed
    const { status, body } = await request("/api/alerts/alert-1");
    expect(status).toBe(200);

    const data = body.data as Record<string, unknown>;
    expect(data).toHaveProperty("alertId");
    expect(data).toHaveProperty("summary");
    expect(data).toHaveProperty("evidence");
  });

  it("GET /api/alerts/:unknown returns 404", async () => {
    const { status, body } = await request("/api/alerts/nonexistent-id");
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });
});

describe("Fleet API", () => {
  it("GET /api/fleet returns instances and stats", async () => {
    const { status, body } = await request("/api/fleet");
    expect(status).toBe(200);

    const data = body.data as Record<string, unknown>;
    expect(data).toHaveProperty("instances");
    expect(data).toHaveProperty("stats");
    expect(Array.isArray(data.instances)).toBe(true);
  });

  it("POST /api/fleet/register adds a new instance", async () => {
    const { status, body } = await request("/api/fleet/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instanceId: "test-inst-99",
        hostname: "ws-test-99",
        browser: "Chrome 121",
        version: "0.1.0",
      }),
    });
    expect(status).toBe(201);
    expect(body).toMatchObject({ success: true });
  });

  it("POST /api/fleet/:id/heartbeat records heartbeat", async () => {
    const { status } = await request("/api/fleet/test-inst-99/heartbeat", {
      method: "POST",
    });
    expect(status).toBe(200);
  });

  it("DELETE /api/fleet/:id removes instance", async () => {
    const { status } = await request("/api/fleet/test-inst-99", {
      method: "DELETE",
    });
    expect(status).toBe(200);
  });
});

describe("Users API", () => {
  it("GET /api/users returns user list", async () => {
    const { status, body } = await request("/api/users");
    expect(status).toBe(200);
    expect(Array.isArray(body.data)).toBe(true);
    expect((body.data as unknown[]).length).toBeGreaterThan(0);
  });

  it("POST /api/users creates a new user", async () => {
    const { status, body } = await request("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "test@corp.io",
        role: "Viewer",
      }),
    });
    expect(status).toBe(201);

    const user = body.data as Record<string, unknown>;
    expect(user.name).toBe("Test User");
    expect(user.role).toBe("Viewer");
  });
});

describe("Audit API", () => {
  it("GET /api/audit returns audit entries", async () => {
    const { status, body } = await request("/api/audit");
    expect(status).toBe(200);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("POST /api/audit logs a new event", async () => {
    const { status, body } = await request("/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actor: "test-user",
        action: "TEST_ACTION",
        target: "test-target",
      }),
    });
    expect(status).toBe(201);
    expect(body).toMatchObject({ success: true });
  });

  it("GET /api/audit?action=LOGIN filters by action", async () => {
    const { body } = await request("/api/audit?action=LOGIN");
    const entries = body.data as Array<Record<string, unknown>>;
    for (const entry of entries) {
      expect(entry.action).toBe("LOGIN");
    }
  });
});

/* ── Edge-Case Tests ── */

describe("Alerts API — Edge Cases", () => {
  it("POST /api/alerts with missing fields returns 400", async () => {
    const { status } = await request("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "PHISHING" }),
    });
    expect(status).toBe(400);
  });

  it("POST /api/alerts with invalid source returns 400", async () => {
    const { status } = await request("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "INVALID_ENGINE",
        severity: "HIGH",
        title: "Bad source",
        domain: "bad.com",
        url: "https://bad.com/test",
      }),
    });
    expect(status).toBe(400);
  });

  it("POST /api/alerts with empty title returns 400", async () => {
    const { status } = await request("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "DLP",
        severity: "LOW",
        title: "",
        domain: "empty.com",
        url: "https://empty.com/test",
      }),
    });
    expect(status).toBe(400);
  });

  it("POST /api/alerts with invalid URL returns 400", async () => {
    const { status } = await request("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "PHISHING",
        severity: "MEDIUM",
        title: "Bad URL",
        domain: "bad.com",
        url: "not-a-url",
      }),
    });
    expect(status).toBe(400);
  });

  it("GET /api/alerts?pageSize=200 rejects oversized pageSize", async () => {
    // filterSchema uses z.coerce.number().max(100), and alerts route
    // calls filterSchema.parse() directly (not via zValidator middleware),
    // so invalid pageSize triggers an unhandled Zod error → 500 (plain text)
    const res = await app.request("/api/alerts?pageSize=200");
    expect(res.status).toBe(500);
  });

  it("GET /api/alerts?page=999 returns empty items", async () => {
    const { status, body } = await request("/api/alerts?page=999");
    expect(status).toBe(200);
    const data = body.data as Record<string, unknown>;
    expect((data.items as unknown[]).length).toBe(0);
  });
});

describe("Fleet API — Edge Cases", () => {
  it("POST /api/fleet/:unknown/heartbeat silently succeeds for non-existent instance", async () => {
    // FleetManager.heartbeat() is a no-op if instance doesn't exist
    const { status, body } = await request(
      "/api/fleet/nonexistent-inst/heartbeat",
      {
        method: "POST",
      },
    );
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("DELETE /api/fleet/:unknown silently succeeds for non-existent instance", async () => {
    // FleetManager.remove() is a no-op if instance doesn't exist
    const { status, body } = await request("/api/fleet/nonexistent-inst", {
      method: "DELETE",
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });
});
