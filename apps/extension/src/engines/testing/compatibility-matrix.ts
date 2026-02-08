/**
 * @module Compatibility Matrix
 * @description Cross-browser compatibility matrix.
 * Tracks feature support across browsers and identifies gaps.
 */

/* ── Types ── */

export enum SupportLevel {
  FULL = "full",
  PARTIAL = "partial",
  NONE = "none",
}

export interface BrowserEntry {
  name: string;
  version: string;
  engine: string;
}

export interface FeatureEntry {
  id: string;
  name: string;
  support: Record<string, SupportLevel>;
}

export interface CompatibilityGap {
  browser: string;
  featureId: string;
  featureName: string;
  level: SupportLevel;
}

export interface CompatibilityReport {
  browsers: BrowserEntry[];
  features: FeatureEntry[];
  overallScore: number;
  gaps: CompatibilityGap[];
}

/* ── Matrix ── */

/**
 * Cross-browser compatibility matrix.
 */
export class CompatibilityMatrix {
  private readonly browsers: BrowserEntry[] = [];
  private readonly features: FeatureEntry[] = [];

  /**
   * Add a browser.
   *
   * @param browser - Browser entry
   */
  addBrowser(browser: BrowserEntry): void {
    this.browsers.push(browser);
  }

  /** Get all browsers. */
  getBrowsers(): BrowserEntry[] {
    return [...this.browsers];
  }

  /**
   * Add a feature with support levels.
   *
   * @param feature - Feature entry
   */
  addFeature(feature: FeatureEntry): void {
    this.features.push(feature);
  }

  /** Get all features. */
  getFeatures(): FeatureEntry[] {
    return [...this.features];
  }

  /**
   * Get support level for a browser-feature pair.
   *
   * @param browserName - Browser name
   * @param featureId - Feature ID
   */
  getSupport(browserName: string, featureId: string): SupportLevel {
    const feature = this.features.find((f) => f.id === featureId);
    if (!feature) return SupportLevel.NONE;
    return feature.support[browserName] ?? SupportLevel.NONE;
  }

  /** Identify features with missing or partial support. */
  getGaps(): CompatibilityGap[] {
    const gaps: CompatibilityGap[] = [];

    for (const feature of this.features) {
      for (const browser of this.browsers) {
        const level = feature.support[browser.name] ?? SupportLevel.NONE;
        if (level !== SupportLevel.FULL) {
          gaps.push({
            browser: browser.name,
            featureId: feature.id,
            featureName: feature.name,
            level,
          });
        }
      }
    }

    return gaps;
  }

  /** Generate a full compatibility report. */
  generateReport(): CompatibilityReport {
    const gaps = this.getGaps();
    const totalCombinations = this.browsers.length * this.features.length;
    const fullSupport = totalCombinations - gaps.length;
    const overallScore =
      totalCombinations > 0 ? fullSupport / totalCombinations : 1;

    return {
      browsers: this.getBrowsers(),
      features: this.getFeatures(),
      overallScore,
      gaps,
    };
  }
}
