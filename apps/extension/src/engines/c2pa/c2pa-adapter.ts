/**
 * @module C2PA Adapter
 * @description Wraps the C2PA JS SDK for extension use.
 * Parses C2PA manifests from media blobs and returns
 * structured validation results.
 *
 * The actual C2PA SDK is injected for testability.
 * In production, use `c2pa-js` (`@contentauth/sdk`).
 */

/* ── Types ── */

/** Manifest validation status. */
export enum ManifestStatus {
  VERIFIED = "VERIFIED",
  UNVERIFIED = "UNVERIFIED",
  TAMPERED = "TAMPERED",
  ERROR = "ERROR",
}

/** Structured result from manifest validation. */
export interface ManifestResult {
  /** Whether the manifest is valid and trusted. */
  valid: boolean;
  /** Validation status. */
  status: ManifestStatus;
  /** Signer identity (e.g., "Adobe Inc."). */
  signer: string | null;
  /** Claim generator (e.g., "Adobe Photoshop 25.0"). */
  claimGenerator: string | null;
  /** Assertion labels present in the manifest. */
  assertions: string[];
  /** Signature timestamp (ISO 8601). */
  signedAt: string | null;
  /** Error message if validation failed. */
  error?: string;
}

/** C2PA SDK interface (injectable for testing). */
interface C2paSdkDep {
  read(blob: Blob): Promise<C2paReadResult>;
}

/** C2PA SDK read result shape. */
interface C2paReadResult {
  manifestStore: {
    activeManifest: {
      label: string;
      claimGenerator: string;
      signatureInfo: {
        issuer: string;
        time: string;
      };
      assertions: Array<{ label: string; data: unknown }>;
      isTrusted: boolean;
    } | null;
  } | null;
}

/* ── Adapter ── */

/**
 * Validates C2PA manifests in media blobs.
 *
 * Usage:
 * ```ts
 * const adapter = new C2paAdapter(c2paSdk);
 * const result = await adapter.validate(imageBlob);
 * if (result.status === ManifestStatus.VERIFIED) { ... }
 * ```
 */
export class C2paAdapter {
  private readonly sdk: C2paSdkDep;

  constructor(sdk: C2paSdkDep) {
    this.sdk = sdk;
  }

  /**
   * Validate a media blob for C2PA provenance.
   *
   * @param blob - The media data to validate
   * @returns Structured manifest result
   */
  async validate(blob: Blob): Promise<ManifestResult> {
    try {
      const result = await this.sdk.read(blob);

      const store = result.manifestStore;
      if (!store || !store.activeManifest) {
        return {
          valid: false,
          status: ManifestStatus.UNVERIFIED,
          signer: null,
          claimGenerator: null,
          assertions: [],
          signedAt: null,
        };
      }

      const manifest = store.activeManifest;

      return {
        valid: manifest.isTrusted,
        status: manifest.isTrusted
          ? ManifestStatus.VERIFIED
          : ManifestStatus.TAMPERED,
        signer: manifest.signatureInfo?.issuer ?? null,
        claimGenerator: manifest.claimGenerator ?? null,
        assertions: manifest.assertions.map((a) => a.label),
        signedAt: manifest.signatureInfo?.time ?? null,
      };
    } catch (error) {
      return {
        valid: false,
        status: ManifestStatus.ERROR,
        signer: null,
        claimGenerator: null,
        assertions: [],
        signedAt: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
