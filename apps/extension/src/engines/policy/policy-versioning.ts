/**
 * @module Policy Versioning
 * @description Manages policy version history with snapshots,
 * rollback, and field-level diffing.
 */
import { type PolicyDocument } from "./policy-schema-validator";

/* ── Types ── */

/** A versioned snapshot entry. */
export interface VersionEntry {
  policy: PolicyDocument;
  savedAt: string;
}

/** A diff entry between two versions. */
export interface DiffEntry {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

/* ── Versioning ── */

/**
 * Manages policy version history.
 */
export class PolicyVersioning {
  private readonly history = new Map<string, VersionEntry[]>();

  /**
   * Save a version snapshot.
   *
   * @param policy - Policy document to snapshot
   */
  snapshot(policy: PolicyDocument): void {
    const entries = this.history.get(policy.id) ?? [];
    entries.push({
      policy: structuredClone(policy),
      savedAt: new Date().toISOString(),
    });
    this.history.set(policy.id, entries);
  }

  /**
   * Get full version history for a policy.
   *
   * @param policyId - Policy ID
   * @returns Array of version entries
   */
  getHistory(policyId: string): readonly VersionEntry[] {
    return this.history.get(policyId) ?? [];
  }

  /**
   * Get a specific version.
   *
   * @param policyId - Policy ID
   * @param version - Version number
   * @returns Policy at that version or undefined
   */
  getVersion(policyId: string, version: number): PolicyDocument | undefined {
    const entries = this.history.get(policyId) ?? [];
    return entries.find((e) => e.policy.version === version)?.policy;
  }

  /**
   * Rollback to a specific version.
   *
   * @param policyId - Policy ID
   * @param version - Target version number
   * @returns The rollback policy or null if not found
   */
  rollback(policyId: string, version: number): PolicyDocument | null {
    const policy = this.getVersion(policyId, version);
    return policy ? structuredClone(policy) : null;
  }

  /**
   * Diff two versions of a policy.
   *
   * @param policyId - Policy ID
   * @param fromVersion - Source version
   * @param toVersion - Target version
   * @returns Array of field differences
   */
  diff(policyId: string, fromVersion: number, toVersion: number): DiffEntry[] {
    const from = this.getVersion(policyId, fromVersion);
    const to = this.getVersion(policyId, toVersion);
    if (!from || !to) return [];

    const diffs: DiffEntry[] = [];
    const keys = new Set([...Object.keys(from), ...Object.keys(to)]) as Set<
      keyof PolicyDocument
    >;

    for (const key of keys) {
      if (key === "rules") continue; // Compare rules separately
      const oldVal = from[key];
      const newVal = to[key];
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        diffs.push({ field: key, oldValue: oldVal, newValue: newVal });
      }
    }

    // Compare rules
    const oldRules = JSON.stringify(from.rules);
    const newRules = JSON.stringify(to.rules);
    if (oldRules !== newRules) {
      diffs.push({ field: "rules", oldValue: from.rules, newValue: to.rules });
    }

    return diffs;
  }
}
