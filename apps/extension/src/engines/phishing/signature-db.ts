/**
 * @module Signature Database
 * @description In-memory phishing signature database providing
 * domain blocklist/allowlist lookups and content pattern matching.
 * Ships with built-in signatures and supports runtime additions
 * for enterprise deployments.
 */

/* ── Types ── */

/** Type of signature match. */
export enum SignatureType {
  BLOCKLIST = "BLOCKLIST",
  ALLOWLIST = "ALLOWLIST",
  PATTERN = "PATTERN",
}

/** Result of a signature check. */
export interface SignatureMatch {
  matched: boolean;
  type: SignatureType;
  pattern?: string;
  description?: string;
}

/* ── Built-in Data ── */

/** Known phishing domains (blocklist). */
const BUILTIN_BLOCKED_DOMAINS: string[] = [
  "secure-paypal-login.tk",
  "accounts-google-verify.ml",
  "microsoft-account-update.ga",
  "apple-id-confirm.cf",
  "amazon-security-alert.gq",
  "netflix-billing-update.xyz",
  "chase-secure-login.top",
  "bankofamerica-verify.buzz",
  "wellsfargo-alert.club",
  "instagram-verify.icu",
  "facebook-security.work",
  "linkedin-confirm.online",
  "dropbox-verify.site",
  "yahoo-account-recovery.info",
  "icloud-unlock.biz",
];

/** Legitimate domains (allowlist). */
const BUILTIN_ALLOWLISTED_DOMAINS: string[] = [
  "google.com",
  "microsoft.com",
  "apple.com",
  "amazon.com",
  "facebook.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "linkedin.com",
  "github.com",
  "netflix.com",
  "paypal.com",
  "chase.com",
  "bankofamerica.com",
  "wellsfargo.com",
  "dropbox.com",
  "outlook.com",
  "live.com",
  "microsoftonline.com",
  "office.com",
  "office365.com",
  "yahoo.com",
  "icloud.com",
  "googleapis.com",
  "gstatic.com",
  "cloudflare.com",
  "amazonaws.com",
  "stripe.com",
];

/** Content patterns indicating phishing (case-insensitive regex). */
const CONTENT_PATTERNS: Array<{ pattern: RegExp; description: string }> = [
  {
    pattern:
      /account\s+(has\s+been\s+)?(suspended|locked|disabled|compromised)/i,
    description: "Account suspension threat",
  },
  {
    pattern: /verify\s+your\s+(identity|account|information)/i,
    description: "Identity verification request",
  },
  {
    pattern: /urgent|immediately|within\s+\d+\s+hours?/i,
    description: "Urgency pressure tactic",
  },
  {
    pattern:
      /(enter|provide|confirm)\s+your\s+(password|credentials|ssn|social\s+security)/i,
    description: "Credential harvesting",
  },
  {
    pattern: /unusual\s+(activity|sign[\s-]?in|login)/i,
    description: "Unusual activity alert",
  },
  {
    pattern: /click\s+(here|below)\s+to\s+(verify|confirm|update|restore)/i,
    description: "Action urgency link",
  },
  {
    pattern: /your\s+account\s+will\s+be\s+(closed|terminated|deleted)/i,
    description: "Account closure threat",
  },
];

/** URL patterns indicating phishing. */
const URL_PATTERNS: Array<{ pattern: RegExp; description: string }> = [
  {
    pattern: /login[-_]?(paypal|microsoft|google|apple|amazon|chase|bank)/i,
    description: "Brand name in login subdomain",
  },
  {
    pattern: /(verify|secure|confirm|update)[-_]?(account|identity|payment)/i,
    description: "Verification keyword in URL",
  },
  {
    pattern: /[?&](email|user|username|pass|password|ssn|cc|card)=/i,
    description: "Credential parameters in query string",
  },
];

/* ── Database Class ── */

/**
 * In-memory phishing signature database.
 *
 * Provides:
 * - Domain blocklist/allowlist with subdomain matching
 * - Content pattern matching (regex-based)
 * - URL pattern matching
 * - Runtime addition of custom signatures
 */
export class SignatureDatabase {
  private readonly blockedDomains: Set<string>;
  private readonly allowlistedDomains: Set<string>;

  constructor() {
    this.blockedDomains = new Set(BUILTIN_BLOCKED_DOMAINS);
    this.allowlistedDomains = new Set(BUILTIN_ALLOWLISTED_DOMAINS);
  }

  /** Total number of signatures (blocked domains + allowlist + patterns). */
  get signatureCount(): number {
    return (
      this.blockedDomains.size +
      this.allowlistedDomains.size +
      CONTENT_PATTERNS.length +
      URL_PATTERNS.length
    );
  }

  /**
   * Check if a domain matches the blocklist.
   * Supports exact match and subdomain matching.
   */
  checkDomain(domain: string): SignatureMatch {
    const normalized = domain.toLowerCase();

    // Exact match
    if (this.blockedDomains.has(normalized)) {
      return {
        matched: true,
        type: SignatureType.BLOCKLIST,
        pattern: normalized,
        description: "Known phishing domain",
      };
    }

    // Subdomain match: check if any parent domain is blocked
    for (const blocked of this.blockedDomains) {
      if (normalized.endsWith(`.${blocked}`)) {
        return {
          matched: true,
          type: SignatureType.BLOCKLIST,
          pattern: blocked,
          description: "Subdomain of known phishing domain",
        };
      }
    }

    return { matched: false, type: SignatureType.BLOCKLIST };
  }

  /**
   * Check if a domain is in the allowlist.
   * Supports exact match and subdomain matching.
   */
  isAllowlisted(domain: string): boolean {
    const normalized = domain.toLowerCase();

    if (this.allowlistedDomains.has(normalized)) return true;

    // Subdomain match
    for (const allowed of this.allowlistedDomains) {
      if (normalized.endsWith(`.${allowed}`)) return true;
    }

    return false;
  }

  /**
   * Match page content against phishing patterns.
   * Returns all matching patterns.
   */
  matchContent(text: string): SignatureMatch[] {
    const matches: SignatureMatch[] = [];

    for (const { pattern, description } of CONTENT_PATTERNS) {
      if (pattern.test(text)) {
        matches.push({
          matched: true,
          type: SignatureType.PATTERN,
          pattern: pattern.source,
          description,
        });
      }
    }

    return matches;
  }

  /**
   * Match URL against phishing URL patterns.
   * Returns all matching patterns.
   */
  matchUrlPattern(url: string): SignatureMatch[] {
    const matches: SignatureMatch[] = [];

    for (const { pattern, description } of URL_PATTERNS) {
      if (pattern.test(url)) {
        matches.push({
          matched: true,
          type: SignatureType.PATTERN,
          pattern: pattern.source,
          description,
        });
      }
    }

    return matches;
  }

  /** Add a domain to the blocklist at runtime. */
  addBlockedDomain(domain: string): void {
    this.blockedDomains.add(domain.toLowerCase());
  }

  /** Add a domain to the allowlist at runtime. */
  addAllowlistedDomain(domain: string): void {
    this.allowlistedDomains.add(domain.toLowerCase());
  }
}
