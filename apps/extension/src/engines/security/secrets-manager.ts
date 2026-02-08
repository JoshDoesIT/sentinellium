/**
 * @module Secrets Manager
 * @description Secrets management with key rotation, audit logging,
 * and version history tracking.
 */

/* ── Types ── */

export interface SecretVersion {
  value: string;
  createdAt: number;
}

export interface AuditEntry {
  key: string;
  action: "set" | "get" | "delete" | "rotate";
  timestamp: number;
}

/* ── Manager ── */

/**
 * Secure secrets manager with rotation and audit logging.
 */
export class SecretsManager {
  private readonly secrets = new Map<string, SecretVersion[]>();
  private readonly auditLog: AuditEntry[] = [];

  /**
   * Store a secret.
   *
   * @param key - Secret key
   * @param value - Secret value
   */
  set(key: string, value: string): void {
    const versions = this.secrets.get(key) ?? [];
    versions.push({ value, createdAt: Date.now() });
    this.secrets.set(key, versions);
    this.audit(key, "set");
  }

  /**
   * Retrieve a secret's current value.
   *
   * @param key - Secret key
   */
  get(key: string): string | undefined {
    const versions = this.secrets.get(key);
    if (!versions || versions.length === 0) return undefined;
    this.audit(key, "get");
    return versions[versions.length - 1]!.value;
  }

  /**
   * Delete a secret.
   *
   * @param key - Secret key to delete
   */
  delete(key: string): void {
    this.secrets.delete(key);
    this.audit(key, "delete");
  }

  /**
   * Rotate a secret to a new value.
   *
   * @param key - Secret key
   * @param newValue - New secret value
   * @throws Error if key doesn't exist
   */
  rotate(key: string, newValue: string): void {
    const versions = this.secrets.get(key);
    if (!versions) {
      throw new Error(`Secret '${key}' does not exist`);
    }
    versions.push({ value: newValue, createdAt: Date.now() });
    this.audit(key, "rotate");
  }

  /**
   * Get rotation history for a secret.
   *
   * @param key - Secret key
   */
  getRotationHistory(key: string): SecretVersion[] {
    return [...(this.secrets.get(key) ?? [])];
  }

  /** List all secret keys (not values). */
  list(): string[] {
    return [...this.secrets.keys()];
  }

  /** Get the audit log. */
  getAuditLog(): AuditEntry[] {
    return [...this.auditLog];
  }

  private audit(key: string, action: AuditEntry["action"]): void {
    this.auditLog.push({ key, action, timestamp: Date.now() });
  }
}
