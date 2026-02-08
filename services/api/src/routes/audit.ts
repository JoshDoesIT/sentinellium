/**
 * @module Audit API
 * @description Endpoints for audit log retrieval and event logging.
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { auditLog, addAuditEntry } from "../lib/state";

const app = new Hono();

/* ── Validation Schemas ── */

const auditInputSchema = z.object({
  actor: z.string().min(1),
  action: z.string().min(1),
  target: z.string().min(1),
  ipAddress: z.string().default("127.0.0.1"),
});

const filterSchema = z.object({
  action: z.string().optional(),
  search: z.string().optional(),
});

/* ── Routes ── */

/** List audit log entries with optional filtering. */
app.get("/", (c) => {
  const params = Object.fromEntries(new URL(c.req.url).searchParams);
  const filter = filterSchema.parse(params);

  let entries = [...auditLog];

  if (filter.action) {
    entries = entries.filter((e) => e.action === filter.action);
  }

  if (filter.search) {
    const q = filter.search.toLowerCase();
    entries = entries.filter(
      (e) =>
        e.actor.toLowerCase().includes(q) ||
        e.target.toLowerCase().includes(q) ||
        e.action.toLowerCase().includes(q),
    );
  }

  return c.json({
    success: true,
    data: entries,
  });
});

/** Log a new audit event. */
app.post("/", zValidator("json", auditInputSchema), (c) => {
  const input = c.req.valid("json");
  const entry = addAuditEntry({
    timestamp: new Date().toISOString(),
    ...input,
  });

  return c.json({ success: true, data: entry }, 201);
});

export default app;
