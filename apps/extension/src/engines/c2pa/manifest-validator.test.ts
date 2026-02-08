/**
 * @module Manifest Validator Tests
 * @description TDD tests for the manifest validation pipeline.
 * Orchestrates media fetch → C2PA validation → classification → caching.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ManifestValidator, ValidationStatus } from "./manifest-validator";
import { ManifestStatus } from "./c2pa-adapter";

/* ── Mock Dependencies ── */

function createMockAdapter() {
  return {
    validate: vi.fn().mockResolvedValue({
      valid: true,
      status: ManifestStatus.VERIFIED,
      signer: "Adobe Inc.",
      claimGenerator: "Photoshop",
      assertions: ["c2pa.actions"],
      signedAt: "2026-01-15T10:30:00Z",
    }),
  };
}

function createMockFetch() {
  return vi.fn().mockResolvedValue({
    ok: true,
    blob: async () => new Blob(["image-data"], { type: "image/jpeg" }),
  });
}

describe("Manifest Validator", () => {
  let validator: ManifestValidator;
  let mockAdapter: ReturnType<typeof createMockAdapter>;
  let mockFetch: ReturnType<typeof createMockFetch>;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockAdapter = createMockAdapter();
    mockFetch = createMockFetch();
    validator = new ManifestValidator(mockAdapter, mockFetch);
  });

  /* ── Initialization ── */

  describe("initialization", () => {
    it("creates an instance", () => {
      expect(validator).toBeInstanceOf(ManifestValidator);
    });
  });

  /* ── Full Validation Flow ── */

  describe("full validation flow", () => {
    it("fetches media and validates via C2PA adapter", async () => {
      const result = await validator.validate("https://example.com/photo.jpg");

      expect(mockFetch).toHaveBeenCalledWith("https://example.com/photo.jpg");
      expect(mockAdapter.validate).toHaveBeenCalled();
      expect(result.status).toBe(ValidationStatus.VERIFIED);
    });

    it("returns manifest details on success", async () => {
      const result = await validator.validate("https://example.com/photo.jpg");

      expect(result.signer).toBe("Adobe Inc.");
      expect(result.claimGenerator).toBe("Photoshop");
    });
  });

  /* ── Classification ── */

  describe("classification", () => {
    it("classifies VERIFIED for trusted manifests", async () => {
      const result = await validator.validate("https://example.com/photo.jpg");
      expect(result.status).toBe(ValidationStatus.VERIFIED);
    });

    it("classifies UNVERIFIED for no manifest", async () => {
      mockAdapter.validate.mockResolvedValue({
        valid: false,
        status: ManifestStatus.UNVERIFIED,
        signer: null,
        claimGenerator: null,
        assertions: [],
        signedAt: null,
      });

      const result = await validator.validate("https://example.com/photo.jpg");
      expect(result.status).toBe(ValidationStatus.UNVERIFIED);
    });

    it("classifies TAMPERED for invalid manifests", async () => {
      mockAdapter.validate.mockResolvedValue({
        valid: false,
        status: ManifestStatus.TAMPERED,
        signer: "Unknown",
        claimGenerator: null,
        assertions: [],
        signedAt: null,
      });

      const result = await validator.validate("https://example.com/photo.jpg");
      expect(result.status).toBe(ValidationStatus.TAMPERED);
    });
  });

  /* ── Caching ── */

  describe("caching", () => {
    it("caches results by URL", async () => {
      await validator.validate("https://example.com/photo.jpg");
      await validator.validate("https://example.com/photo.jpg");

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("does not cache different URLs", async () => {
      await validator.validate("https://example.com/photo1.jpg");
      await validator.validate("https://example.com/photo2.jpg");

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  /* ── Error Handling ── */

  describe("error handling", () => {
    it("returns FETCH_ERROR on network failure", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await validator.validate("https://example.com/photo.jpg");
      expect(result.status).toBe(ValidationStatus.FETCH_ERROR);
      expect(result.error).toContain("Network error");
    });

    it("returns FETCH_ERROR on non-200 response", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

      const result = await validator.validate(
        "https://example.com/missing.jpg",
      );
      expect(result.status).toBe(ValidationStatus.FETCH_ERROR);
    });
  });
});
