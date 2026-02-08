/**
 * @module Policy Store
 * @description CRUD store for enterprise policy documents.
 * Provides default templates and editor support.
 */
import { type PolicyDocument } from "./policy-schema-validator";

/* ── Store ── */

/**
 * Manages policy document lifecycle.
 */
export class PolicyStore {
  private readonly policies = new Map<string, PolicyDocument>();

  /**
   * Create a new policy. Throws if ID already exists.
   *
   * @param policy - Policy document to store
   */
  create(policy: PolicyDocument): void {
    if (this.policies.has(policy.id)) {
      throw new Error(`Policy '${policy.id}' already exists`);
    }
    this.policies.set(policy.id, { ...policy });
  }

  /**
   * Get a policy by ID.
   *
   * @param id - Policy ID
   * @returns Policy or undefined
   */
  get(id: string): PolicyDocument | undefined {
    const policy = this.policies.get(id);
    return policy ? { ...policy } : undefined;
  }

  /**
   * Update a policy. Merges partial updates.
   *
   * @param id - Policy ID
   * @param updates - Partial policy fields to update
   */
  update(id: string, updates: Partial<PolicyDocument>): void {
    const existing = this.policies.get(id);
    if (!existing) return;

    this.policies.set(id, { ...existing, ...updates, id });
  }

  /**
   * Delete a policy by ID.
   *
   * @param id - Policy ID
   */
  delete(id: string): void {
    this.policies.delete(id);
  }

  /** List all policies. */
  list(): PolicyDocument[] {
    return [...this.policies.values()];
  }

  /**
   * Generate a default policy template with all engines enabled.
   *
   * @returns Default policy document
   */
  getDefaultTemplate(): PolicyDocument {
    return {
      id: "",
      name: "New Security Policy",
      version: 1,
      rules: {
        phishing: { enabled: true, sensitivity: "high" },
        dlp: {
          enabled: true,
          blockedPiiTypes: ["SSN", "CREDIT_CARD", "API_KEY"],
        },
        c2pa: { enabled: true, flagUnverified: true },
      },
    };
  }
}
