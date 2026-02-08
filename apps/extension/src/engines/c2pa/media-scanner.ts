/**
 * @module Media Scanner
 * @description Content-script side DOM scanner that finds media
 * elements (img, video, picture, canvas) and extracts their
 * source URLs for C2PA validation.
 *
 * Filtering:
 *   - Skips tiny images (icons, tracking pixels) under threshold
 *   - Skips data URIs (inline base64 images)
 *   - Deduplicates by resolved URL
 */

/* ── Types ── */

/** Media element type. */
export enum MediaType {
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  CANVAS = "CANVAS",
}

/** A discovered media element. */
export interface MediaElement {
  type: MediaType;
  url: string;
  width: number;
  height: number;
  alt: string;
}

/** Scanner options. */
export interface ScanOptions {
  /** Minimum width/height to include (default: 100). */
  minDimension?: number;
}

/** Raw element data from DOM (abstracted for testability). */
export interface RawMediaElement {
  tagName: string;
  src: string;
  width: number;
  height: number;
  alt?: string;
  poster?: string;
}

/* ── Constants ── */

const DEFAULT_MIN_DIMENSION = 100;

/* ── Scanner ── */

/**
 * Scans DOM elements for media that can be validated via C2PA.
 *
 * Uses an abstracted element interface so tests can run without
 * a real DOM. In production, the content script maps actual
 * DOM elements to `RawMediaElement` objects before scanning.
 */
export class MediaScanner {
  /**
   * Scan a list of raw media elements and return validated media.
   *
   * @param elements - Raw element data from the DOM
   * @param options - Optional scan configuration
   * @returns Deduplicated, filtered media elements
   */
  scanElements(
    elements: RawMediaElement[],
    options: ScanOptions = {},
  ): MediaElement[] {
    const minDim = options.minDimension ?? DEFAULT_MIN_DIMENSION;
    const seen = new Set<string>();
    const results: MediaElement[] = [];

    for (const el of elements) {
      const url = el.src;

      // Skip empty/invalid URLs
      if (!url || url.startsWith("data:")) continue;

      // Skip tiny elements
      if (el.width < minDim || el.height < minDim) continue;

      // Deduplicate
      if (seen.has(url)) continue;
      seen.add(url);

      results.push({
        type: this.getMediaType(el.tagName),
        url,
        width: el.width,
        height: el.height,
        alt: el.alt ?? "",
      });
    }

    return results;
  }

  /** Map tag name to media type. */
  private getMediaType(tagName: string): MediaType {
    switch (tagName.toUpperCase()) {
      case "VIDEO":
        return MediaType.VIDEO;
      case "CANVAS":
        return MediaType.CANVAS;
      default:
        return MediaType.IMAGE;
    }
  }
}
