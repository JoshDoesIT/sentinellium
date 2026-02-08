/**
 * @module Auth Manager Tests
 * @description TDD tests for authentication state management.
 * Handles SSO token validation, session lifecycle (login, refresh, expire),
 * and JWT claims extraction for tenant/role resolution.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { AuthManager } from "./auth-manager";

describe("AuthManager", () => {
  let auth: AuthManager;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
    auth = new AuthManager();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /* ── Login ── */

  describe("login", () => {
    it("creates a session from token claims", () => {
      auth.login({
        sub: "user-123",
        email: "admin@acme.com",
        tenantId: "acme-corp",
        role: "ADMIN",
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      const session = auth.getSession();
      expect(session).toBeDefined();
      expect(session!.userId).toBe("user-123");
      expect(session!.email).toBe("admin@acme.com");
      expect(session!.tenantId).toBe("acme-corp");
      expect(session!.role).toBe("ADMIN");
    });

    it("replaces existing session on re-login", () => {
      auth.login({
        sub: "user-123",
        email: "admin@acme.com",
        tenantId: "acme-corp",
        role: "ADMIN",
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      auth.login({
        sub: "user-456",
        email: "analyst@acme.com",
        tenantId: "acme-corp",
        role: "ANALYST",
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      expect(auth.getSession()!.userId).toBe("user-456");
    });
  });

  /* ── Session Query ── */

  describe("getSession", () => {
    it("returns undefined when not logged in", () => {
      expect(auth.getSession()).toBeUndefined();
    });

    it("returns undefined when session has expired", () => {
      auth.login({
        sub: "user-123",
        email: "admin@acme.com",
        tenantId: "acme-corp",
        role: "ADMIN",
        exp: Math.floor(Date.now() / 1000) + 60, // 1 minute
      });

      vi.advanceTimersByTime(61_000);
      expect(auth.getSession()).toBeUndefined();
    });
  });

  /* ── Authentication Check ── */

  describe("isAuthenticated", () => {
    it("returns false when no session exists", () => {
      expect(auth.isAuthenticated()).toBe(false);
    });

    it("returns true with a valid session", () => {
      auth.login({
        sub: "user-123",
        email: "admin@acme.com",
        tenantId: "acme-corp",
        role: "ADMIN",
        exp: Math.floor(Date.now() / 1000) + 3600,
      });
      expect(auth.isAuthenticated()).toBe(true);
    });

    it("returns false after session expires", () => {
      auth.login({
        sub: "user-123",
        email: "admin@acme.com",
        tenantId: "acme-corp",
        role: "ADMIN",
        exp: Math.floor(Date.now() / 1000) + 60,
      });

      vi.advanceTimersByTime(61_000);
      expect(auth.isAuthenticated()).toBe(false);
    });
  });

  /* ── Logout ── */

  describe("logout", () => {
    it("clears the active session", () => {
      auth.login({
        sub: "user-123",
        email: "admin@acme.com",
        tenantId: "acme-corp",
        role: "ADMIN",
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      auth.logout();
      expect(auth.getSession()).toBeUndefined();
      expect(auth.isAuthenticated()).toBe(false);
    });

    it("is safe to call when not logged in", () => {
      expect(() => auth.logout()).not.toThrow();
    });
  });

  /* ── Token Refresh ── */

  describe("refresh", () => {
    it("extends session with new expiry", () => {
      auth.login({
        sub: "user-123",
        email: "admin@acme.com",
        tenantId: "acme-corp",
        role: "ADMIN",
        exp: Math.floor(Date.now() / 1000) + 60,
      });

      auth.refresh(Math.floor(Date.now() / 1000) + 7200);

      vi.advanceTimersByTime(61_000);
      expect(auth.isAuthenticated()).toBe(true);
    });

    it("throws when no active session", () => {
      expect(() =>
        auth.refresh(Math.floor(Date.now() / 1000) + 3600),
      ).toThrow();
    });
  });
});
