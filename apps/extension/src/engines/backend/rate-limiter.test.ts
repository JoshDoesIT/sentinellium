/**
 * @module Rate Limiter Tests
 * @description TDD tests for sliding-window rate limiting.
 * Per-client/tenant throttling with configurable limits per route.
 * Returns retry-after metadata on throttle.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { RateLimiter } from "./rate-limiter";

describe("RateLimiter", () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
    limiter = new RateLimiter({ maxRequests: 5, windowMs: 60_000 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /* ── Allow / Deny ── */

  describe("check", () => {
    it("allows requests under the limit", () => {
      const result = limiter.check("client-a");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it("denies requests over the limit", () => {
      for (let i = 0; i < 5; i++) {
        limiter.check("client-a");
      }
      const result = limiter.check("client-a");
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("tracks clients independently", () => {
      for (let i = 0; i < 5; i++) {
        limiter.check("client-a");
      }
      const resultA = limiter.check("client-a");
      const resultB = limiter.check("client-b");

      expect(resultA.allowed).toBe(false);
      expect(resultB.allowed).toBe(true);
    });
  });

  /* ── Sliding Window ── */

  describe("sliding window", () => {
    it("resets after window expires", () => {
      for (let i = 0; i < 5; i++) {
        limiter.check("client-a");
      }
      expect(limiter.check("client-a").allowed).toBe(false);

      vi.advanceTimersByTime(60_001);
      expect(limiter.check("client-a").allowed).toBe(true);
    });

    it("partially resets as old requests slide out", () => {
      // Make 3 requests at T=0
      limiter.check("client-a");
      limiter.check("client-a");
      limiter.check("client-a");

      // Make 2 requests at T=30s
      vi.advanceTimersByTime(30_000);
      limiter.check("client-a");
      limiter.check("client-a");

      // At T=0 + 60s, the first 3 should expire
      vi.advanceTimersByTime(30_001);
      const result = limiter.check("client-a");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeLessThanOrEqual(2);
    });
  });

  /* ── Retry-After ── */

  describe("retryAfterMs", () => {
    it("returns 0 when not throttled", () => {
      const result = limiter.check("client-a");
      expect(result.retryAfterMs).toBe(0);
    });

    it("returns positive value when throttled", () => {
      for (let i = 0; i < 5; i++) {
        limiter.check("client-a");
      }
      const result = limiter.check("client-a");
      expect(result.retryAfterMs).toBeGreaterThan(0);
      expect(result.retryAfterMs).toBeLessThanOrEqual(60_000);
    });
  });

  /* ── Custom Limits ── */

  describe("custom configuration", () => {
    it("respects different max requests", () => {
      const strict = new RateLimiter({ maxRequests: 2, windowMs: 60_000 });
      strict.check("client-a");
      strict.check("client-a");

      expect(strict.check("client-a").allowed).toBe(false);
    });

    it("respects different window sizes", () => {
      const fast = new RateLimiter({ maxRequests: 3, windowMs: 5_000 });
      fast.check("client-a");
      fast.check("client-a");
      fast.check("client-a");
      expect(fast.check("client-a").allowed).toBe(false);

      vi.advanceTimersByTime(5_001);
      expect(fast.check("client-a").allowed).toBe(true);
    });
  });

  /* ── Reset ── */

  describe("reset", () => {
    it("clears all tracked clients", () => {
      for (let i = 0; i < 5; i++) {
        limiter.check("client-a");
      }
      expect(limiter.check("client-a").allowed).toBe(false);

      limiter.reset();
      expect(limiter.check("client-a").allowed).toBe(true);
    });

    it("clears a specific client", () => {
      for (let i = 0; i < 5; i++) {
        limiter.check("client-a");
        limiter.check("client-b");
      }

      limiter.reset("client-a");
      expect(limiter.check("client-a").allowed).toBe(true);
      expect(limiter.check("client-b").allowed).toBe(false);
    });
  });
});
