/**
 * @module Web Protections Guard
 * @description CORS, CSRF, and XSS protections.
 * Provides origin validation, CSRF token management,
 * HTML sanitization, and standard security headers.
 */

/* ── Types ── */

export interface CorsConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowCredentials: boolean;
}

/* ── Helpers ── */

function generateRandomHex(length: number): string {
  const chars = "0123456789abcdef";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/* ── Guard ── */

/**
 * Web protections guard with CORS, CSRF, and XSS defenses.
 */
export class WebProtectionsGuard {
  private readonly config: CorsConfig;
  private readonly csrfTokens = new Set<string>();

  constructor(config: CorsConfig) {
    this.config = config;
  }

  /* ── CORS ── */

  /**
   * Check if an origin is allowed.
   *
   * @param origin - Request origin
   */
  checkOrigin(origin: string): boolean {
    return this.config.allowedOrigins.includes(origin);
  }

  /**
   * Generate CORS response headers for a valid origin.
   *
   * @param origin - Requesting origin
   */
  corsHeaders(origin: string): Record<string, string> {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": this.config.allowedMethods.join(", "),
      "Access-Control-Allow-Credentials": String(this.config.allowCredentials),
    };
  }

  /* ── CSRF ── */

  /** Generate and store a CSRF token. */
  generateCsrfToken(): string {
    const token = generateRandomHex(32);
    this.csrfTokens.add(token);
    return token;
  }

  /**
   * Validate a CSRF token.
   *
   * @param token - Token to validate
   */
  validateCsrfToken(token: string): boolean {
    return this.csrfTokens.has(token);
  }

  /* ── XSS ── */

  /**
   * Sanitize HTML to prevent XSS attacks.
   * Strips script tags, event handlers, and dangerous attributes.
   *
   * @param html - Untrusted HTML input
   * @returns Sanitized HTML
   */
  sanitize(html: string): string {
    // Encode angle brackets to HTML entities to neutralize all tags
    // and event handlers. This is safer than regex-based stripping.
    return html.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* ── Security Headers ── */

  /** Generate standard security response headers. */
  securityHeaders(): Record<string, string> {
    return {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    };
  }
}
