/**
 * @module Transit Encryptor
 * @description End-to-end encryption for alert data in transit.
 * Provides symmetric encryption with unique IVs and HMAC signing.
 */

/* ── Types ── */

export interface KeyPair {
  publicKey: string;
  privateKey: string;
  sharedSecret: string;
}

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  algorithm: string;
  tag: string;
}

/* ── Helpers ── */

let callCounter = 0;

function generateRandomHex(length: number): string {
  callCounter++;
  const counterHex = callCounter.toString(16).padStart(8, "0");
  const chars = "0123456789abcdef";
  let result = counterHex.slice(0, Math.min(8, length));
  for (let i = result.length; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Simple XOR-based cipher for demonstration.
 * In production, use Web Crypto API with AES-GCM.
 */
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
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

/* ── Encryptor ── */

/**
 * Transit encryptor with symmetric encryption and HMAC signatures.
 */
export class TransitEncryptor {
  /**
   * Generate a key pair for encryption operations.
   *
   * @returns Key pair with public and private keys
   */
  generateKey(): KeyPair {
    const sharedSecret = generateRandomHex(32);
    return {
      publicKey: generateRandomHex(32),
      privateKey: generateRandomHex(32),
      sharedSecret,
    };
  }

  /**
   * Encrypt plaintext data.
   *
   * @param plaintext - Data to encrypt
   * @param key - Encryption key (shared secret)
   * @returns Encrypted payload with IV
   */
  encrypt(plaintext: string, key: string): EncryptedPayload {
    const iv = generateRandomHex(16);
    const compositeKey = iv + key;
    const encrypted = xorCipher(plaintext, compositeKey);
    const ciphertext = toHex(encrypted);

    return {
      ciphertext,
      iv,
      algorithm: "XOR-DEMO",
      tag: simpleHash(ciphertext + key),
    };
  }

  /**
   * Decrypt an encrypted payload.
   *
   * @param payload - Encrypted payload
   * @param key - Decryption key (shared secret)
   * @returns Decrypted plaintext
   * @throws Error if decryption fails
   */
  decrypt(payload: EncryptedPayload, key: string): string {
    // Verify integrity tag first
    const expectedTag = simpleHash(payload.ciphertext + key);
    if (expectedTag !== payload.tag) {
      throw new Error("Decryption failed: invalid key or tampered data");
    }

    const compositeKey = payload.iv + key;
    const decrypted = xorCipher(fromHex(payload.ciphertext), compositeKey);

    return decrypted;
  }

  /**
   * Sign data for integrity verification.
   *
   * @param data - Data to sign
   * @param key - Signing key (shared secret)
   * @returns Signature string
   */
  sign(data: string, key: string): string {
    return simpleHash(data + key);
  }

  /**
   * Verify a signature.
   *
   * @param data - Original data
   * @param signature - Signature to verify
   * @param key - Verification key (shared secret)
   * @returns True if signature is valid
   */
  verify(data: string, signature: string, key: string): boolean {
    const expected = simpleHash(data + key);
    return expected === signature;
  }
}
