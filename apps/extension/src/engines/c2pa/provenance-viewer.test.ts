/**
 * @module Provenance Viewer Tests
 * @description TDD tests for the provenance history viewer.
 * Builds structured provenance data from C2PA manifests
 * for UI rendering.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { ProvenanceViewer } from "./provenance-viewer";
import { ManifestStatus } from "./c2pa-adapter";

describe("Provenance Viewer", () => {
  let viewer: ProvenanceViewer;

  beforeEach(() => {
    viewer = new ProvenanceViewer();
  });

  /* ── Initialization ── */

  describe("initialization", () => {
    it("creates an instance", () => {
      expect(viewer).toBeInstanceOf(ProvenanceViewer);
    });
  });

  /* ── History Building ── */

  describe("history building", () => {
    it("builds provenance history from a valid manifest", () => {
      const history = viewer.buildHistory({
        valid: true,
        status: ManifestStatus.VERIFIED,
        signer: "Adobe Inc.",
        claimGenerator: "Adobe Photoshop 25.0",
        assertions: ["c2pa.actions", "c2pa.hash.data"],
        signedAt: "2026-01-15T10:30:00Z",
      });

      expect(history.signer).toBe("Adobe Inc.");
      expect(history.tool).toBe("Adobe Photoshop 25.0");
      expect(history.signedAt).toBe("2026-01-15T10:30:00Z");
      expect(history.verified).toBe(true);
    });

    it("extracts action assertions", () => {
      const history = viewer.buildHistory({
        valid: true,
        status: ManifestStatus.VERIFIED,
        signer: "Adobe Inc.",
        claimGenerator: "Photoshop",
        assertions: ["c2pa.actions", "c2pa.hash.data", "c2pa.ingredient"],
        signedAt: "2026-01-15T10:30:00Z",
      });

      expect(history.assertions).toContain("c2pa.actions");
      expect(history.assertions).toContain("c2pa.ingredient");
    });

    it("handles missing signer gracefully", () => {
      const history = viewer.buildHistory({
        valid: false,
        status: ManifestStatus.UNVERIFIED,
        signer: null,
        claimGenerator: null,
        assertions: [],
        signedAt: null,
      });

      expect(history.signer).toBe("Unknown");
      expect(history.tool).toBe("Unknown");
      expect(history.verified).toBe(false);
    });
  });

  /* ── Summary Generation ── */

  describe("summary generation", () => {
    it("generates a human-readable summary for verified media", () => {
      const summary = viewer.buildSummary({
        signer: "Adobe Inc.",
        tool: "Photoshop",
        signedAt: "2026-01-15T10:30:00Z",
        verified: true,
        assertions: ["c2pa.actions"],
        trustAnchor: "Adobe",
      });

      expect(summary).toContain("Adobe Inc.");
      expect(summary).toContain("verified");
    });

    it("generates a warning summary for unverified media", () => {
      const summary = viewer.buildSummary({
        signer: "Unknown",
        tool: "Unknown",
        signedAt: null,
        verified: false,
        assertions: [],
        trustAnchor: null,
      });

      expect(summary).toContain("unverified");
    });
  });

  /* ── Trust Anchor ── */

  describe("trust anchor", () => {
    it("identifies known trust anchors", () => {
      const history = viewer.buildHistory({
        valid: true,
        status: ManifestStatus.VERIFIED,
        signer: "Adobe Inc.",
        claimGenerator: "Photoshop",
        assertions: ["c2pa.actions"],
        signedAt: "2026-01-15T10:30:00Z",
      });

      expect(history.trustAnchor).toBe("Adobe");
    });

    it("returns null for unknown signers", () => {
      const history = viewer.buildHistory({
        valid: true,
        status: ManifestStatus.VERIFIED,
        signer: "Random Corp",
        claimGenerator: "Custom Tool",
        assertions: [],
        signedAt: "2026-01-15T10:30:00Z",
      });

      expect(history.trustAnchor).toBeNull();
    });
  });
});
