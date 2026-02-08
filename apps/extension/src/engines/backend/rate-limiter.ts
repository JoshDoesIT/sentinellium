/**
 * @module Rate Limiter
 * @description Sliding-window rate limiting per client/tenant.
 * Configurable max requests and window size.
 * Returns remaining quota and retry-after on throttle.
 */

/* ── Types ── */

/** Rate limiter configuration. */
export interface RateLimiterConfig {
  /** Maximum requests allowed per window. */
  maxRequests: number;
  /** Window duration in milliseconds. */
  windowMs: number;
}

/** Result of a rate limit check. */
export interface RateLimitResult {
  /** Whether the request is allowed. */
  allowed: boolean;
  /** Remaining requests in current window. */
  remaining: number;
  /** Milliseconds to wait before retrying (0 if allowed). */
  retryAfterMs: number;
}

/* ── Limiter ── */

/**
 * Sliding-window rate limiter.
 * Tracks per-client request timestamps and evicts expired entries.
 */
export class RateLimiter {
  private readonly config: RateLimiterConfig;
  /** Maps client ID → array of request timestamps (ms). */
  private readonly windows = new Map<string, number[]>();

  constructor(config: RateLimiterConfig) {
    this.config = config;
  }

  /**
   * Check if a client is allowed to make a request.
   * Automatically counts the request if allowed.
   *
   * @param clientId - Client or tenant identifier
   * @returns Rate limit result
   */
  check(clientId: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get or create window
    let timestamps = this.windows.get(clientId) ?? [];

    // Evict expired timestamps
    timestamps = timestamps.filter((t) => t > windowStart);

    if (timestamps.length >= this.config.maxRequests) {
      // Throttled — calculate retry-after from oldest timestamp
      const oldestInWindow = timestamps[0]!;
      const retryAfterMs = oldestInWindow + this.config.windowMs - now;

      this.windows.set(clientId, timestamps);
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: Math.max(0, retryAfterMs),
      };
    }

    // Allowed — record this request
    timestamps.push(now);
    this.windows.set(clientId, timestamps);

    return {
      allowed: true,
      remaining: this.config.maxRequests - timestamps.length,
      retryAfterMs: 0,
    };
  }

  /**
   * Reset rate limit state.
   *
   * @param clientId - Optional client to reset. Resets all if omitted.
   */
  reset(clientId?: string): void {
    if (clientId) {
      this.windows.delete(clientId);
    } else {
      this.windows.clear();
    }
  }
}
