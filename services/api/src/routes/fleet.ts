/**
 * @module Fleet API
 * @description Endpoints for fleet instance management.
 * Wired to the FleetManager engine.
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { fleet, dashboard } from "../lib/state";

const app = new Hono();

/* ── Validation Schemas ── */

const registerSchema = z.object({
  instanceId: z.string().min(1),
  hostname: z.string().min(1),
  browser: z.string().min(1),
  version: z.string().min(1),
});

/* ── Routes ── */

/** List all fleet instances. */
app.get("/", (c) => {
  const instances = fleet.getAll();
  return c.json({
    success: true,
    data: {
      instances,
      stats: {
        total: fleet.getTotalCount(),
        online: fleet.getOnlineCount(),
      },
    },
  });
});

/** Register a new extension instance. */
app.post("/register", zValidator("json", registerSchema), (c) => {
  const input = c.req.valid("json");
  fleet.register(input);
  dashboard.setInstanceCount(fleet.getOnlineCount());

  return c.json(
    { success: true, data: { message: "Instance registered" } },
    201,
  );
});

/** Record a heartbeat from an instance. */
app.post("/:id/heartbeat", (c) => {
  const id = c.req.param("id");
  fleet.heartbeat(id);
  dashboard.setInstanceCount(fleet.getOnlineCount());

  return c.json({ success: true, data: { message: "Heartbeat recorded" } });
});

/** Remove an instance from the fleet. */
app.delete("/:id", (c) => {
  const id = c.req.param("id");
  fleet.remove(id);
  dashboard.setInstanceCount(fleet.getOnlineCount());

  return c.json({ success: true, data: { message: "Instance removed" } });
});

export default app;
