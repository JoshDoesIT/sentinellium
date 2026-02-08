/**
 * @module Sensitivity Rules
 * @description Configurable sensitivity policies for PII types.
 * Supports per-entity-type levels, custom overrides,
 * and domain-specific rule escalation.
 */
import { PiiType } from "./pii-detector";

/* ── Types ── */

/** Sensitivity level for PII types. */
export enum SensitivityLevel {
  CRITICAL = "CRITICAL",
  MODERATE = "MODERATE",
  LOW = "LOW",
}

/** Rules configuration. */
export interface SensitivityConfig {
  overrides?: Map<PiiType, SensitivityLevel>;
  domainRules?: Map<string, Map<PiiType, SensitivityLevel>>;
}

/* ── Default Rules ── */

const DEFAULT_LEVELS = new Map<PiiType, SensitivityLevel>([
  [PiiType.SSN, SensitivityLevel.CRITICAL],
  [PiiType.CREDIT_CARD, SensitivityLevel.CRITICAL],
  [PiiType.API_KEY, SensitivityLevel.CRITICAL],
  [PiiType.EMAIL, SensitivityLevel.MODERATE],
  [PiiType.PHONE, SensitivityLevel.MODERATE],
  [PiiType.CUSTOM, SensitivityLevel.MODERATE],
]);

/* ── Rules Engine ── */

/**
 * Configurable sensitivity rules for DLP decisions.
 */
export class SensitivityRules {
  private readonly levels: Map<PiiType, SensitivityLevel>;
  private readonly domainRules: Map<string, Map<PiiType, SensitivityLevel>>;

  constructor(config?: SensitivityConfig) {
    this.levels = new Map(DEFAULT_LEVELS);
    if (config?.overrides) {
      for (const [type, level] of config.overrides) {
        this.levels.set(type, level);
      }
    }
    this.domainRules = config?.domainRules ?? new Map();
  }

  /**
   * Get the sensitivity level for a PII type.
   *
   * @param type - PII entity type
   * @returns Sensitivity level
   */
  getLevel(type: PiiType): SensitivityLevel {
    return this.levels.get(type) ?? SensitivityLevel.MODERATE;
  }

  /**
   * Get the sensitivity level for a PII type on a specific domain.
   * Domain-specific rules take precedence over defaults.
   *
   * @param type - PII entity type
   * @param domain - The domain to check
   * @returns Sensitivity level (domain-specific or default)
   */
  getLevelForDomain(type: PiiType, domain: string): SensitivityLevel {
    const domainOverrides = this.domainRules.get(domain);
    if (domainOverrides?.has(type)) {
      return domainOverrides.get(type)!;
    }
    return this.getLevel(type);
  }

  /**
   * Check if a PII type should trigger a block action.
   *
   * @param type - PII entity type
   * @returns True if CRITICAL sensitivity
   */
  shouldBlock(type: PiiType): boolean {
    return this.getLevel(type) === SensitivityLevel.CRITICAL;
  }
}
