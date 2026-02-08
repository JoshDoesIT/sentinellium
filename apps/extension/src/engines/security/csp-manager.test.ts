/**
 * @module CSP Manager Tests
 * @description TDD tests for Content Security Policy header generation
 * and extension CSP enforcement.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { CspManager } from "./csp-manager";

describe("CspManager", () => {
  let manager: CspManager;

  beforeEach(() => {
    manager = new CspManager();
  });

  describe("defaults", () => {
    it("generates a default strict CSP", () => {
      const csp = manager.build();
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src 'self'");
      expect(csp).toContain("object-src 'none'");
    });
  });

  describe("addDirective", () => {
    it("adds a custom directive source", () => {
      manager.addDirective("img-src", "https://cdn.example.com");
      const csp = manager.build();
      expect(csp).toContain("img-src 'self' https://cdn.example.com");
    });

    it("appends to existing directive", () => {
      manager.addDirective("script-src", "'unsafe-inline'");
      manager.addDirective("script-src", "https://cdn.example.com");
      const csp = manager.build();
      expect(csp).toContain(
        "script-src 'self' 'unsafe-inline' https://cdn.example.com",
      );
    });
  });

  describe("removeDirective", () => {
    it("removes a directive entirely", () => {
      manager.removeDirective("object-src");
      const csp = manager.build();
      expect(csp).not.toContain("object-src");
    });
  });

  describe("validate", () => {
    it("flags unsafe-inline in script-src as warning", () => {
      manager.addDirective("script-src", "'unsafe-inline'");
      const warnings = manager.validate();
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0]).toContain("unsafe-inline");
    });

    it("passes validation for strict CSP", () => {
      const warnings = manager.validate();
      expect(warnings).toHaveLength(0);
    });
  });

  describe("toHeader", () => {
    it("returns a valid header object", () => {
      const header = manager.toHeader();
      expect(header.name).toBe("Content-Security-Policy");
      expect(header.value).toBeTruthy();
    });
  });

  describe("listDirectives", () => {
    it("lists all configured directives", () => {
      const directives = manager.listDirectives();
      expect(directives).toContain("default-src");
      expect(directives).toContain("script-src");
    });
  });
});
