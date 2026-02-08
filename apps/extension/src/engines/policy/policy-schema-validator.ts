/**
 * @module Policy Schema Validator
 * @description Validates enterprise policy documents against the
 * Sentinellium policy schema. Ensures type safety and structural
 * correctness before policies are stored or distributed.
 */

/* ── Types ── */

/** Engine-specific rule configuration. */
export interface PhishingRule {
  enabled: boolean;
  sensitivity: string;
}

export interface DlpRule {
  enabled: boolean;
  blockedPiiTypes: string[];
}

export interface C2paRule {
  enabled: boolean;
  flagUnverified: boolean;
}

/** Policy rules container. */
export interface PolicyRules {
  phishing?: PhishingRule;
  dlp?: DlpRule;
  c2pa?: C2paRule;
}

/** A complete policy document. */
export interface PolicyDocument {
  id: string;
  name: string;
  version: number;
  rules: PolicyRules;
}

/** Validation result. */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/* ── Constants ── */

const VALID_SENSITIVITY_LEVELS = new Set(["low", "medium", "high", "critical"]);

/* ── Validator ── */

/**
 * Validates policy documents against the schema.
 */
export class PolicySchemaValidator {
  /**
   * Validate a policy document.
   *
   * @param policy - The document to validate
   * @returns Validation result with any errors
   */
  validate(policy: PolicyDocument): ValidationResult {
    const errors: string[] = [];

    if (!policy || typeof policy !== "object") {
      return { valid: false, errors: ["Policy must be a non-null object"] };
    }

    // Required fields
    if (!policy.id || typeof policy.id !== "string") {
      errors.push("Missing or invalid 'id': must be a non-empty string");
    }
    if (!policy.name || typeof policy.name !== "string") {
      errors.push("Missing or invalid 'name': must be a non-empty string");
    }
    if (typeof policy.version !== "number" || policy.version < 1) {
      errors.push("Invalid 'version': must be a positive integer");
    }

    // Rule validation
    if (policy.rules) {
      this.validateRules(policy.rules, errors);
    }

    return { valid: errors.length === 0, errors };
  }

  /** Validate individual rule blocks. */
  private validateRules(rules: PolicyRules, errors: string[]): void {
    if (rules.phishing) {
      if (typeof rules.phishing.enabled !== "boolean") {
        errors.push("phishing.enabled must be a boolean");
      }
      if (
        rules.phishing.sensitivity &&
        !VALID_SENSITIVITY_LEVELS.has(rules.phishing.sensitivity)
      ) {
        errors.push(
          `Invalid phishing sensitivity '${rules.phishing.sensitivity}': must be one of ${[...VALID_SENSITIVITY_LEVELS].join(", ")}`,
        );
      }
    }

    if (rules.dlp) {
      if (typeof rules.dlp.enabled !== "boolean") {
        errors.push("dlp.enabled must be a boolean");
      }
      if (!Array.isArray(rules.dlp.blockedPiiTypes)) {
        errors.push("dlp.blockedPiiTypes must be an array");
      }
    }

    if (rules.c2pa) {
      if (typeof rules.c2pa.enabled !== "boolean") {
        errors.push("c2pa.enabled must be a boolean");
      }
    }
  }
}
