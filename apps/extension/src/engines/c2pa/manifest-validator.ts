/**
 * @module Manifest Validator
 * @description Orchestrates media validation: fetch media blob,
 * validate via C2PA adapter, classify result, and cache by URL.
 *
 * Flow: URL → fetch blob → C2PA adapter → classify → cache result
 */
import { type ManifestResult, ManifestStatus } from "./c2pa-adapter";

/* ── Types ── */

/** Validation status (extends C2PA status with fetch errors). */
export enum ValidationStatus {
  VERIFIED = "VERIFIED",
  UNVERIFIED = "UNVERIFIED",
  TAMPERED = "TAMPERED",
  FETCH_ERROR = "FETCH_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
}

/** Full validation result for a media URL. */
export interface ValidationResult {
  /** The validated URL. */
  url: string;
  /** Validation status. */
  status: ValidationStatus;
  /** Signer identity. */
  signer: string | null;
  /** Claim generator tool. */
  claimGenerator: string | null;
  /** Assertion labels. */
  assertions: string[];
  /** Signature timestamp. */
  signedAt: string | null;
  /** Error message if validation failed. */
  error?: string;
}

/** C2PA adapter interface (injectable). */
interface C2paAdapterDep {
  validate(blob: Blob): Promise<ManifestResult>;
}

/* ── Validator ── */

/**
 * Validates media URLs for C2PA provenance.
 *
 * Caches results by URL to avoid redundant fetches.
 */
export class ManifestValidator {
  private readonly adapter: C2paAdapterDep;
  private readonly fetchFn: typeof fetch;
  private readonly cache = new Map<string, ValidationResult>();

  constructor(adapter: C2paAdapterDep, fetchFn: typeof fetch) {
    this.adapter = adapter;
    this.fetchFn = fetchFn;
  }

  /**
   * Validate a media URL for C2PA provenance.
   *
   * @param url - The media URL to validate
   * @returns Validation result with status, signer, and metadata
   */
  async validate(url: string): Promise<ValidationResult> {
    // Check cache first
    const cached = this.cache.get(url);
    if (cached) return cached;

    // Fetch the media blob
    let blob: Blob;
    try {
      const response = await this.fetchFn(url);
      if (!response.ok) {
        const errResult = this.buildError(
          url,
          ValidationStatus.FETCH_ERROR,
          `HTTP ${response.status}`,
        );
        this.cache.set(url, errResult);
        return errResult;
      }
      blob = await response.blob();
    } catch (error) {
      const errResult = this.buildError(
        url,
        ValidationStatus.FETCH_ERROR,
        error instanceof Error ? error.message : "Fetch failed",
      );
      // Don't cache network errors — they may be transient
      return errResult;
    }

    // Validate via C2PA adapter
    const manifestResult = await this.adapter.validate(blob);
    const result = this.mapResult(url, manifestResult);
    this.cache.set(url, result);
    return result;
  }

  /** Map C2PA adapter result to validation result. */
  private mapResult(url: string, manifest: ManifestResult): ValidationResult {
    return {
      url,
      status: this.mapStatus(manifest.status),
      signer: manifest.signer,
      claimGenerator: manifest.claimGenerator,
      assertions: manifest.assertions,
      signedAt: manifest.signedAt,
      error: manifest.error,
    };
  }

  /** Map C2PA ManifestStatus to ValidationStatus. */
  private mapStatus(status: ManifestStatus): ValidationStatus {
    switch (status) {
      case ManifestStatus.VERIFIED:
        return ValidationStatus.VERIFIED;
      case ManifestStatus.UNVERIFIED:
        return ValidationStatus.UNVERIFIED;
      case ManifestStatus.TAMPERED:
        return ValidationStatus.TAMPERED;
      case ManifestStatus.ERROR:
        return ValidationStatus.VALIDATION_ERROR;
    }
  }

  /** Build an error result. */
  private buildError(
    url: string,
    status: ValidationStatus,
    error: string,
  ): ValidationResult {
    return {
      url,
      status,
      signer: null,
      claimGenerator: null,
      assertions: [],
      signedAt: null,
      error,
    };
  }
}
