/**
 * @module Verified Overlay
 * @description Injects visual badges on media with valid C2PA manifests.
 * Green checkmark for verified media, "CR" pin for Content Credentials.
 * Positioned relative to the media element (top-right by default).
 *
 * Designed for Shadow DOM injection to avoid CSS conflicts.
 */

/* ── Types ── */

/** Badge types for verified media. */
export enum BadgeType {
  CHECKMARK = "CHECKMARK",
  CR_PIN = "CR_PIN",
}

/** Position corner for the badge. */
export type BadgePosition =
  | "top-right"
  | "top-left"
  | "bottom-right"
  | "bottom-left";

/** Badge configuration for HTML generation. */
export interface VerifiedBadgeConfig {
  badgeType: BadgeType;
  signer: string;
  signedAt: string;
  claimGenerator: string;
}

/** Options for badge type detection. */
interface BadgeTypeInput {
  signer: string;
  assertions: string[];
  isContentCredentials?: boolean;
}

/** Overlay configuration. */
interface OverlayOptions {
  position?: BadgePosition;
}

/* ── Overlay ── */

/**
 * Builds verified media badges for C2PA-signed content.
 */
export class VerifiedOverlay {
  private readonly position: BadgePosition;

  constructor(options?: OverlayOptions) {
    this.position = options?.position ?? "top-right";
  }

  /** Determine the appropriate badge type for a manifest. */
  static getBadgeType(input: BadgeTypeInput): BadgeType {
    if (input.isContentCredentials) {
      return BadgeType.CR_PIN;
    }
    return BadgeType.CHECKMARK;
  }

  /** Get the badge position config. */
  getPosition(): { corner: BadgePosition } {
    return { corner: this.position };
  }

  /**
   * Build HTML for a verified badge.
   *
   * @param config - Badge configuration
   * @returns HTML string for Shadow DOM injection
   */
  buildBadgeHtml(config: VerifiedBadgeConfig): string {
    const isCr = config.badgeType === BadgeType.CR_PIN;
    const badgeClass = isCr
      ? "sentinellium-badge cr-pin"
      : "sentinellium-badge verified";
    const icon = isCr ? "CR" : "✓";
    const label = isCr ? "Content Credentials verified" : "C2PA verified media";

    return `
<div class="${badgeClass}" role="status" aria-label="${label}" tabindex="0">
  <span class="sentinellium-badge-icon">${icon}</span>
  <div class="sentinellium-badge-tooltip">
    <p class="sentinellium-badge-signer">Signed by: <strong>${this.escapeHtml(config.signer)}</strong></p>
    <p class="sentinellium-badge-tool">Tool: ${this.escapeHtml(config.claimGenerator)}</p>
    <p class="sentinellium-badge-time">Signed: ${this.escapeHtml(config.signedAt)}</p>
  </div>
</div>`;
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
