/**
 * @module C2PA Adapter Tests
 * @description TDD tests for the C2PA SDK wrapper.
 * Verifies manifest parsing, trust validation, error handling,
 * and structured result output.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { C2paAdapter, ManifestStatus } from "./c2pa-adapter";

/* ── Mock C2PA SDK ── */

function createMockSdk() {
  return {
    read: vi.fn().mockResolvedValue({
      manifestStore: {
        activeManifest: {
          label: "urn:c2pa:manifest:v2",
          claimGenerator: "Adobe Photoshop 25.0",
          signatureInfo: {
            issuer: "Adobe Inc.",
            time: "2026-01-15T10:30:00Z",
          },
          assertions: [
            {
              label: "c2pa.actions",
              data: { actions: [{ action: "c2pa.edited" }] },
            },
            { label: "c2pa.hash.data", data: {} },
          ],
          isTrusted: true,
        },
      },
    }),
  };
}

describe("C2PA Adapter", () => {
  let adapter: C2paAdapter;
  let mockSdk: ReturnType<typeof createMockSdk>;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockSdk = createMockSdk();
    adapter = new C2paAdapter(mockSdk);
  });

  /* ── Initialization ── */

  describe("initialization", () => {
    it("creates an instance", () => {
      expect(adapter).toBeInstanceOf(C2paAdapter);
    });
  });

  /* ── Valid Manifests ── */

  describe("valid manifest parsing", () => {
    it("returns VERIFIED for a valid, trusted manifest", async () => {
      const blob = new Blob(["fake-image-data"], { type: "image/jpeg" });
      const result = await adapter.validate(blob);

      expect(result.status).toBe(ManifestStatus.VERIFIED);
      expect(result.valid).toBe(true);
    });

    it("extracts signer information", async () => {
      const blob = new Blob(["data"], { type: "image/jpeg" });
      const result = await adapter.validate(blob);

      expect(result.signer).toBe("Adobe Inc.");
    });

    it("extracts claim generator", async () => {
      const blob = new Blob(["data"], { type: "image/jpeg" });
      const result = await adapter.validate(blob);

      expect(result.claimGenerator).toBe("Adobe Photoshop 25.0");
    });

    it("extracts assertions list", async () => {
      const blob = new Blob(["data"], { type: "image/jpeg" });
      const result = await adapter.validate(blob);

      expect(result.assertions).toHaveLength(2);
      expect(result.assertions[0]).toBe("c2pa.actions");
    });

    it("includes signature timestamp", async () => {
      const blob = new Blob(["data"], { type: "image/jpeg" });
      const result = await adapter.validate(blob);

      expect(result.signedAt).toBe("2026-01-15T10:30:00Z");
    });
  });

  /* ── Missing Manifests ── */

  describe("missing manifests", () => {
    it("returns UNVERIFIED when no manifest exists", async () => {
      mockSdk.read.mockResolvedValueOnce({ manifestStore: null });

      const blob = new Blob(["data"], { type: "image/jpeg" });
      const result = await adapter.validate(blob);

      expect(result.status).toBe(ManifestStatus.UNVERIFIED);
      expect(result.valid).toBe(false);
    });

    it("returns UNVERIFIED when activeManifest is null", async () => {
      mockSdk.read.mockResolvedValueOnce({
        manifestStore: { activeManifest: null },
      });

      const blob = new Blob(["data"], { type: "image/jpeg" });
      const result = await adapter.validate(blob);

      expect(result.status).toBe(ManifestStatus.UNVERIFIED);
    });
  });

  /* ── Error Handling ── */

  describe("error handling", () => {
    it("returns ERROR status on SDK failure", async () => {
      mockSdk.read.mockRejectedValueOnce(new Error("Corrupt data"));

      const blob = new Blob(["corrupt"], { type: "image/jpeg" });
      const result = await adapter.validate(blob);

      expect(result.status).toBe(ManifestStatus.ERROR);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Corrupt data");
    });
  });
});
