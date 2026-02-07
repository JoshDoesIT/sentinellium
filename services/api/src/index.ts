/**
 * @module @sentinellium/api
 * @description Sentinellium API service — edge-first HTTP API built with Hono.
 *
 * Handles alert ingestion, extension registration, policy distribution,
 * and telemetry collection for the enterprise management console.
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { logger } from "hono/logger";

const app = new Hono();

// ─── Global Middleware ──────────────────────────────────────────────

app.use("*", logger());
app.use("*", secureHeaders());
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000"],
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

export default app;
export { app };
