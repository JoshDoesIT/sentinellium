/**
 * @module Users API
 * @description CRUD endpoints for user management with RBAC.
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { users, addUser, addAuditEntry } from "../lib/state";

const app = new Hono();

/* ── Validation Schemas ── */

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["Admin", "Analyst", "Viewer"]),
});

const changeRoleSchema = z.object({
  role: z.enum(["Admin", "Analyst", "Viewer"]),
});

/* ── Routes ── */

/** List all users. */
app.get("/", (c) => {
  return c.json({
    success: true,
    data: users,
  });
});

/** Create a new user. */
app.post("/", zValidator("json", createUserSchema), (c) => {
  const input = c.req.valid("json");
  const user = addUser({
    ...input,
    mfaEnabled: false,
    status: "Active",
    lastLogin: new Date().toISOString(),
  });

  addAuditEntry({
    timestamp: new Date().toISOString(),
    actor: "system",
    action: "USER_CREATED",
    target: user.name,
    ipAddress: c.req.header("x-forwarded-for") ?? "127.0.0.1",
  });

  return c.json({ success: true, data: user }, 201);
});

/** Change a user's role. */
app.put("/:id/role", zValidator("json", changeRoleSchema), (c) => {
  const id = c.req.param("id");
  const { role } = c.req.valid("json");
  const user = users.find((u) => u.id === id);

  if (!user) {
    return c.json(
      {
        success: false,
        error: { code: "NOT_FOUND", message: "User not found" },
      },
      404,
    );
  }

  const oldRole = user.role;
  user.role = role;

  addAuditEntry({
    timestamp: new Date().toISOString(),
    actor: "system",
    action: "ROLE_CHANGED",
    target: `${user.name}: ${oldRole} → ${role}`,
    ipAddress: c.req.header("x-forwarded-for") ?? "127.0.0.1",
  });

  return c.json({ success: true, data: user });
});

export default app;
