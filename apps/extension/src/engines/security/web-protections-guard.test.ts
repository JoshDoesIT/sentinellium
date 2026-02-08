/**
 * @module Web Protections Guard Tests
 * @description TDD tests for CORS, CSRF, and XSS protections.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { WebProtectionsGuard } from "./web-protections-guard";

describe("WebProtectionsGuard", () => {
  let guard: WebProtectionsGuard;

  beforeEach(() => {
    guard = new WebProtectionsGuard({
      allowedOrigins: ["https://app.sentinellium.com"],
      allowedMethods: ["GET", "POST"],
      allowCredentials: true,
    });
  });

  /* ── CORS ── */

  describe("checkOrigin", () => {
    it("allows whitelisted origin", () => {
      expect(guard.checkOrigin("https://app.sentinellium.com")).toBe(true);
    });

    it("rejects unknown origin", () => {
      expect(guard.checkOrigin("https://evil.com")).toBe(false);
    });

    it("generates CORS headers for valid origin", () => {
      const headers = guard.corsHeaders("https://app.sentinellium.com");
      expect(headers["Access-Control-Allow-Origin"]).toBe(
        "https://app.sentinellium.com",
      );
      expect(headers["Access-Control-Allow-Credentials"]).toBe("true");
    });
  });

  /* ── CSRF ── */

  describe("csrf", () => {
    it("generates a CSRF token", () => {
      const token = guard.generateCsrfToken();
      expect(token).toBeTruthy();
      expect(token.length).toBeGreaterThanOrEqual(32);
    });

    it("validates a correct CSRF token", () => {
      const token = guard.generateCsrfToken();
      expect(guard.validateCsrfToken(token)).toBe(true);
    });

    it("rejects invalid CSRF token", () => {
      guard.generateCsrfToken();
      expect(guard.validateCsrfToken("invalid-token")).toBe(false);
    });
  });

  /* ── XSS ── */

  describe("sanitize", () => {
    it("strips script tags", () => {
      const dirty = '<p>hello</p><script>alert("xss")</script>';
      const clean = guard.sanitize(dirty);
      expect(clean).not.toContain("<script>");
      expect(clean).toContain("<p>hello</p>");
    });

    it("strips event handlers", () => {
      const dirty = '<img src="x" onerror="alert(1)">';
      const clean = guard.sanitize(dirty);
      expect(clean).not.toContain("onerror");
    });

    it("preserves safe HTML", () => {
      const safe = "<p>Hello <strong>world</strong></p>";
      expect(guard.sanitize(safe)).toBe(safe);
    });
  });

  /* ── Security Headers ── */

  describe("securityHeaders", () => {
    it("includes all standard security headers", () => {
      const headers = guard.securityHeaders();
      expect(headers["X-Content-Type-Options"]).toBe("nosniff");
      expect(headers["X-Frame-Options"]).toBe("DENY");
      expect(headers["X-XSS-Protection"]).toBe("1; mode=block");
      expect(headers["Referrer-Policy"]).toBe(
        "strict-origin-when-cross-origin",
      );
    });
  });
});
