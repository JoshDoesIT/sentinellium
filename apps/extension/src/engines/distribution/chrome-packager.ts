/**
 * @module Chrome Packager
 * @description Chrome Web Store packaging pipeline.
 * Generates MV3 manifests, validates configuration, and produces build artifacts.
 */

/* ── Types ── */

export interface ChromeConfig {
  extensionId: string;
  version: string;
  name: string;
  description: string;
}

export interface ChromeManifest {
  manifest_version: 3;
  name: string;
  version: string;
  description: string;
  permissions: string[];
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
 * Chrome Web Store packaging pipeline.
 */
export class ChromePackager {
  private readonly config: ChromeConfig;
  private readonly permissions: string[] = [];

  constructor(config: ChromeConfig) {
    this.config = config;
  }

  /**
   * Add a permission to the manifest.
   *
   * @param permission - Chrome permission string
   */
  addPermission(permission: string): void {
    if (!this.permissions.includes(permission)) {
      this.permissions.push(permission);
    }
  }

  /** Generate a Chrome MV3 manifest. */
  generateManifest(): ChromeManifest {
    return {
      manifest_version: 3,
      name: this.config.name,
      version: this.config.version,
      description: this.config.description,
      permissions: [...this.permissions],
    };
  }

  /** Validate the packaging configuration. */
  validate(): ValidationResult {
    const errors: string[] = [];
    if (!this.config.name) errors.push("Extension name is required");
    if (!this.config.version) errors.push("Version is required");
    if (!this.config.extensionId) errors.push("Extension ID is required");
    return { valid: errors.length === 0, errors };
  }

  /** Produce a build artifact. */
  buildArtifact(): BuildArtifact {
    return {
      platform: "chrome",
      version: this.config.version,
      files: ["manifest.json", "background.js", "content.js", "popup.html"],
      createdAt: Date.now(),
    };
  }
}
