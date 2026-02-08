/**
 * @module Tenant Onboarding Tests
 * @description TDD tests for tenant provisioning flow.
 * Orchestrates namespace creation, default admin, default policy, and storage init.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { TenantOnboarding, type OnboardingConfig } from "./tenant-onboarding";
import { TenantIsolator } from "./tenant-isolator";
import { UserManager } from "./user-manager";

describe("TenantOnboarding", () => {
  let onboarding: TenantOnboarding;
  let isolator: TenantIsolator;
  let userManager: UserManager;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
    isolator = new TenantIsolator();
    userManager = new UserManager();
    onboarding = new TenantOnboarding(isolator, userManager);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /* ── Provisioning ── */

  describe("provision", () => {
    it("registers the tenant in the isolator", () => {
      onboarding.provision({
        tenantId: "acme-corp",
        tenantName: "Acme Corporation",
        adminEmail: "admin@acme.com",
        adminName: "Admin User",
      });

      expect(isolator.listTenants()).toContain("acme-corp");
    });

    it("creates a default admin user", () => {
      onboarding.provision({
        tenantId: "acme-corp",
        tenantName: "Acme Corporation",
        adminEmail: "admin@acme.com",
        adminName: "Admin User",
      });

      const users = userManager.listByTenant("acme-corp");
      expect(users).toHaveLength(1);
      expect(users[0]!.email).toBe("admin@acme.com");
      expect(users[0]!.role).toBe("ADMIN");
    });

    it("stores tenant metadata in scoped storage", () => {
      onboarding.provision({
        tenantId: "acme-corp",
        tenantName: "Acme Corporation",
        adminEmail: "admin@acme.com",
        adminName: "Admin User",
      });

      isolator.setActiveTenant("acme-corp");
      const meta = isolator.get("tenant:meta") as Record<string, unknown>;
      expect(meta.name).toBe("Acme Corporation");
      expect(meta.provisionedAt).toBe(Date.now());
    });

    it("applies default policy template", () => {
      onboarding.provision({
        tenantId: "acme-corp",
        tenantName: "Acme Corporation",
        adminEmail: "admin@acme.com",
        adminName: "Admin User",
      });

      isolator.setActiveTenant("acme-corp");
      const policy = isolator.get("default-policy") as Record<string, unknown>;
      expect(policy).toBeDefined();
      expect(policy.phishingEnabled).toBe(true);
      expect(policy.dlpEnabled).toBe(true);
      expect(policy.c2paEnabled).toBe(true);
    });

    it("throws on duplicate tenant ID", () => {
      const config: OnboardingConfig = {
        tenantId: "acme-corp",
        tenantName: "Acme Corporation",
        adminEmail: "admin@acme.com",
        adminName: "Admin User",
      };

      onboarding.provision(config);
      expect(() => onboarding.provision(config)).toThrow();
    });

    it("throws on empty tenant ID", () => {
      expect(() =>
        onboarding.provision({
          tenantId: "",
          tenantName: "Bad",
          adminEmail: "a@b.com",
          adminName: "A",
        }),
      ).toThrow();
    });
  });

  /* ── Validation ── */

  describe("isProvisioned", () => {
    it("returns true for provisioned tenants", () => {
      onboarding.provision({
        tenantId: "acme-corp",
        tenantName: "Acme Corporation",
        adminEmail: "admin@acme.com",
        adminName: "Admin User",
      });

      expect(onboarding.isProvisioned("acme-corp")).toBe(true);
    });

    it("returns false for unknown tenants", () => {
      expect(onboarding.isProvisioned("nonexistent")).toBe(false);
    });
  });
});
