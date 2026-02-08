/**
 * @module PII Detector
 * @description Pattern-based PII detection engine.
 * Scans text for sensitive data: SSN, credit cards, emails,
 * phone numbers, API keys, and custom regex patterns.
 *
 * This is a pure-JS implementation (no WASM dependency)
 * suitable for content-script execution. Enterprise deployments
 * can extend with custom patterns via configuration.
 */

/* ── Types ── */

/** PII entity types. */
export enum PiiType {
  SSN = "SSN",
  CREDIT_CARD = "CREDIT_CARD",
  EMAIL = "EMAIL",
  PHONE = "PHONE",
  API_KEY = "API_KEY",
  CUSTOM = "CUSTOM",
}

/** A detected PII match. */
export interface PiiMatch {
  type: PiiType;
  value: string;
  start: number;
  end: number;
  confidence: number;
  /** Label for custom patterns. */
  label?: string;
}

/** Custom pattern definition. */
export interface CustomPattern {
  name: string;
  pattern: RegExp;
}

/** Detector configuration. */
export interface PiiDetectorConfig {
  customPatterns?: CustomPattern[];
}

/* ── Built-in Patterns ── */

interface BuiltinPattern {
  type: PiiType;
  pattern: RegExp;
  confidence: number;
}

const BUILTIN_PATTERNS: BuiltinPattern[] = [
  {
    type: PiiType.SSN,
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    confidence: 0.95,
  },
  {
    type: PiiType.SSN,
    pattern: /\b\d{9}\b/g,
    confidence: 0.7,
  },
  {
    type: PiiType.CREDIT_CARD,
    pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    confidence: 0.9,
  },
  {
    type: PiiType.EMAIL,
    pattern: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
    confidence: 0.95,
  },
  {
    type: PiiType.PHONE,
    pattern: /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    confidence: 0.8,
  },
  {
    type: PiiType.API_KEY,
    pattern: /\bAKIA[0-9A-Z]{16}\b/g,
    confidence: 0.95,
  },
  {
    type: PiiType.API_KEY,
    pattern: /\bsk-[a-zA-Z0-9-]{20,}\b/g,
    confidence: 0.9,
  },
];

/* ── Detector ── */

/**
 * Scans text for PII using regex patterns.
 *
 * Usage:
 * ```ts
 * const detector = new PiiDetector();
 * const matches = detector.scan("My SSN is 123-45-6789");
 * // [{ type: "SSN", value: "123-45-6789", start: 10, end: 21, confidence: 0.95 }]
 * ```
 */
export class PiiDetector {
  private readonly customPatterns: CustomPattern[];

  constructor(config?: PiiDetectorConfig) {
    this.customPatterns = config?.customPatterns ?? [];
  }

  /**
   * Scan text for PII matches.
   *
   * @param text - The text to scan
   * @returns Array of PII matches with type, value, and position
   */
  scan(text: string): PiiMatch[] {
    const matches: PiiMatch[] = [];

    // Run built-in patterns
    for (const bp of BUILTIN_PATTERNS) {
      const regex = new RegExp(bp.pattern.source, bp.pattern.flags);
      let match: RegExpExecArray | null;
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          type: bp.type,
          value: match[0],
          start: match.index,
          end: match.index + match[0].length,
          confidence: bp.confidence,
        });
      }
    }

    // Run custom patterns
    for (const cp of this.customPatterns) {
      const regex = new RegExp(cp.pattern.source, cp.pattern.flags);
      let match: RegExpExecArray | null;
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          type: PiiType.CUSTOM,
          value: match[0],
          start: match.index,
          end: match.index + match[0].length,
          confidence: 0.8,
          label: cp.name,
        });
      }
    }

    return matches;
  }
}
