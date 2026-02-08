/**
 * @module Policy Sync
 * @description Syncs DLP sensitivity policies from the enterprise console.
 * Caches the last successful policy for offline resilience.
 */

/* ── Types ── */

/** Enterprise DLP policy. */
export interface DlpPolicy {
  version: number;
  rules: DlpRules;
}

/** Policy rules. */
export interface DlpRules {
  blockedPiiTypes: string[];
  monitoredDomains: string[];
  customPatterns: Array<{ name: string; pattern: string }>;
}

/** Sync configuration. */
interface SyncConfig {
  consoleUrl: string;
  fetchFn: typeof fetch;
}

/* ── Sync ── */

/**
 * Fetches and caches DLP policies from the enterprise console.
 */
export class PolicySync {
  private readonly config: SyncConfig;
  private cachedPolicy: DlpPolicy | null = null;

  constructor(config: SyncConfig) {
    this.config = config;
  }

  /**
   * Fetch the latest DLP policy from the console.
   * Returns null on failure; retains cached policy.
   *
   * @returns The policy or null on failure
   */
  async fetch(): Promise<DlpPolicy | null> {
    try {
      const response = await this.config.fetchFn(this.config.consoleUrl);
      if (!response.ok) return null;

      const policy: DlpPolicy = await response.json();
      this.cachedPolicy = policy;
      return policy;
    } catch {
      return null;
    }
  }

  /**
   * Get the last successfully fetched policy.
   *
   * @returns Cached policy or null
   */
  getCached(): DlpPolicy | null {
    return this.cachedPolicy;
  }
}
