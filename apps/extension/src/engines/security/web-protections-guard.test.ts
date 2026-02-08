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
    it("neutralizes script tags via entity encoding", () => {
      const dirty = '<p>hello</p><script>alert("xss")</script>';
      const clean = guard.sanitize(dirty);
      expect(clean).not.toContain("<script>");
      expect(clean).toContain("hello");
    });

    it("neutralizes event handlers", () => {
      const dirty = '<img src="x" onerror="alert(1)">';
      const clean = guard.sanitize(dirty);
      expect(clean).not.toContain("<img");
      expect(clean).toContain("&lt;img");
    });

    it("encodes all angle brackets for safety", () => {
      const input = "<p>Hello <strong>world</strong></p>";
      const clean = guard.sanitize(input);
      expect(clean).not.toContain("<p>");
      expect(clean).toContain("Hello");
      expect(clean).toContain("world");
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
