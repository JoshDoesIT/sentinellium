/**
 * @module Audit Logger Tests
 * @description TDD tests for immutable IAM audit logging.
 * Logs role changes, user CRUD, tenant config, and API key operations.
 * Queryable by actor, action type, and time range.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { AuditLogger, AuditAction } from "./audit-logger";

describe("AuditLogger", () => {
  let logger: AuditLogger;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
    logger = new AuditLogger();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /* ── Action Types ── */

  describe("action types", () => {
    it("defines all IAM audit actions", () => {
      expect(AuditAction.USER_CREATED).toBe("USER_CREATED");
      expect(AuditAction.USER_DELETED).toBe("USER_DELETED");
      expect(AuditAction.ROLE_CHANGED).toBe("ROLE_CHANGED");
      expect(AuditAction.API_KEY_CREATED).toBe("API_KEY_CREATED");
      expect(AuditAction.API_KEY_REVOKED).toBe("API_KEY_REVOKED");
      expect(AuditAction.TENANT_CONFIGURED).toBe("TENANT_CONFIGURED");
      expect(AuditAction.LOGIN).toBe("LOGIN");
      expect(AuditAction.LOGOUT).toBe("LOGOUT");
    });
  });

  /* ── Logging ── */

  describe("log", () => {
    it("appends an audit entry with timestamp", () => {
      logger.log({
        actor: "admin@acme.com",
        action: AuditAction.USER_CREATED,
        target: "bob@acme.com",
        tenantId: "acme-corp",
      });

      const entries = logger.getAll();
      expect(entries).toHaveLength(1);
      expect(entries[0]!.timestamp).toBe(Date.now());
    });

    it("assigns sequential IDs", () => {
      logger.log({
        actor: "admin@acme.com",
        action: AuditAction.USER_CREATED,
        target: "bob@acme.com",
        tenantId: "acme-corp",
      });
      logger.log({
        actor: "admin@acme.com",
        action: AuditAction.ROLE_CHANGED,
        target: "bob@acme.com",
        tenantId: "acme-corp",
      });

      const entries = logger.getAll();
      expect(entries[0]!.id).not.toBe(entries[1]!.id);
    });

    it("stores optional metadata", () => {
      logger.log({
        actor: "admin@acme.com",
        action: AuditAction.ROLE_CHANGED,
        target: "bob@acme.com",
        tenantId: "acme-corp",
        metadata: { from: "VIEWER", to: "ANALYST" },
      });

      expect(logger.getAll()[0]!.metadata).toEqual({
        from: "VIEWER",
        to: "ANALYST",
      });
    });
  });

  /* ── Immutability ── */

  describe("immutability", () => {
    it("returns copies that cannot mutate the log", () => {
      logger.log({
        actor: "admin@acme.com",
        action: AuditAction.USER_CREATED,
        target: "bob@acme.com",
        tenantId: "acme-corp",
      });

      const entries = logger.getAll();
      entries.pop();
      expect(logger.getAll()).toHaveLength(1);
    });
  });

  /* ── Query by Actor ── */

  describe("queryByActor", () => {
    it("returns entries for a specific actor", () => {
      logger.log({
        actor: "admin@acme.com",
        action: AuditAction.USER_CREATED,
        target: "bob@acme.com",
        tenantId: "acme-corp",
      });
      logger.log({
        actor: "other@acme.com",
        action: AuditAction.LOGIN,
        target: "other@acme.com",
        tenantId: "acme-corp",
      });

      const results = logger.queryByActor("admin@acme.com");
      expect(results).toHaveLength(1);
      expect(results[0]!.actor).toBe("admin@acme.com");
    });
  });

  /* ── Query by Action ── */

  describe("queryByAction", () => {
    it("filters entries by action type", () => {
      logger.log({
        actor: "admin@acme.com",
        action: AuditAction.USER_CREATED,
        target: "a@acme.com",
        tenantId: "acme-corp",
      });
      logger.log({
        actor: "admin@acme.com",
        action: AuditAction.USER_CREATED,
        target: "b@acme.com",
        tenantId: "acme-corp",
      });
      logger.log({
        actor: "admin@acme.com",
        action: AuditAction.ROLE_CHANGED,
        target: "a@acme.com",
        tenantId: "acme-corp",
      });

      const results = logger.queryByAction(AuditAction.USER_CREATED);
      expect(results).toHaveLength(2);
    });
  });

  /* ── Query by Time Range ── */

  describe("queryByTimeRange", () => {
    it("returns entries within a time window", () => {
      logger.log({
        actor: "admin@acme.com",
        action: AuditAction.LOGIN,
        target: "admin@acme.com",
        tenantId: "acme-corp",
      });

      vi.advanceTimersByTime(60_000);
      logger.log({
        actor: "admin@acme.com",
        action: AuditAction.USER_CREATED,
        target: "bob@acme.com",
        tenantId: "acme-corp",
      });

      const start = Date.now() - 1000;
      const end = Date.now() + 1000;
      const results = logger.queryByTimeRange(start, end);
      expect(results).toHaveLength(1);
      expect(results[0]!.action).toBe(AuditAction.USER_CREATED);
    });
  });

  /* ── Query by Tenant ── */

  describe("queryByTenant", () => {
    it("scopes results to a single tenant", () => {
      logger.log({
        actor: "admin@acme.com",
        action: AuditAction.USER_CREATED,
        target: "bob@acme.com",
        tenantId: "acme-corp",
      });
      logger.log({
        actor: "admin@other.com",
        action: AuditAction.USER_CREATED,
        target: "carol@other.com",
        tenantId: "other-corp",
      });

      const results = logger.queryByTenant("acme-corp");
      expect(results).toHaveLength(1);
    });
  });
});
