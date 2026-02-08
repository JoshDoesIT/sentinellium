/**
 * @module Media Scanner Tests
 * @description TDD tests for the DOM media element scanner.
 * Finds img, video, picture, canvas elements and extracts
 * their source URLs for C2PA validation.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { MediaScanner, MediaType } from "./media-scanner";

describe("Media Scanner", () => {
  let scanner: MediaScanner;

  beforeEach(() => {
    scanner = new MediaScanner();
  });

  /* ── Initialization ── */

  describe("initialization", () => {
    it("creates an instance", () => {
      expect(scanner).toBeInstanceOf(MediaScanner);
    });
  });

  /* ── Element Extraction ── */

  describe("element extraction", () => {
    it("extracts img elements", () => {
      const elements = [
        {
          tagName: "IMG",
          src: "https://example.com/photo.jpg",
          width: 800,
          height: 600,
          alt: "A photo",
        },
      ];

      const result = scanner.scanElements(elements);
      expect(result).toHaveLength(1);
      expect(result[0]?.type).toBe(MediaType.IMAGE);
      expect(result[0]?.url).toBe("https://example.com/photo.jpg");
    });

    it("extracts video elements", () => {
      const elements = [
        {
          tagName: "VIDEO",
          src: "https://example.com/clip.mp4",
          width: 1920,
          height: 1080,
          poster: "https://example.com/poster.jpg",
        },
      ];

      const result = scanner.scanElements(elements);
      expect(result).toHaveLength(1);
      expect(result[0]?.type).toBe(MediaType.VIDEO);
    });

    it("extracts picture source elements", () => {
      const elements = [
        {
          tagName: "IMG",
          src: "https://example.com/hero.webp",
          width: 1200,
          height: 800,
          alt: "Hero",
        },
      ];

      const result = scanner.scanElements(elements);
      expect(result).toHaveLength(1);
      expect(result[0]?.url).toBe("https://example.com/hero.webp");
    });
  });

  /* ── Filtering ── */

  describe("filtering", () => {
    it("skips tiny images (icons, tracking pixels)", () => {
      const elements = [
        {
          tagName: "IMG",
          src: "https://example.com/pixel.gif",
          width: 1,
          height: 1,
          alt: "",
        },
        {
          tagName: "IMG",
          src: "https://example.com/icon.png",
          width: 32,
          height: 32,
          alt: "icon",
        },
        {
          tagName: "IMG",
          src: "https://example.com/photo.jpg",
          width: 800,
          height: 600,
          alt: "Photo",
        },
      ];

      const result = scanner.scanElements(elements, { minDimension: 100 });
      expect(result).toHaveLength(1);
      expect(result[0]?.url).toBe("https://example.com/photo.jpg");
    });

    it("skips data URIs", () => {
      const elements = [
        {
          tagName: "IMG",
          src: "data:image/png;base64,iVBOR...",
          width: 800,
          height: 600,
          alt: "",
        },
      ];

      const result = scanner.scanElements(elements);
      expect(result).toHaveLength(0);
    });

    it("skips empty src", () => {
      const elements = [
        { tagName: "IMG", src: "", width: 800, height: 600, alt: "" },
      ];

      const result = scanner.scanElements(elements);
      expect(result).toHaveLength(0);
    });
  });

  /* ── Deduplication ── */

  describe("deduplication", () => {
    it("deduplicates by URL", () => {
      const elements = [
        {
          tagName: "IMG",
          src: "https://example.com/photo.jpg",
          width: 800,
          height: 600,
          alt: "First",
        },
        {
          tagName: "IMG",
          src: "https://example.com/photo.jpg",
          width: 400,
          height: 300,
          alt: "Second",
        },
      ];

      const result = scanner.scanElements(elements);
      expect(result).toHaveLength(1);
    });
  });

  /* ── Metadata ── */

  describe("metadata extraction", () => {
    it("includes alt text", () => {
      const elements = [
        {
          tagName: "IMG",
          src: "https://example.com/photo.jpg",
          width: 800,
          height: 600,
          alt: "A beautiful sunset",
        },
      ];

      const result = scanner.scanElements(elements);
      expect(result[0]?.alt).toBe("A beautiful sunset");
    });

    it("includes dimensions", () => {
      const elements = [
        {
          tagName: "IMG",
          src: "https://example.com/photo.jpg",
          width: 1920,
          height: 1080,
          alt: "",
        },
      ];

      const result = scanner.scanElements(elements);
      expect(result[0]?.width).toBe(1920);
      expect(result[0]?.height).toBe(1080);
    });
  });
});
