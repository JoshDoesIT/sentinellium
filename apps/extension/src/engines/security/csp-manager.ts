/**
 * @module CSP Manager
 * @description Content Security Policy header generation and extension CSP enforcement.
 * Provides strict defaults with customizable directives and validation warnings.
 */

/* ── Types ── */

/** CSP header representation. */
export interface CspHeader {
  name: string;
  value: string;
}

/* ── Manager ── */

/** Default strict CSP directives. */
const DEFAULT_DIRECTIVES: Record<string, string[]> = {
  "default-src": ["'self'"],
  "script-src": ["'self'"],
  "style-src": ["'self'"],
  "img-src": ["'self'"],
  "font-src": ["'self'"],
  "connect-src": ["'self'"],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'none'"],
};

/**
 * CSP header builder with validation.
 */
export class CspManager {
  private readonly directives: Map<string, string[]>;

  constructor() {
    this.directives = new Map(
      Object.entries(DEFAULT_DIRECTIVES).map(([k, v]) => [k, [...v]]),
    );
  }

  /**
   * Add a source to a directive.
   *
   * @param directive - CSP directive name
   * @param source - Source to add
   */
  addDirective(directive: string, source: string): void {
    const sources = this.directives.get(directive) ?? ["'self'"];
    sources.push(source);
    this.directives.set(directive, sources);
  }

  /**
   * Remove a directive entirely.
   *
   * @param directive - Directive to remove
   */
  removeDirective(directive: string): void {
    this.directives.delete(directive);
  }

  /** Build the CSP string from configured directives. */
  build(): string {
    return [...this.directives.entries()]
      .map(([key, sources]) => `${key} ${sources.join(" ")}`)
      .join("; ");
  }

  /**
   * Validate the CSP for common security issues.
   *
   * @returns Array of warning messages
   */
  validate(): string[] {
    const warnings: string[] = [];
    const scriptSrc = this.directives.get("script-src");
    if (scriptSrc?.includes("'unsafe-inline'")) {
      warnings.push(
        "script-src contains 'unsafe-inline' which weakens XSS protection",
      );
    }
    if (scriptSrc?.includes("'unsafe-eval'")) {
      warnings.push(
        "script-src contains 'unsafe-eval' which allows code injection",
      );
    }
    return warnings;
  }

  /** Get CSP as an HTTP header object. */
  toHeader(): CspHeader {
    return {
      name: "Content-Security-Policy",
      value: this.build(),
    };
  }

  /** List all configured directive names. */
  listDirectives(): string[] {
    return [...this.directives.keys()];
  }
}
