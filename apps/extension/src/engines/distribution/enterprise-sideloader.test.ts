/**
 * @module Enterprise Sideloader Tests
 * @description TDD tests for GPO/MDM enterprise sideloading.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  EnterpriseSideloader,
  DeploymentMethod,
} from "./enterprise-sideloader";

describe("EnterpriseSideloader", () => {
  let sideloader: EnterpriseSideloader;

  beforeEach(() => {
    sideloader = new EnterpriseSideloader();
  });

  describe("createPolicy", () => {
    it("creates a GPO deployment policy", () => {
      const policy = sideloader.createPolicy({
        extensionId: "sentinellium",
        version: "1.2.0",
        method: DeploymentMethod.GPO,
        forceInstall: true,
      });

      expect(policy.id).toBeTruthy();
      expect(policy.method).toBe(DeploymentMethod.GPO);
      expect(policy.forceInstall).toBe(true);
    });

    it("creates an MDM deployment policy", () => {
      const policy = sideloader.createPolicy({
        extensionId: "sentinellium",
        version: "1.2.0",
        method: DeploymentMethod.MDM,
        forceInstall: false,
      });

      expect(policy.method).toBe(DeploymentMethod.MDM);
    });
  });

  describe("getPolicy", () => {
    it("retrieves a deployment policy", () => {
      const created = sideloader.createPolicy({
        extensionId: "sentinellium",
        version: "1.2.0",
        method: DeploymentMethod.GPO,
        forceInstall: true,
      });

      const policy = sideloader.getPolicy(created.id);
      expect(policy!.extensionId).toBe("sentinellium");
    });
  });

  describe("listPolicies", () => {
    it("lists all deployment policies", () => {
      sideloader.createPolicy({
        extensionId: "ext-a",
        version: "1.0.0",
        method: DeploymentMethod.GPO,
        forceInstall: true,
      });
      sideloader.createPolicy({
        extensionId: "ext-b",
        version: "2.0.0",
        method: DeploymentMethod.MDM,
        forceInstall: false,
      });

      expect(sideloader.listPolicies()).toHaveLength(2);
    });
  });

  describe("generateConfig", () => {
    it("generates deployment config JSON", () => {
      const policy = sideloader.createPolicy({
        extensionId: "sentinellium",
        version: "1.2.0",
        method: DeploymentMethod.GPO,
        forceInstall: true,
      });

      const config = sideloader.generateConfig(policy.id);
      expect(config.extensionId).toBe("sentinellium");
      expect(config.installMode).toBe("force");
    });
  });
});
