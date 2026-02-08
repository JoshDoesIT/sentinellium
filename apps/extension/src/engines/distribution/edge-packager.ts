/**
 * @module Edge Packager
 * @description Edge Add-ons packaging pipeline.
 * Generates Edge-compatible MV3 manifests with update URL support.
 */

/* ── Types ── */

export interface EdgeConfig {
  extensionId: string;
  version: string;
  name: string;
  description: string;
}

export interface EdgeManifest {
  manifest_version: 3;
  name: string;
  version: string;
  description: string;
  permissions: string[];
  update_url?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface BuildArtifact {
  platform: string;
  version: string;
  files: string[];
  createdAt: number;
}

/* ── Packager ── */

/**
 * Edge Add-ons packaging pipeline.
 */
export class EdgePackager {
  private readonly config: EdgeConfig;
  private readonly permissions: string[] = [];
  private updateUrl?: string;

  constructor(config: EdgeConfig) {
    this.config = config;
  }

  /**
   * Set the Edge update URL.
   *
   * @param url - Update URL
   */
  setUpdateUrl(url: string): void {
    this.updateUrl = url;
  }

  /** Generate an Edge-compatible MV3 manifest. */
  generateManifest(): EdgeManifest {
    const manifest: EdgeManifest = {
      manifest_version: 3,
      name: this.config.name,
      version: this.config.version,
      description: this.config.description,
      permissions: [...this.permissions],
    };
    if (this.updateUrl) {
      manifest.update_url = this.updateUrl;
    }
    return manifest;
  }

  /** Validate the packaging configuration. */
  validate(): ValidationResult {
    const errors: string[] = [];
    if (!this.config.name) errors.push("Extension name is required");
    if (!this.config.version) errors.push("Version is required");
    return { valid: errors.length === 0, errors };
  }

  /** Produce an Edge-specific build artifact. */
  buildArtifact(): BuildArtifact {
    return {
      platform: "edge",
      version: this.config.version,
      files: ["manifest.json", "background.js", "content.js", "popup.html"],
      createdAt: Date.now(),
    };
  }
}
