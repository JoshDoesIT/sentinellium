/**
 * @module At-Rest Encryptor
 * @description Data encryption at rest using AES-256 simulation.
 * Provides key generation, encryption with unique salts,
 * and deterministic hashing.
 */

/* ── Types ── */

export interface AtRestPayload {
  ciphertext: string;
  salt: string;
  algorithm: string;
  tag: string;
}

/* ── Helpers ── */

let callSeq = 0;

function generateHex(length: number): string {
  callSeq++;
  const counterHex = callSeq.toString(16).padStart(8, "0");
  const chars = "0123456789abcdef";
  let result = counterHex.slice(0, Math.min(8, length));
  for (let i = result.length; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function xorCipher(data: string, key: string): string {
  let result = "";
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(
      data.charCodeAt(i) ^ key.charCodeAt(i % key.length),
    );
  }
  return result;
}

function toHex(str: string): string {
  return Array.from(str)
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): string {
  let result = "";
  for (let i = 0; i < hex.length; i += 2) {
    result += String.fromCharCode(parseInt(hex.substring(i, i + 2), 16));
  }
  return result;
}

function simpleHash(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

/* ── Encryptor ── */

/**
 * At-rest encryptor with AES-256 simulation.
 */
export class AtRestEncryptor {
  /**
   * Generate a 256-bit encryption key.
   *
   * @returns 64-character hex string
   */
  generateKey(): string {
    return generateHex(64);
  }

  /**
   * Encrypt data for storage.
   *
   * @param plaintext - Data to encrypt
   * @param key - Encryption key
   */
  encrypt(plaintext: string, key: string): AtRestPayload {
    const salt = generateHex(16);
    const compositeKey = salt + key;
    const encrypted = xorCipher(plaintext, compositeKey);
    const ciphertext = toHex(encrypted);

    return {
      ciphertext,
      salt,
      algorithm: "AES-256-DEMO",
      tag: simpleHash(ciphertext + key),
    };
  }

  /**
   * Decrypt stored data.
   *
   * @param payload - Encrypted payload
   * @param key - Decryption key
   * @throws Error if key is wrong
   */
  decrypt(payload: AtRestPayload, key: string): string {
    const expectedTag = simpleHash(payload.ciphertext + key);
    if (expectedTag !== payload.tag) {
      throw new Error("Decryption failed: invalid key or tampered data");
    }

    const compositeKey = payload.salt + key;
    return xorCipher(fromHex(payload.ciphertext), compositeKey);
  }

  /**
   * Deterministic hash for data integrity.
   *
   * @param data - Data to hash
   */
  hash(data: string): string {
    return simpleHash(data);
  }
}
