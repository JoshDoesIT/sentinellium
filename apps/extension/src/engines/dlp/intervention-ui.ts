/**
 * @module Intervention UI
 * @description Browser intervention modal when PII is detected
 * on LLM platforms. Presents Allow, Block, and Anonymize options.
 */
import { PiiType } from "./pii-detector";

/* ── Types ── */

/** User action choices. */
export enum InterventionAction {
  ALLOW = "ALLOW",
  BLOCK = "BLOCK",
  ANONYMIZE = "ANONYMIZE",
}

/** PII summary for display. */
export interface PiiSummaryItem {
  type: PiiType;
  count: number;
}

/** Modal configuration. */
export interface ModalConfig {
  domain: string;
  platform: string;
  piiSummary: PiiSummaryItem[];
}

/* ── Constants ── */

const PII_LABELS: Record<PiiType, string> = {
  [PiiType.SSN]: "SSN",
  [PiiType.CREDIT_CARD]: "Credit Card",
  [PiiType.EMAIL]: "Email",
  [PiiType.PHONE]: "Phone",
  [PiiType.API_KEY]: "API Key",
  [PiiType.CUSTOM]: "Custom PII",
};

/* ── UI ── */

/**
 * Builds the DLP intervention modal UI.
 */
export class InterventionUi {
  /**
   * Build the intervention modal HTML.
   *
   * @param config - Modal configuration with domain and PII summary
   * @returns HTML string for Shadow DOM injection
   */
  buildModal(config: ModalConfig): string {
    const summaryHtml = config.piiSummary
      .map(
        (item) =>
          `<li class="sentinellium-dlp-item">${item.count} ${PII_LABELS[item.type]}</li>`,
      )
      .join("\n");

    return `
<div class="sentinellium-dlp-modal" role="dialog" aria-label="Sensitive data detected" aria-modal="true">
  <div class="sentinellium-dlp-backdrop"></div>
  <div class="sentinellium-dlp-content" tabindex="-1">
    <h2 class="sentinellium-dlp-title">⚠ Sensitive Data Detected</h2>
    <p class="sentinellium-dlp-desc">
      Sentinellium detected the following in your input to <strong>${this.escapeHtml(config.platform)}</strong>:
    </p>
    <ul class="sentinellium-dlp-list">
      ${summaryHtml}
    </ul>
    <div class="sentinellium-dlp-actions">
      <button class="sentinellium-dlp-btn sentinellium-dlp-btn--block" data-action="block" aria-label="Block submission">Block</button>
      <button class="sentinellium-dlp-btn sentinellium-dlp-btn--anon" data-action="anonymize" aria-label="Anonymize and send">Anonymize & Send</button>
      <button class="sentinellium-dlp-btn sentinellium-dlp-btn--allow" data-action="allow" aria-label="Allow submission">Allow</button>
    </div>
  </div>
</div>`;
  }

  /**
   * Format PII summary for display.
   *
   * @param items - PII summary items
   * @returns Human-readable string
   */
  formatPiiSummary(items: PiiSummaryItem[]): string {
    return items
      .map((item) => `${item.count} ${PII_LABELS[item.type]}`)
      .join(", ");
  }

  /**
   * Parse an action string from a button click.
   *
   * @param action - Action string from data-action attribute
   * @returns InterventionAction enum value
   */
  parseAction(action: string): InterventionAction {
    switch (action.toLowerCase()) {
      case "allow":
        return InterventionAction.ALLOW;
      case "anonymize":
        return InterventionAction.ANONYMIZE;
      case "block":
      default:
        return InterventionAction.BLOCK;
    }
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
