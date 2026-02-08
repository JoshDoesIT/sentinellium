/**
 * @module Anonymize Engine
 * @description Redacts PII from text using configurable strategies.
 * Replaces detected PII with masked or placeholder values.
 */
import { type PiiMatch, PiiType } from "./pii-detector";

/* ── Types ── */

/** Redaction strategy. */
export enum RedactionStrategy {
  /** Type-specific masking (e.g., ***-**-**** for SSN). */
  MASK = "MASK",
  /** Generic placeholder (e.g., [SSN REDACTED]). */
  PLACEHOLDER = "PLACEHOLDER",
}

/** Engine configuration. */
export interface AnonymizeConfig {
  strategy?: RedactionStrategy;
}

/* ── Engine ── */

/**
 * Redacts PII from text.
 */
export class AnonymizeEngine {
  private readonly strategy: RedactionStrategy;

  constructor(config?: AnonymizeConfig) {
    this.strategy = config?.strategy ?? RedactionStrategy.MASK;
  }

  /**
   * Redact PII matches from text.
   * Processes matches in reverse order to preserve positions.
   *
   * @param text - Original text
   * @param matches - PII matches to redact
   * @returns Redacted text
   */
  redact(text: string, matches: PiiMatch[]): string {
    if (matches.length === 0) return text;

    // Sort by position descending so replacements don't shift indices
    const sorted = [...matches].sort((a, b) => b.start - a.start);

    let result = text;
    for (const match of sorted) {
      const replacement = this.getRedaction(match);
      result =
        result.slice(0, match.start) + replacement + result.slice(match.end);
    }

    return result;
  }

  /** Get the redacted replacement for a PII match. */
  private getRedaction(match: PiiMatch): string {
    if (this.strategy === RedactionStrategy.PLACEHOLDER) {
      return this.getPlaceholder(match.type);
    }
    return this.getMask(match);
  }

  /** Get a type-specific mask. */
  private getMask(match: PiiMatch): string {
    switch (match.type) {
      case PiiType.SSN:
        return "***-**-****";
      case PiiType.CREDIT_CARD:
        return this.maskCreditCard(match.value);
      case PiiType.EMAIL:
        return "[EMAIL REDACTED]";
      case PiiType.PHONE:
        return "[PHONE REDACTED]";
      case PiiType.API_KEY:
        return "[API KEY REDACTED]";
      case PiiType.CUSTOM:
        return "[REDACTED]";
    }
  }

  /** Mask credit card preserving last 4 digits. */
  private maskCreditCard(value: string): string {
    const digits = value.replace(/\D/g, "");
    const last4 = digits.slice(-4);
    return `****-****-****-${last4}`;
  }

  /** Get a generic placeholder. */
  private getPlaceholder(type: PiiType): string {
    const labels: Record<PiiType, string> = {
      [PiiType.SSN]: "SSN",
      [PiiType.CREDIT_CARD]: "CREDIT CARD",
      [PiiType.EMAIL]: "EMAIL",
      [PiiType.PHONE]: "PHONE",
      [PiiType.API_KEY]: "API KEY",
      [PiiType.CUSTOM]: "PII",
    };
    return `[${labels[type]} REDACTED]`;
  }
}
