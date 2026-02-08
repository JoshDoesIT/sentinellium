/**
 * @module Policy Audit Log
 * @description Records all policy changes for compliance and governance.
 * Supports filtering by policy ID and action type.
 */

/* ── Types ── */

/** Audit action types. */
export enum AuditAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  DISTRIBUTE = "DISTRIBUTE",
  ROLLBACK = "ROLLBACK",
}

/** Audit log entry. */
export interface AuditEntry {
  id: string;
  action: AuditAction;
  policyId: string;
  actor: string;
  details: string;
  timestamp: string;
}

/** Audit entry input (without auto-generated fields). */
export interface AuditInput {
  action: AuditAction;
  policyId: string;
  actor: string;
  details: string;
}

/* ── Log ── */

/**
 * Immutable audit log for policy governance.
 */
export class PolicyAuditLog {
  private readonly entries: AuditEntry[] = [];
  private nextId = 1;

  /**
   * Record an audit entry.
   *
   * @param input - Audit data
   */
  record(input: AuditInput): void {
    this.entries.push({
      id: `audit-${this.nextId++}`,
      ...input,
      timestamp: new Date().toISOString(),
    });
  }

  /** Get all entries (reverse chronological). */
  getAll(): readonly AuditEntry[] {
    return [...this.entries].reverse();
  }

  /**
   * Filter entries by policy ID.
   *
   * @param policyId - Policy ID
   * @returns Matching entries
   */
  getByPolicy(policyId: string): AuditEntry[] {
    return this.entries.filter((e) => e.policyId === policyId);
  }

  /**
   * Filter entries by action type.
   *
   * @param action - Audit action
   * @returns Matching entries
   */
  getByAction(action: AuditAction): AuditEntry[] {
    return this.entries.filter((e) => e.action === action);
  }
}
