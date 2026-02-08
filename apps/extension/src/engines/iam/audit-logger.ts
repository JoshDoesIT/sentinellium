/**
 * @module Audit Logger
 * @description Immutable append-only log for IAM administrative actions.
 * Records role changes, user CRUD, tenant config, and API key operations.
 * Queryable by actor, action type, time range, and tenant.
 */

/* ── Types ── */

/** IAM audit action types. */
export const AuditAction = {
  USER_CREATED: "USER_CREATED",
  USER_DELETED: "USER_DELETED",
  ROLE_CHANGED: "ROLE_CHANGED",
  API_KEY_CREATED: "API_KEY_CREATED",
  API_KEY_REVOKED: "API_KEY_REVOKED",
  TENANT_CONFIGURED: "TENANT_CONFIGURED",
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
} as const;

export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

/** Input for creating an audit entry. */
export interface AuditInput {
  actor: string;
  action: AuditAction;
  target: string;
  tenantId: string;
  metadata?: Record<string, unknown>;
}

/** An immutable audit log entry. */
export interface AuditEntry {
  id: string;
  actor: string;
  action: AuditAction;
  target: string;
  tenantId: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/* ── Logger ── */

/**
 * Append-only audit log for IAM operations.
 * Entries are immutable once written.
 */
export class AuditLogger {
  private readonly entries: AuditEntry[] = [];
  private nextId = 1;

  /**
   * Append an audit entry to the log.
   *
   * @param input - Audit event fields
   */
  log(input: AuditInput): void {
    this.entries.push({
      id: `audit-${String(this.nextId++).padStart(5, "0")}`,
      actor: input.actor,
      action: input.action,
      target: input.target,
      tenantId: input.tenantId,
      timestamp: Date.now(),
      metadata: input.metadata ? { ...input.metadata } : undefined,
    });
  }

  /** Get all audit entries (defensive copy). */
  getAll(): AuditEntry[] {
    return this.entries.map((e) => ({ ...e }));
  }

  /**
   * Query entries by actor.
   *
   * @param actor - Actor email/ID to filter by
   */
  queryByActor(actor: string): AuditEntry[] {
    return this.entries.filter((e) => e.actor === actor).map((e) => ({ ...e }));
  }

  /**
   * Query entries by action type.
   *
   * @param action - Audit action to filter by
   */
  queryByAction(action: AuditAction): AuditEntry[] {
    return this.entries
      .filter((e) => e.action === action)
      .map((e) => ({ ...e }));
  }

  /**
   * Query entries within a time range (inclusive).
   *
   * @param start - Start timestamp (ms)
   * @param end - End timestamp (ms)
   */
  queryByTimeRange(start: number, end: number): AuditEntry[] {
    return this.entries
      .filter((e) => e.timestamp >= start && e.timestamp <= end)
      .map((e) => ({ ...e }));
  }

  /**
   * Query entries scoped to a specific tenant.
   *
   * @param tenantId - Tenant ID to filter by
   */
  queryByTenant(tenantId: string): AuditEntry[] {
    return this.entries
      .filter((e) => e.tenantId === tenantId)
      .map((e) => ({ ...e }));
  }
}
