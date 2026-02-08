/**
 * @module API Key Manager
 * @description Programmatic API key lifecycle management.
 * Keys are hashed for storage, scoped to tenant+role, and support
 * generation, validation, revocation, and rotation.
 */

/* ── Types ── */

/** Input for generating a new API key. */
export interface GenerateKeyInput {
  name: string;
  tenantId: string;
  role: string;
  expiresInDays: number;
}

/** Result from key generation, including the one-time plaintext. */
export interface GeneratedKey {
  keyId: string;
  plaintext: string;
  name: string;
  tenantId: string;
  role: string;
  expiresAt: number;
}

/** Public key metadata (no plaintext). */
export interface KeyInfo {
  keyId: string;
  name: string;
  tenantId: string;
  role: string;
  expiresAt: number;
  revoked: boolean;
  createdAt: number;
}

/** Validation result for a plaintext key. */
export interface ValidatedKey {
  keyId: string;
  tenantId: string;
  role: string;
}

/** Internal storage record. */
interface StoredKey {
  keyId: string;
  hash: string;
  name: string;
  tenantId: string;
  role: string;
  expiresAt: number;
  revoked: boolean;
  createdAt: number;
}

/* ── Helpers ── */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Generate a random key string. */
function generateRandomKey(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "sk_";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Simple hash for key storage. In production this would use
 * a proper cryptographic hash (SHA-256). For the client-side
 * extension, we use a fast djb2 variant.
 */
function hashKey(plaintext: string): string {
  let hash = 5381;
  for (let i = 0; i < plaintext.length; i++) {
    hash = (hash * 33) ^ plaintext.charCodeAt(i);
  }
  return `hk_${(hash >>> 0).toString(36)}`;
}

/* ── Manager ── */

/**
 * Manages API key lifecycle.
 * Keys are stored hashed; plaintext is returned only at generation time.
 */
export class ApiKeyManager {
  private readonly keys = new Map<string, StoredKey>();
  /** Maps hash → keyId for validation lookups. */
  private readonly hashIndex = new Map<string, string>();
  private nextId = 1;

  /**
   * Generate a new API key.
   *
   * @param input - Key configuration
   * @returns Generated key with one-time plaintext
   */
  generateKey(input: GenerateKeyInput): GeneratedKey {
    const keyId = `key-${String(this.nextId++).padStart(4, "0")}`;
    const plaintext = generateRandomKey();
    const hash = hashKey(plaintext);

    const stored: StoredKey = {
      keyId,
      hash,
      name: input.name,
      tenantId: input.tenantId,
      role: input.role,
      expiresAt: Date.now() + input.expiresInDays * MS_PER_DAY,
      revoked: false,
      createdAt: Date.now(),
    };

    this.keys.set(keyId, stored);
    this.hashIndex.set(hash, keyId);

    return {
      keyId,
      plaintext,
      name: input.name,
      tenantId: input.tenantId,
      role: input.role,
      expiresAt: stored.expiresAt,
    };
  }

  /**
   * Validate a plaintext key.
   *
   * @param plaintext - Raw API key string
   * @returns Key metadata if valid, undefined otherwise
   */
  validateKey(plaintext: string): ValidatedKey | undefined {
    const hash = hashKey(plaintext);
    const keyId = this.hashIndex.get(hash);
    if (!keyId) return undefined;

    const stored = this.keys.get(keyId);
    if (!stored) return undefined;
    if (stored.revoked) return undefined;
    if (Date.now() >= stored.expiresAt) return undefined;

    return {
      keyId: stored.keyId,
      tenantId: stored.tenantId,
      role: stored.role,
    };
  }

  /**
   * Revoke an API key by ID.
   *
   * @param keyId - Key to revoke
   */
  revokeKey(keyId: string): void {
    const stored = this.keys.get(keyId);
    if (stored) {
      stored.revoked = true;
    }
  }

  /**
   * List all keys for a tenant (without plaintext).
   *
   * @param tenantId - Tenant to filter by
   */
  listKeys(tenantId: string): KeyInfo[] {
    return [...this.keys.values()]
      .filter((k) => k.tenantId === tenantId)
      .map((k) => ({
        keyId: k.keyId,
        name: k.name,
        tenantId: k.tenantId,
        role: k.role,
        expiresAt: k.expiresAt,
        revoked: k.revoked,
        createdAt: k.createdAt,
      }));
  }

  /**
   * Rotate a key: revoke old, generate new with same config.
   *
   * @param keyId - Key to rotate
   * @returns New generated key
   * @throws Error if key not found
   */
  rotateKey(keyId: string): GeneratedKey {
    const stored = this.keys.get(keyId);
    if (!stored) {
      throw new Error(`API key '${keyId}' not found`);
    }

    this.revokeKey(keyId);

    const remainingDays = Math.max(
      1,
      Math.ceil((stored.expiresAt - Date.now()) / MS_PER_DAY),
    );

    return this.generateKey({
      name: stored.name,
      tenantId: stored.tenantId,
      role: stored.role,
      expiresInDays: remainingDays,
    });
  }
}
