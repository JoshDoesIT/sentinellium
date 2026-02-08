/**
 * @module Auth Manager
 * @description Authentication state management for enterprise SSO.
 * Handles JWT claims extraction, session lifecycle (login, refresh, expire),
 * and provider-agnostic token parsing for tenant/role resolution.
 */

/* ── Types ── */

/** JWT-like claims extracted from an SSO token. */
export interface TokenClaims {
  /** Subject (user ID). */
  sub: string;
  /** User email. */
  email: string;
  /** Tenant the user belongs to. */
  tenantId: string;
  /** User's enterprise role. */
  role: string;
  /** Expiry timestamp in seconds since epoch. */
  exp: number;
}

/** An active authenticated session. */
export interface AuthSession {
  userId: string;
  email: string;
  tenantId: string;
  role: string;
  expiresAt: number;
}

/* ── Manager ── */

/**
 * Manages authentication state.
 * Parses SSO/OIDC token claims into sessions with automatic expiry.
 */
export class AuthManager {
  private session: AuthSession | undefined;

  /**
   * Create a session from token claims.
   * Replaces any existing session.
   *
   * @param claims - JWT claims from the identity provider
   */
  login(claims: TokenClaims): void {
    this.session = {
      userId: claims.sub,
      email: claims.email,
      tenantId: claims.tenantId,
      role: claims.role,
      expiresAt: claims.exp * 1000, // Convert to ms
    };
  }

  /**
   * Get the current session, or undefined if expired/absent.
   *
   * @returns Active session or undefined
   */
  getSession(): AuthSession | undefined {
    if (!this.session) return undefined;
    if (Date.now() >= this.session.expiresAt) {
      this.session = undefined;
      return undefined;
    }
    return { ...this.session };
  }

  /** Whether the user has a valid, non-expired session. */
  isAuthenticated(): boolean {
    return this.getSession() !== undefined;
  }

  /** Clear the active session. Safe to call when not logged in. */
  logout(): void {
    this.session = undefined;
  }

  /**
   * Extend the session with a new expiry timestamp.
   *
   * @param newExp - New expiry in seconds since epoch
   * @throws Error if no active session
   */
  refresh(newExp: number): void {
    if (!this.session) {
      throw new Error("No active session to refresh");
    }
    this.session.expiresAt = newExp * 1000;
  }
}
