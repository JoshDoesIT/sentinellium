/**
 * @module C2PA Handler Tests
 * @description TDD tests for the C2PA/deepfake defense pipeline orchestrator.
 * Chains media-scanner → high-stakes-detector → manifest-validator →
 * unverified-flagger / verified-overlay.
 */
import { describe, it, expect } from "vitest";
import {
  handleC2paScan,
  type C2paScanRequest,
  type C2paMediaVerdict,
} from "./c2pa-handler";
import { ContextLevel } from "./high-stakes-detector";

/* ── Test Fixtures ── */

const newsPageRequest: C2paScanRequest = {
  domain: "cnn.com",
  pageTitle: "Breaking News - CNN",
  pageText: "Breaking news coverage of world events",
  url: "https://cnn.com/article/test",
  mediaElements: [
    {
      tagName: "IMG",
      src: "https://cnn.com/images/hero.jpg",
      width: 800,
      height: 600,
      alt: "News photo",
    },
  ],
};

const normalPageRequest: C2paScanRequest = {
  domain: "example.com",
  pageTitle: "Example Page",
  pageText: "Just a normal page",
  url: "https://example.com",
  mediaElements: [
    {
      tagName: "IMG",
      src: "https://example.com/photo.jpg",
      width: 400,
      height: 300,
      alt: "Photo",
    },
  ],
};

const financialPageRequest: C2paScanRequest = {
  domain: "internal.company.com",
  pageTitle: "Wire Transfer Authorization",
  pageText: "Please verify the invoice and approve the wire transfer",
  url: "https://internal.company.com/finance",
  mediaElements: [
    {
      tagName: "IMG",
      src: "https://internal.company.com/signature.png",
      width: 300,
      height: 100,
      alt: "Signature",
    },
  ],
};

const noMediaRequest: C2paScanRequest = {
  domain: "example.com",
  pageTitle: "Text Only",
  pageText: "No images here",
  url: "https://example.com/text",
  mediaElements: [],
};

const smallImageRequest: C2paScanRequest = {
  domain: "cnn.com",
  pageTitle: "News",
  pageText: "News article",
  url: "https://cnn.com/news",
  mediaElements: [
    {
      tagName: "IMG",
      src: "https://cnn.com/tracking-pixel.gif",
      width: 1,
      height: 1,
      alt: "",
    },
  ],
};

describe("C2PA Handler", () => {
  /* ── Context Classification ── */

  describe("context classification", () => {
    it("detects news domains as ELEVATED context", () => {
      const result = handleC2paScan(newsPageRequest);
      expect(result.contextLevel).toBe(ContextLevel.ELEVATED);
    });

    it("detects financial keywords as HIGH_STAKES context", () => {
      const result = handleC2paScan(financialPageRequest);
      expect(result.contextLevel).toBe(ContextLevel.HIGH_STAKES);
    });

    it("classifies normal pages as NORMAL context", () => {
      const result = handleC2paScan(normalPageRequest);
      expect(result.contextLevel).toBe(ContextLevel.NORMAL);
    });
  });

  /* ── Media Scanning ── */

  describe("media scanning", () => {
    it("filters out small images (tracking pixels)", () => {
      const result = handleC2paScan(smallImageRequest);
      expect(result.mediaResults).toHaveLength(0);
    });

    it("returns empty results for pages with no media", () => {
      const result = handleC2paScan(noMediaRequest);
      expect(result.mediaResults).toHaveLength(0);
    });

    it("discovers qualifying media on the page", () => {
      const result = handleC2paScan(newsPageRequest);
      expect(result.mediaResults.length).toBeGreaterThanOrEqual(1);
    });
  });

  /* ── Flagging Logic ── */

  describe("flagging decisions", () => {
    it("flags unverified media on high-stakes pages", () => {
      const result = handleC2paScan(financialPageRequest);
      const flagged = result.mediaResults.filter(
        (m: C2paMediaVerdict) => m.shouldFlag,
      );
      expect(flagged.length).toBeGreaterThanOrEqual(1);
    });

    it("does not flag media on normal pages", () => {
      const result = handleC2paScan(normalPageRequest);
      const flagged = result.mediaResults.filter(
        (m: C2paMediaVerdict) => m.shouldFlag,
      );
      expect(flagged).toHaveLength(0);
    });

    it("includes the media URL in each verdict", () => {
      const result = handleC2paScan(newsPageRequest);
      if (result.mediaResults.length > 0) {
        expect(result.mediaResults[0]!.url).toBe(
          "https://cnn.com/images/hero.jpg",
        );
      }
    });
  });

  /* ── Result Structure ── */

  describe("result structure", () => {
    it("includes the page domain", () => {
      const result = handleC2paScan(newsPageRequest);
      expect(result.domain).toBe("cnn.com");
    });

    it("includes context signals", () => {
      const result = handleC2paScan(financialPageRequest);
      expect(result.contextSignals.length).toBeGreaterThan(0);
    });
  });
});
