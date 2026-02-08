/**
 * @module Policy Audit Log Tests
 * @description TDD tests for the policy audit log.
 * Records all policy changes for compliance and governance.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { PolicyAuditLog, AuditAction } from "./policy-audit-log";

describe("Policy Audit Log", () => {
  let log: PolicyAuditLog;

  beforeEach(() => {
    log = new PolicyAuditLog();
  });

  /* ── Initialization ── */

  describe("initialization", () => {
    it("creates an instance", () => {
      expect(log).toBeInstanceOf(PolicyAuditLog);
    });

    it("starts empty", () => {
      expect(log.getAll()).toHaveLength(0);
    });
  });

  /* ── Recording ── */

  describe("recording", () => {
    it("records a policy creation", () => {
      log.record({
        action: AuditAction.CREATE,
        policyId: "pol-001",
        actor: "admin@corp.com",
        details: "Created default policy",
      });

      expect(log.getAll()).toHaveLength(1);
    });

    it("records a policy update", () => {
      log.record({
        action: AuditAction.UPDATE,
        policyId: "pol-001",
        actor: "admin@corp.com",
        details: "Changed sensitivity to critical",
      });

      const entries = log.getAll();
      expect(entries[0]?.action).toBe(AuditAction.UPDATE);
    });

    it("auto-timestamps entries", () => {
      log.record({
        action: AuditAction.CREATE,
        policyId: "pol-001",
        actor: "admin@corp.com",
        details: "",
      });

      expect(log.getAll()[0]?.timestamp).toBeDefined();
    });
  });

  /* ── Querying ── */

  describe("querying", () => {
    it("filters by policy ID", () => {
      log.record({
        action: AuditAction.CREATE,
        policyId: "pol-001",
        actor: "a",
        details: "",
      });
      log.record({
        action: AuditAction.CREATE,
        policyId: "pol-002",
        actor: "b",
        details: "",
      });

      const entries = log.getByPolicy("pol-001");
      expect(entries).toHaveLength(1);
    });

    it("filters by action type", () => {
      log.record({
        action: AuditAction.CREATE,
        policyId: "pol-001",
        actor: "a",
        details: "",
      });
      log.record({
        action: AuditAction.DELETE,
        policyId: "pol-001",
        actor: "a",
        details: "",
      });

      const entries = log.getByAction(AuditAction.DELETE);
      expect(entries).toHaveLength(1);
    });

    it("returns entries in reverse chronological order", () => {
      log.record({
        action: AuditAction.CREATE,
        policyId: "pol-001",
        actor: "a",
        details: "first",
      });
      log.record({
        action: AuditAction.UPDATE,
        policyId: "pol-001",
        actor: "a",
        details: "second",
      });

      const entries = log.getAll();
      expect(entries[0]?.details).toBe("second");
    });
  });
});
