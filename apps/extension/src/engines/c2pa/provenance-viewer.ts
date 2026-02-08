/**
 * @module Provenance Viewer
 * @description Builds structured provenance data from C2PA manifests
 * for UI rendering. Extracts signer chain, edit history,
 * tool chain, and trust anchor verification.
 */
import { type ManifestResult } from "./c2pa-adapter";

/* ── Types ── */

/** Structured provenance history for UI. */
export interface ProvenanceHistory {
  signer: string;
  tool: string;
  signedAt: string | null;
  verified: boolean;
  assertions: string[];
  trustAnchor: string | null;
}

/* ── Constants ── */

/** Known trust anchors and their signer patterns. */
const TRUST_ANCHORS: Array<{ pattern: string; name: string }> = [
  { pattern: "adobe", name: "Adobe" },
  { pattern: "google", name: "Google" },
  { pattern: "microsoft", name: "Microsoft" },
  { pattern: "sony", name: "Sony" },
  { pattern: "nikon", name: "Nikon" },
  { pattern: "canon", name: "Canon" },
  { pattern: "leica", name: "Leica" },
  { pattern: "associated press", name: "Associated Press" },
  { pattern: "reuters", name: "Reuters" },
  { pattern: "bbc", name: "BBC" },
];

/* ── Viewer ── */

/**
 * Builds provenance data from C2PA manifests for display.
 */
export class ProvenanceViewer {
  /**
   * Build provenance history from a manifest result.
   *
   * @param manifest - C2PA adapter result
   * @returns Structured provenance for UI rendering
   */
  buildHistory(manifest: ManifestResult): ProvenanceHistory {
    return {
      signer: manifest.signer ?? "Unknown",
      tool: manifest.claimGenerator ?? "Unknown",
      signedAt: manifest.signedAt,
      verified: manifest.valid,
      assertions: manifest.assertions,
      trustAnchor: this.resolveTrustAnchor(manifest.signer),
    };
  }

  /**
   * Generate a human-readable summary string.
   *
   * @param history - Provenance history data
   * @returns Plain text summary
   */
  buildSummary(history: ProvenanceHistory): string {
    if (!history.verified) {
      return "This media is unverified. No valid C2PA provenance data was found.";
    }

    const parts = [
      `This media is verified and signed by ${history.signer}`,
      history.tool !== "Unknown" ? `using ${history.tool}` : "",
      history.signedAt ? `on ${history.signedAt}` : "",
    ].filter(Boolean);

    return parts.join(" ") + ".";
  }

  /** Resolve a signer string to a known trust anchor. */
  private resolveTrustAnchor(signer: string | null): string | null {
    if (!signer) return null;

    const signerLower = signer.toLowerCase();
    for (const anchor of TRUST_ANCHORS) {
      if (signerLower.includes(anchor.pattern)) {
        return anchor.name;
      }
    }

    return null;
  }
}
