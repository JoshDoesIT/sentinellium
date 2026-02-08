/**
 * @module Warning Overlay
 * @description Content-script injected warning UI for phishing threats.
 * Uses Shadow DOM isolation to avoid CSS conflicts with host pages.
 *
 * Architecture:
 *   Content Script → WarningOverlay → Shadow DOM → Banner + Actions
 *
 * Severity tiers:
 *   - SUSPICIOUS: Amber warning banner
 *   - LIKELY_PHISHING: Orange caution banner
 *   - CONFIRMED_PHISHING: Red danger banner
 *
 * Accessibility: ARIA labels, keyboard navigation, focus management.
 */

/* ── Types ── */

/** Severity levels for the overlay display. */
export enum OverlaySeverity {
  SUSPICIOUS = "SUSPICIOUS",
  LIKELY_PHISHING = "LIKELY_PHISHING",
  CONFIRMED_PHISHING = "CONFIRMED_PHISHING",
}

/** Theme configuration for a severity level. */
export interface OverlayTheme {
  accentColor: string;
  bgColor: string;
  textColor: string;
  icon: string;
  label: string;
}

/** Overlay configuration. */
export interface OverlayConfig {
  severity: OverlaySeverity;
  domain: string;
  score: number;
  signals: string[];
  onDismiss: () => void;
  onReport: () => void;
  onProceed: () => void;
}

/** Individual action button. */
export interface OverlayAction {
  id: string;
  label: string;
  handler: () => void;
  variant: "primary" | "secondary" | "danger";
}

/* ── Theme Map ── */

const THEMES: Record<OverlaySeverity, OverlayTheme> = {
  [OverlaySeverity.SUSPICIOUS]: {
    accentColor: "var(--sentinel-amber, #f59e0b)",
    bgColor: "rgba(245, 158, 11, 0.08)",
    textColor: "#92400e",
    icon: "⚠️",
    label: "Suspicious Page Detected",
  },
  [OverlaySeverity.LIKELY_PHISHING]: {
    accentColor: "var(--sentinel-orange, #f97316)",
    bgColor: "rgba(249, 115, 22, 0.08)",
    textColor: "#9a3412",
    icon: "🚨",
    label: "Likely Phishing Detected",
  },
  [OverlaySeverity.CONFIRMED_PHISHING]: {
    accentColor: "var(--sentinel-red, #ef4444)",
    bgColor: "rgba(239, 68, 68, 0.08)",
    textColor: "#991b1b",
    icon: "🛑",
    label: "Confirmed Phishing — Do Not Proceed",
  },
};

/* ── Overlay Builder ── */

/**
 * Builds and manages the warning overlay.
 *
 * This class generates the HTML/CSS for the overlay and
 * provides action handlers. The caller is responsible for
 * inserting the generated HTML into a Shadow DOM root.
 */
export class WarningOverlay {
  readonly config: OverlayConfig;

  constructor(config: OverlayConfig) {
    this.config = config;
  }

  /** Get the theme for the configured severity level. */
  getTheme(): OverlayTheme {
    return THEMES[this.config.severity];
  }

  /** Get the available user actions. */
  getActions(): OverlayAction[] {
    return [
      {
        id: "dismiss",
        label: "Dismiss",
        handler: this.config.onDismiss,
        variant: "secondary",
      },
      {
        id: "report",
        label: "Report",
        handler: this.config.onReport,
        variant: "primary",
      },
      {
        id: "proceed",
        label: "Proceed Anyway",
        handler: this.config.onProceed,
        variant: "danger",
      },
    ];
  }

  /**
   * Build the complete HTML for the warning overlay.
   * Designed to be injected into a Shadow DOM root.
   */
  buildHtml(): string {
    const theme = this.getTheme();
    const actions = this.getActions();
    const signalsList = this.config.signals
      .map((s) => `<li class="sentinellium-signal">${this.escapeHtml(s)}</li>`)
      .join("\n");

    const actionButtons = actions
      .map(
        (action) =>
          `<button class="sentinellium-btn sentinellium-btn--${action.variant}" data-action="${action.id}" aria-label="${action.label}">${action.label}</button>`,
      )
      .join("\n");

    return `
<div class="sentinellium-overlay" role="alert" aria-label="Sentinellium Security Warning" style="--accent: ${theme.accentColor}; --bg: ${theme.bgColor}; --text: ${theme.textColor};">
  <div class="sentinellium-banner">
    <div class="sentinellium-header">
      <span class="sentinellium-icon">${theme.icon}</span>
      <h2 class="sentinellium-title">${theme.label}</h2>
    </div>
    <div class="sentinellium-body">
      <p class="sentinellium-domain">
        Domain: <strong>${this.escapeHtml(this.config.domain)}</strong>
      </p>
      <p class="sentinellium-score">
        Risk Score: <strong>${this.config.score}/100</strong>
      </p>
      <ul class="sentinellium-signals" aria-label="Detected signals">
        ${signalsList}
      </ul>
    </div>
    <div class="sentinellium-actions">
      ${actionButtons}
    </div>
    <p class="sentinellium-footer">
      Protected by <strong>Sentinellium</strong>
    </p>
  </div>
</div>`;
  }

  /** Escape HTML to prevent XSS in injected content. */
  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}
