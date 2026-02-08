/**
 * @module Policy Service Client
 * @description Client for policy CRUD, versioning, and distribution.
 * Tracks version history for audit and rollback support.
 */

/* ── Types ── */

/** Input for creating a policy. */
export interface CreatePolicyInput {
  name: string;
  tenantId: string;
  rules: Record<string, unknown>;
}

/** Updatable policy fields. */
export interface UpdatePolicyInput {
  name?: string;
  rules?: Record<string, unknown>;
}

/** A versioned policy document. */
export interface PolicyRecord {
  id: string;
  name: string;
  tenantId: string;
  version: number;
  rules: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

/* ── Client ── */

/**
 * Policy service client with CRUD and version tracking.
 */
export class PolicyServiceClient {
  private readonly policies = new Map<string, PolicyRecord>();
  private readonly versionHistory = new Map<string, PolicyRecord[]>();
  private nextId = 1;

  /**
   * Create a new policy at version 1.
   *
   * @param input - Policy creation fields
   * @returns Created policy record
   */
  create(input: CreatePolicyInput): PolicyRecord {
    const id = `pol-${String(this.nextId++).padStart(4, "0")}`;
    const now = Date.now();
    const record: PolicyRecord = {
      id,
      name: input.name,
      tenantId: input.tenantId,
      version: 1,
      rules: { ...input.rules },
      createdAt: now,
      updatedAt: now,
    };

    this.policies.set(id, record);
    this.versionHistory.set(id, [{ ...record }]);
    return { ...record };
  }

  /**
   * Get a policy by ID.
   *
   * @param id - Policy ID
   * @returns Policy record or undefined
   */
  get(id: string): PolicyRecord | undefined {
    const record = this.policies.get(id);
    return record ? { ...record } : undefined;
  }

  /**
   * Update a policy. Increments version and records history.
   *
   * @param id - Policy ID
   * @param updates - Fields to update
   * @throws Error if policy not found
   */
  update(id: string, updates: UpdatePolicyInput): void {
    const record = this.policies.get(id);
    if (!record) {
      throw new Error(`Policy '${id}' not found`);
    }

    if (updates.name !== undefined) record.name = updates.name;
    if (updates.rules !== undefined) record.rules = { ...updates.rules };
    record.version++;
    record.updatedAt = Date.now();

    this.versionHistory.get(id)!.push({ ...record });
  }

  /**
   * Delete a policy.
   *
   * @param id - Policy ID
   */
  delete(id: string): void {
    this.policies.delete(id);
    this.versionHistory.delete(id);
  }

  /**
   * List all policies for a tenant.
   *
   * @param tenantId - Tenant to filter by
   */
  listByTenant(tenantId: string): PolicyRecord[] {
    return [...this.policies.values()]
      .filter((p) => p.tenantId === tenantId)
      .map((p) => ({ ...p }));
  }

  /**
   * Get full version history for a policy.
   *
   * @param id - Policy ID
   */
  getVersionHistory(id: string): PolicyRecord[] {
    return (this.versionHistory.get(id) ?? []).map((p) => ({ ...p }));
  }
}
