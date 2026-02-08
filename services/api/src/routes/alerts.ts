/**
 * @module Alerts API
 * @description CRUD endpoints for alert management.
 * Wired to the AlertAggregator, AlertFeed, and AlertDetailBuilder engines.
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { type AlertSource, type AlertSeverity } from "@sentinellium/engines";
import { aggregator, alertFeed, alertDetail, ingestAlert } from "../lib/state";

const app = new Hono();

/* ── Validation Schemas ── */

const alertInputSchema = z.object({
  source: z.enum(["PHISHING", "C2PA", "DLP"]),
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]),
  title: z.string().min(1),
  domain: z.string().min(1),
  url: z.string().url(),
});

const filterSchema = z.object({
  source: z.enum(["PHISHING", "C2PA", "DLP"]).optional(),
  minSeverity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

/* ── Routes ── */

/** List alerts with filtering and pagination. */
app.get("/", (c) => {
  const query = filterSchema.parse(
    Object.fromEntries(new URL(c.req.url).searchParams),
  );
  const { page, pageSize, ...filter } = query;

  let alerts = aggregator.getSorted();

  // Apply filters via AlertFeed engine
  if (filter.source || filter.minSeverity || filter.search) {
    alerts = alertFeed.filter(alerts, {
      source: filter.source as AlertSource | undefined,
      minSeverity: filter.minSeverity as AlertSeverity | undefined,
      search: filter.search,
    });
  }

  // Paginate
  const result = alertFeed.paginate(alerts, { page, pageSize });

  return c.json({
    success: true,
    data: result,
  });
});

/** Get alert counts by severity. */
app.get("/stats/severity", (c) => {
  return c.json({
    success: true,
    data: aggregator.countsBySeverity(),
  });
});

/** Get alert counts by source engine. */
app.get("/stats/source", (c) => {
  return c.json({
    success: true,
    data: aggregator.countsBySource(),
  });
});

/** Get a single alert by ID with full detail. */
app.get("/:id", (c) => {
  const id = c.req.param("id");
  const alert = aggregator.getAll().find((a) => a.id === id);

  if (!alert) {
    return c.json(
      {
        success: false,
        error: { code: "NOT_FOUND", message: "Alert not found" },
      },
      404,
    );
  }

  const detail = alertDetail.build(alert);
  const summary = alertDetail.buildSummary(alert);
  const evidence = alertDetail.buildEvidenceLinks(alert);

  return c.json({
    success: true,
    data: { ...detail, summary, evidence },
  });
});

/** Ingest a new alert from an extension instance. */
app.post("/", zValidator("json", alertInputSchema), (c) => {
  const input = c.req.valid("json");
  ingestAlert(input as Parameters<typeof ingestAlert>[0]);

  return c.json({ success: true, data: { message: "Alert ingested" } }, 201);
});

export default app;
