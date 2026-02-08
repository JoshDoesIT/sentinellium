/**
 * @module URL Analyzer Tests
 * @description TDD tests for URL structure analysis. Detects
 * homoglyphs, typosquatting, suspicious TLDs, subdomain abuse,
 * IP-based URLs, and data/javascript URIs.
 */
import { describe, it, expect } from "vitest";
import {
  analyzeUrl,
  detectHomoglyphs,
  detectTyposquat,
  scoreTld,
  detectSubdomainAbuse,
  detectIpUrl,
  detectDangerousScheme,
  UrlRiskLevel,
} from "./url-analyzer";

describe("URL Analyzer", () => {
  /* ── analyzeUrl (integration) ── */

  describe("analyzeUrl", () => {
    it("returns LOW risk for a legitimate URL", () => {
      const result = analyzeUrl("https://www.google.com/search?q=test");
      expect(result.riskLevel).toBe(UrlRiskLevel.LOW);
      expect(result.score).toBeLessThan(30);
    });

    it("returns HIGH or above risk for a homoglyph phishing URL", () => {
      // Uses Cyrillic 'о' (U+043E) in 'google' — mixed-script attack
      const result = analyzeUrl("https://www.gооgle.com/login");
      expect(result.score).toBeGreaterThanOrEqual(30);
      expect(result.signals).toContain("homoglyph");
    });

    it("returns positive risk for a typosquat domain", () => {
      const result = analyzeUrl("https://www.googel.com/login");
      expect(result.score).toBeGreaterThanOrEqual(20);
      expect(result.signals).toContain("typosquat");
    });

    it("returns the analyzed URL in the result", () => {
      const result = analyzeUrl("https://example.com");
      expect(result.url).toBe("https://example.com");
    });

    it("handles malformed URLs gracefully", () => {
      const result = analyzeUrl("not-a-url");
      expect(result.riskLevel).toBe(UrlRiskLevel.MEDIUM);
      expect(result.signals).toContain("malformed");
    });
  });

  /* ── Homoglyph Detection ── */

  describe("detectHomoglyphs", () => {
    it("detects Cyrillic lookalikes in domain", () => {
      // 'а' (Cyrillic) looks identical to 'a' (Latin)
      const result = detectHomoglyphs("gооgle.com");
      expect(result.detected).toBe(true);
      expect(result.score).toBeGreaterThan(0);
    });

    it("returns no detection for pure ASCII domain", () => {
      const result = detectHomoglyphs("google.com");
      expect(result.detected).toBe(false);
      expect(result.score).toBe(0);
    });

    it("detects mixed-script characters", () => {
      // Mix of Latin and Cyrillic
      const result = detectHomoglyphs("аpple.com");
      expect(result.detected).toBe(true);
    });

    it("allows legitimate IDN domains with consistent script", () => {
      // All Cyrillic is not a homoglyph attack, it's a valid IDN
      const result = detectHomoglyphs("яндекс.рф");
      expect(result.detected).toBe(false);
    });
  });

  /* ── Typosquat Detection ── */

  describe("detectTyposquat", () => {
    it("detects single-character typosquats of known brands", () => {
      const result = detectTyposquat("googel.com");
      expect(result.detected).toBe(true);
      expect(result.matchedBrand).toBe("google.com");
    });

    it("detects character-swap typosquats", () => {
      const result = detectTyposquat("gogle.com");
      expect(result.detected).toBe(true);
      expect(result.matchedBrand).toBe("google.com");
    });

    it("returns no match for legitimate domains", () => {
      const result = detectTyposquat("github.com");
      expect(result.detected).toBe(false);
    });

    it("detects typosquats of Microsoft", () => {
      const result = detectTyposquat("microsft.com");
      expect(result.detected).toBe(true);
      expect(result.matchedBrand).toBe("microsoft.com");
    });

    it("ignores very short domains", () => {
      const result = detectTyposquat("go.com");
      expect(result.detected).toBe(false);
    });
  });

  /* ── TLD Scoring ── */

  describe("scoreTld", () => {
    it("scores common TLDs as low risk", () => {
      expect(scoreTld("com")).toBe(0);
      expect(scoreTld("org")).toBe(0);
      expect(scoreTld("net")).toBe(0);
    });

    it("scores suspicious TLDs as higher risk", () => {
      expect(scoreTld("xyz")).toBeGreaterThan(0);
      expect(scoreTld("top")).toBeGreaterThan(0);
      expect(scoreTld("tk")).toBeGreaterThan(0);
    });

    it("scores moderately suspicious TLDs", () => {
      expect(scoreTld("info")).toBeGreaterThan(0);
      expect(scoreTld("info")).toBeLessThan(scoreTld("tk"));
    });

    it("handles unknown TLDs with a baseline score", () => {
      expect(scoreTld("randomtld")).toBeGreaterThan(0);
    });
  });

  /* ── Subdomain Abuse ── */

  describe("detectSubdomainAbuse", () => {
    it("detects brand-impersonating subdomains", () => {
      const result = detectSubdomainAbuse("login.microsoft.com.evil-site.com");
      expect(result.detected).toBe(true);
      expect(result.score).toBeGreaterThan(0);
    });

    it("detects excessive subdomain depth", () => {
      const result = detectSubdomainAbuse("a.b.c.d.e.f.example.com");
      expect(result.detected).toBe(true);
    });

    it("allows normal subdomains", () => {
      const result = detectSubdomainAbuse("www.google.com");
      expect(result.detected).toBe(false);
    });

    it("allows common multi-level subdomains", () => {
      const result = detectSubdomainAbuse("mail.app.google.com");
      expect(result.detected).toBe(false);
    });
  });

  /* ── IP URL Detection ── */

  describe("detectIpUrl", () => {
    it("detects IPv4 address URLs", () => {
      const result = detectIpUrl("192.168.1.1");
      expect(result.detected).toBe(true);
    });

    it("detects IPv6 address URLs", () => {
      const result = detectIpUrl("[::1]");
      expect(result.detected).toBe(true);
    });

    it("returns false for normal hostnames", () => {
      const result = detectIpUrl("google.com");
      expect(result.detected).toBe(false);
    });

    it("detects decimal-encoded IPs", () => {
      // 3232235777 = 192.168.1.1
      const result = detectIpUrl("3232235777");
      expect(result.detected).toBe(true);
    });
  });

  /* ── Dangerous Scheme Detection ── */

  describe("detectDangerousScheme", () => {
    it("flags javascript: URIs", () => {
      const result = detectDangerousScheme("javascript:alert(1)");
      expect(result.detected).toBe(true);
    });

    it("flags data: URIs", () => {
      const result = detectDangerousScheme("data:text/html,<h1>hi</h1>");
      expect(result.detected).toBe(true);
    });

    it("allows https: URLs", () => {
      const result = detectDangerousScheme("https://example.com");
      expect(result.detected).toBe(false);
    });

    it("allows http: URLs", () => {
      const result = detectDangerousScheme("http://example.com");
      expect(result.detected).toBe(false);
    });

    it("flags case-insensitive dangerous schemes", () => {
      const result = detectDangerousScheme("JAVASCRIPT:void(0)");
      expect(result.detected).toBe(true);
    });

    it("flags vbscript: URIs", () => {
      const result = detectDangerousScheme("vbscript:MsgBox('XSS')");
      expect(result.detected).toBe(true);
      expect(result.score).toBeGreaterThan(0);
    });

    it("flags case-insensitive vbscript: URIs", () => {
      const result = detectDangerousScheme("VBSCRIPT:MsgBox('XSS')");
      expect(result.detected).toBe(true);
    });
  });
});
