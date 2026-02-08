/**
 * @module Unverified Flagger
 * @description Flags media without C2PA provenance in sensitive contexts.
 * Purely informational — does not block. Users can dismiss per-image
 * or per-domain.
 */

/* ── Types ── */

/** Configuration for flagging decisions. */
export interface FlagConfig {
  domain: string;
  contextKeywords: string[];
  isHighStakes: boolean;
}

/** Flagging result. */
export interface FlagResult {
  shouldFlag: boolean;
  reason: string;
}

/* ── Flagger ── */

/**
 * Determines whether unverified media should be flagged
 * and generates the indicator UI.
 */
export class UnverifiedFlagger {
  private readonly dismissedUrls = new Set<string>();
  private readonly dismissedDomains = new Set<string>();

  /**
   * Determine if unverified media should be flagged.
   *
   * Only flags in high-stakes contexts to avoid alert fatigue.
   */
  shouldFlag(config: FlagConfig): FlagResult {
    if (config.isHighStakes) {
      return {
        shouldFlag: true,
        reason: "Unverified media in high-stakes context",
      };
    }

    return {
      shouldFlag: false,
      reason: "Normal browsing context",
    };
  }

  /**
   * Build HTML for the unverified indicator.
   *
   * @param filename - Display name for the media
   * @returns HTML string for injection
   */
  buildIndicatorHtml(filename: string): string {
    return `
<div class="sentinellium-unverified" role="status" aria-label="Unverified media: no provenance data">
  <span class="sentinellium-unverified-icon">⚠</span>
  <span class="sentinellium-unverified-label">Unverified</span>
  <button class="sentinellium-unverified-dismiss" data-action="dismiss" aria-label="Dismiss for ${this.escapeHtml(filename)}">×</button>
</div>`;
  }

  /** Dismiss a specific URL. */
  dismiss(url: string): void {
    this.dismissedUrls.add(url);
  }

  /** Dismiss all media from a domain. */
  dismissDomain(domain: string): void {
    this.dismissedDomains.add(domain);
  }

  /** Check if a URL has been dismissed. */
  isDismissed(url: string): boolean {
    return this.dismissedUrls.has(url);
  }

  /** Check if a domain has been dismissed. */
  isDomainDismissed(domain: string): boolean {
    return this.dismissedDomains.has(domain);
  }

  /** Escape HTML entities. */
  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}
