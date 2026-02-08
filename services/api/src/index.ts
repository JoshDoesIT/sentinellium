/**
 * @module @sentinellium/api
 * @description Sentinellium API service — edge-first HTTP API built with Hono.
 *
 * Handles alert ingestion, extension registration, policy distribution,
 * and telemetry collection for the enterprise management console.
 *
 * All routes are backed by engine singletons from @sentinellium/engines,
 * seeded with realistic demo data on startup.
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";

import { seed } from "./lib/seed";
import alertsRoutes from "./routes/alerts";
import fleetRoutes from "./routes/fleet";
import dashboardRoutes from "./routes/dashboard";
import usersRoutes from "./routes/users";
import auditRoutes from "./routes/audit";

// ─── Seed Demo Data ─────────────────────────────────────────────────

seed();

// ─── App Setup ──────────────────────────────────────────────────────

const app = new Hono();

// ─── Global Middleware ──────────────────────────────────────────────

app.use("*", logger());
app.use("*", secureHeaders());
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "http://localhost:3456"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  }),
);

// ─── Health Check ───────────────────────────────────────────────────

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    service: "sentinellium-api",
    timestamp: new Date().toISOString(),
  });
});

// ─── Root ───────────────────────────────────────────────────────────

app.get("/", (c) => {
  return c.json({
    name: "Sentinellium API",
    version: "0.1.0",
    description: "The Client-Side, Privacy-Preserving AI Defense Grid",
  });
});

// ─── API Routes ─────────────────────────────────────────────────────

app.route("/api/alerts", alertsRoutes);
app.route("/api/fleet", fleetRoutes);
app.route("/api/dashboard", dashboardRoutes);
app.route("/api/users", usersRoutes);
app.route("/api/audit", auditRoutes);

// ─── Start Server ───────────────────────────────────────────────────

const port = Number(process.env["PORT"] ?? 4000);

if (process.env["NODE_ENV"] !== "test") {
  serve({ fetch: app.fetch, port }, (info) => {
    console.log(
      `🛡️  Sentinellium API running on http://localhost:${info.port}`,
    );
  });
}

export default app;
export { app };
