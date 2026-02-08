/**
 * @module High-Stakes Context Detector
 * @description Detects when media appears in sensitive contexts
 * where provenance verification is critical.
 *
 * Context levels:
 *   - NORMAL: General browsing — no special treatment
 *   - ELEVATED: News/media sites — subtle indicator
 *   - HIGH_STAKES: Financial, executive, HR/legal — prominent warning
 */

/* ── Types ── */

/** Context sensitivity level. */
export enum ContextLevel {
  NORMAL = "NORMAL",
  ELEVATED = "ELEVATED",
  HIGH_STAKES = "HIGH_STAKES",
}

/** Page context input for classification. */
export interface PageContext {
  domain: string;
  pageTitle: string;
  pageText: string;
  url: string;
}

/** Classification result. */
export interface ContextResult {
  level: ContextLevel;
  signals: string[];
}

/* ── Constants ── */

/** Keywords indicating financial context. */
const FINANCIAL_KEYWORDS = [
  "wire transfer",
  "invoice",
  "payment",
  "bank",
  "transfer",
  "routing number",
  "account number",
];

/** Keywords indicating executive communications. */
const EXEC_KEYWORDS = [
  "ceo",
  "cfo",
  "cto",
  "chief",
  "executive",
  "quarterly earnings",
  "board of directors",
  "investor",
];

/** Keywords indicating HR/legal context. */
const LEGAL_KEYWORDS = [
  "contract",
  "employment",
  "agreement",
  "termination",
  "nda",
  "confidential",
  "legal",
  "compliance",
];

/** Known news domains (partial match). */
const NEWS_DOMAINS = [
  "cnn.com",
  "bbc.co.uk",
  "bbc.com",
  "reuters.com",
  "apnews.com",
  "nytimes.com",
  "washingtonpost.com",
  "theguardian.com",
  "aljazeera.com",
  "nbcnews.com",
  "cbsnews.com",
  "abcnews.go.com",
  "foxnews.com",
  "bloomberg.com",
];

/* ── Detector ── */

/**
 * Classifies page context for media provenance importance.
 */
export class HighStakesDetector {
  /**
   * Classify the sensitivity level of the current page context.
   *
   * @param context - Page metadata for classification
   * @returns Context level and matching signals
   */
  classify(context: PageContext): ContextResult {
    const signals: string[] = [];
    const combined = `${context.pageTitle} ${context.pageText}`.toLowerCase();

    // Check financial keywords
    for (const kw of FINANCIAL_KEYWORDS) {
      if (combined.includes(kw)) {
        signals.push(`financial:${kw}`);
      }
    }

    // Check executive communication keywords
    for (const kw of EXEC_KEYWORDS) {
      if (combined.includes(kw)) {
        signals.push(`executive:${kw}`);
      }
    }

    // Check HR/legal keywords
    for (const kw of LEGAL_KEYWORDS) {
      if (combined.includes(kw)) {
        signals.push(`legal:${kw}`);
      }
    }

    // Determine level
    if (signals.length > 0) {
      return { level: ContextLevel.HIGH_STAKES, signals };
    }

    // Check news domains
    const domainLower = context.domain.toLowerCase();
    for (const newsDomain of NEWS_DOMAINS) {
      if (
        domainLower === newsDomain ||
        domainLower.endsWith(`.${newsDomain}`)
      ) {
        return {
          level: ContextLevel.ELEVATED,
          signals: [`news_domain:${newsDomain}`],
        };
      }
    }

    return { level: ContextLevel.NORMAL, signals: [] };
  }
}
