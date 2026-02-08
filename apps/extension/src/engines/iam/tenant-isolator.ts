/**
 * @module Tenant Isolator
 * @description Namespace-based tenant data isolation layer.
 * All storage keys, events, and policies are scoped to the active tenant.
 * Prevents cross-tenant data contamination during tenant switching.
 */

/* ── Types ── */

/** Opaque tenant-scoped storage. */
type TenantStore = Map<string, unknown>;

/* ── Isolator ── */

/**
 * Manages tenant-scoped data isolation.
 * Every storage key is prefixed with `tenant:{id}:` to prevent leakage.
 */
export class TenantIsolator {
  private currentTenantId: string | undefined;
  private readonly tenants = new Set<string>();
  private readonly stores = new Map<string, TenantStore>();

  /** The currently active tenant ID, or undefined if no tenant is set. */
  get activeTenantId(): string | undefined {
    return this.currentTenantId;
  }

  /**
   * Set the active tenant context.
   * All subsequent storage operations will be scoped to this tenant.
   *
   * @param tenantId - Non-empty tenant identifier
   * @throws Error if tenantId is empty
   */
  setActiveTenant(tenantId: string): void {
    if (!tenantId.trim()) {
      throw new Error("Tenant ID must not be empty");
    }
    this.currentTenantId = tenantId;
    this.tenants.add(tenantId);
    if (!this.stores.has(tenantId)) {
      this.stores.set(tenantId, new Map());
    }
  }

  /**
   * Prefix a key with the active tenant namespace.
   *
   * @param key - Raw storage key
   * @returns Scoped key in format `tenant:{id}:{key}`
   * @throws Error if no tenant is active
   */
  scopeKey(key: string): string {
    if (!this.currentTenantId) {
      throw new Error("No active tenant. Call setActiveTenant first.");
    }
    return `tenant:${this.currentTenantId}:${key}`;
  }

  /**
   * Store a value in the active tenant's namespace.
   *
   * @param key - Storage key (unscoped)
   * @param value - Value to store
   */
  set(key: string, value: unknown): void {
    const store = this.getActiveStore();
    store.set(key, structuredClone(value));
  }

  /**
   * Retrieve a value from the active tenant's namespace.
   *
   * @param key - Storage key (unscoped)
   * @returns Stored value or undefined
   */
  get(key: string): unknown {
    const store = this.getActiveStore();
    const value = store.get(key);
    return value !== undefined ? structuredClone(value) : undefined;
  }

  /**
   * Delete a key from the active tenant's namespace.
   *
   * @param key - Storage key (unscoped)
   */
  delete(key: string): void {
    const store = this.getActiveStore();
    store.delete(key);
  }

  /** List all registered tenant IDs. */
  listTenants(): string[] {
    return [...this.tenants];
  }

  /**
   * Remove a tenant and all its data.
   * Clears active tenant if the removed tenant was active.
   *
   * @param tenantId - Tenant to remove
   */
  removeTenant(tenantId: string): void {
    this.tenants.delete(tenantId);
    this.stores.delete(tenantId);
    if (this.currentTenantId === tenantId) {
      this.currentTenantId = undefined;
    }
  }

  /** Get the store for the active tenant, or throw. */
  private getActiveStore(): TenantStore {
    if (!this.currentTenantId) {
      throw new Error("No active tenant. Call setActiveTenant first.");
    }
    return this.stores.get(this.currentTenantId)!;
  }
}
