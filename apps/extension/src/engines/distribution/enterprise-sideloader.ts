/**
 * @module Enterprise Sideloader
 * @description GPO/MDM enterprise sideloading for extension deployment.
 * Creates deployment policies and generates configuration for managed installs.
 */

/* ── Types ── */

export enum DeploymentMethod {
  GPO = "gpo",
  MDM = "mdm",
}

export interface DeploymentPolicy {
  id: string;
  extensionId: string;
  version: string;
  method: DeploymentMethod;
  forceInstall: boolean;
  createdAt: number;
}

export interface DeploymentConfig {
  extensionId: string;
  version: string;
  installMode: string;
  updateUrl: string;
}

/* ── Helpers ── */

let policySeq = 0;
function generatePolicyId(): string {
  policySeq++;
  return `DP-${policySeq.toString().padStart(4, "0")}`;
}

/* ── Sideloader ── */

/**
 * Enterprise sideloading via GPO/MDM.
 */
export class EnterpriseSideloader {
  private readonly policies = new Map<string, DeploymentPolicy>();

  /**
   * Create a deployment policy.
   *
   * @param input - Policy details
   */
  createPolicy(input: {
    extensionId: string;
    version: string;
    method: DeploymentMethod;
    forceInstall: boolean;
  }): DeploymentPolicy {
    const id = generatePolicyId();
    const policy: DeploymentPolicy = {
      id,
      ...input,
      createdAt: Date.now(),
    };
    this.policies.set(id, policy);
    return { ...policy };
  }

  /**
   * Get a policy by ID.
   *
   * @param id - Policy ID
   */
  getPolicy(id: string): DeploymentPolicy | undefined {
    const policy = this.policies.get(id);
    return policy ? { ...policy } : undefined;
  }

  /** List all deployment policies. */
  listPolicies(): DeploymentPolicy[] {
    return [...this.policies.values()].map((p) => ({ ...p }));
  }

  /**
   * Generate deployment configuration.
   *
   * @param policyId - Policy to generate config for
   */
  generateConfig(policyId: string): DeploymentConfig {
    const policy = this.policies.get(policyId);
    if (!policy) throw new Error(`Policy '${policyId}' not found`);

    return {
      extensionId: policy.extensionId,
      version: policy.version,
      installMode: policy.forceInstall ? "force" : "optional",
      updateUrl: `https://update.sentinellium.com/extensions/${policy.extensionId}`,
    };
  }
}
