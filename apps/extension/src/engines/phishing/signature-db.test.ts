/**
 * @module Signature Database Tests
 * @description TDD tests for the phishing signature database.
 * Provides blocklist/allowlist lookups and pattern matching
 * for known phishing domains, URLs, and content patterns.
 */
import { describe, it, expect } from "vitest";
import { SignatureDatabase, SignatureType } from "./signature-db";

describe("Signature Database", () => {
  let db: SignatureDatabase;

  /* ── Initialization ── */

  describe("initialization", () => {
    it("creates an instance with built-in signatures", () => {
      db = new SignatureDatabase();
      expect(db).toBeInstanceOf(SignatureDatabase);
    });

    it("reports the number of loaded signatures", () => {
      db = new SignatureDatabase();
      expect(db.signatureCount).toBeGreaterThan(0);
    });
  });

  /* ── Domain Blocklist ── */

  describe("domain blocklist", () => {
    it("matches a known phishing domain", () => {
      db = new SignatureDatabase();
      const result = db.checkDomain("secure-paypal-login.tk");
      expect(result.matched).toBe(true);
      expect(result.type).toBe(SignatureType.BLOCKLIST);
    });

    it("does not match a legitimate domain", () => {
      db = new SignatureDatabase();
      const result = db.checkDomain("google.com");
      expect(result.matched).toBe(false);
    });

    it("matches subdomains of blocked domains", () => {
      db = new SignatureDatabase();
      // Add a blocked domain for testing
      db.addBlockedDomain("evil-phisher.xyz");
      const result = db.checkDomain("login.evil-phisher.xyz");
      expect(result.matched).toBe(true);
    });
  });

  /* ── Domain Allowlist ── */

  describe("domain allowlist", () => {
    it("recognizes known legitimate domains", () => {
      db = new SignatureDatabase();
      expect(db.isAllowlisted("google.com")).toBe(true);
      expect(db.isAllowlisted("microsoft.com")).toBe(true);
    });

    it("recognizes subdomains of allowlisted domains", () => {
      db = new SignatureDatabase();
      expect(db.isAllowlisted("accounts.google.com")).toBe(true);
      expect(db.isAllowlisted("login.microsoftonline.com")).toBe(true);
    });

    it("does not allowlist random domains", () => {
      db = new SignatureDatabase();
      expect(db.isAllowlisted("random-phisher.com")).toBe(false);
    });
  });

  /* ── Pattern Matching ── */

  describe("pattern matching", () => {
    it("matches content with phishing keywords", () => {
      db = new SignatureDatabase();
      const result = db.matchContent(
        "Your account has been suspended. Verify your identity immediately.",
      );
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.type).toBe(SignatureType.PATTERN);
    });

    it("matches urgency patterns", () => {
      db = new SignatureDatabase();
      const result = db.matchContent(
        "URGENT: Your account will be closed within 24 hours",
      );
      expect(result.length).toBeGreaterThan(0);
    });

    it("matches credential harvesting patterns", () => {
      db = new SignatureDatabase();
      const result = db.matchContent(
        "Please enter your password and social security number to continue",
      );
      expect(result.length).toBeGreaterThan(0);
    });

    it("does not match benign content", () => {
      db = new SignatureDatabase();
      const result = db.matchContent(
        "Welcome to our blog. Here are the latest updates on software development.",
      );
      expect(result).toHaveLength(0);
    });
  });

  /* ── URL Pattern Matching ── */

  describe("URL pattern matching", () => {
    it("flags suspicious URL patterns", () => {
      db = new SignatureDatabase();
      const result = db.matchUrlPattern(
        "https://login-paypal-verify.com/signin",
      );
      expect(result.length).toBeGreaterThan(0);
    });

    it("detects data exfil patterns in URLs", () => {
      db = new SignatureDatabase();
      const result = db.matchUrlPattern(
        "https://example.com/collect?email=user@test.com&pass=secret",
      );
      expect(result.length).toBeGreaterThan(0);
    });

    it("does not flag clean URLs", () => {
      db = new SignatureDatabase();
      const result = db.matchUrlPattern("https://github.com/user/repo");
      expect(result).toHaveLength(0);
    });
  });

  /* ── Custom Signatures ── */

  describe("custom signatures", () => {
    it("supports adding custom blocked domains", () => {
      db = new SignatureDatabase();
      db.addBlockedDomain("my-custom-phisher.net");
      const result = db.checkDomain("my-custom-phisher.net");
      expect(result.matched).toBe(true);
    });

    it("supports adding custom allowlisted domains", () => {
      db = new SignatureDatabase();
      db.addAllowlistedDomain("my-internal-site.corp");
      expect(db.isAllowlisted("my-internal-site.corp")).toBe(true);
    });
  });
});
