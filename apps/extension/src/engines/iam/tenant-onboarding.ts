/**
 * @module Tenant Onboarding
 * @description Orchestrates new tenant provisioning.
 * Creates isolated namespace, default admin user, default policy template,
 * and tenant metadata. Validates config before activation.
 */
import { TenantIsolator } from "./tenant-isolator";
import { UserManager } from "./user-manager";

/* ── Types ── */

/** Configuration for provisioning a new tenant. */
export interface OnboardingConfig {
  tenantId: string;
  tenantName: string;
  adminEmail: string;
  adminName: string;
}

/* ── Onboarding ── */

/**
 * Provisions new tenants with isolated namespace, admin user, and default policy.
 */
export class TenantOnboarding {
  private readonly provisioned = new Set<string>();

  constructor(
    private readonly isolator: TenantIsolator,
    private readonly userManager: UserManager,
  ) {}

  /**
   * Provision a new tenant.
   *
   * @param config - Tenant configuration
   * @throws Error if tenant ID is empty or already provisioned
   */
  provision(config: OnboardingConfig): void {
    if (!config.tenantId.trim()) {
      throw new Error("Tenant ID must not be empty");
    }
    if (this.provisioned.has(config.tenantId)) {
      throw new Error(`Tenant '${config.tenantId}' is already provisioned`);
    }

    // 1. Register tenant namespace
    this.isolator.setActiveTenant(config.tenantId);
    this.provisioned.add(config.tenantId);

    // 2. Store tenant metadata
    this.isolator.set("tenant:meta", {
      name: config.tenantName,
      provisionedAt: Date.now(),
    });

    // 3. Apply default policy template
    this.isolator.set("default-policy", {
      phishingEnabled: true,
      dlpEnabled: true,
      c2paEnabled: true,
      sensitivity: "high",
    });

    // 4. Create default admin user
    this.userManager.createUser({
      email: config.adminEmail,
      name: config.adminName,
      role: "ADMIN",
      tenantId: config.tenantId,
    });
  }

  /**
   * Check whether a tenant has been provisioned.
   *
   * @param tenantId - Tenant ID to check
   */
  isProvisioned(tenantId: string): boolean {
    return this.provisioned.has(tenantId);
  }
}
