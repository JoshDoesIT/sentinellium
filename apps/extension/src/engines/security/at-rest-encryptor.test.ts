/**
 * @module At-Rest Encryptor Tests
 * @description TDD tests for AES-256 data encryption at rest.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { AtRestEncryptor } from "./at-rest-encryptor";

describe("AtRestEncryptor", () => {
  let encryptor: AtRestEncryptor;

  beforeEach(() => {
    encryptor = new AtRestEncryptor();
  });

  describe("generateKey", () => {
    it("generates a 256-bit encryption key", () => {
      const key = encryptor.generateKey();
      expect(key).toBeTruthy();
      expect(key.length).toBe(64); // 256 bits = 64 hex chars
    });

    it("generates unique keys", () => {
      const key1 = encryptor.generateKey();
      const key2 = encryptor.generateKey();
      expect(key1).not.toBe(key2);
    });
  });

  describe("encrypt / decrypt", () => {
    it("encrypts and decrypts data at rest", () => {
      const key = encryptor.generateKey();
      const plaintext = '{"userId":"u-123","email":"user@corp.com"}';

      const encrypted = encryptor.encrypt(plaintext, key);
      expect(encrypted.ciphertext).not.toBe(plaintext);

      const decrypted = encryptor.decrypt(encrypted, key);
      expect(decrypted).toBe(plaintext);
    });

    it("uses unique salt per encryption", () => {
      const key = encryptor.generateKey();
      const enc1 = encryptor.encrypt("data", key);
      const enc2 = encryptor.encrypt("data", key);
      expect(enc1.salt).not.toBe(enc2.salt);
    });

    it("rejects wrong key", () => {
      const key1 = encryptor.generateKey();
      const key2 = encryptor.generateKey();

      const encrypted = encryptor.encrypt("secret", key1);
      expect(() => encryptor.decrypt(encrypted, key2)).toThrow();
    });
  });

  describe("hash", () => {
    it("produces deterministic hash for same input", () => {
      const h1 = encryptor.hash("test-data");
      const h2 = encryptor.hash("test-data");
      expect(h1).toBe(h2);
    });

    it("produces different hashes for different inputs", () => {
      const h1 = encryptor.hash("data-a");
      const h2 = encryptor.hash("data-b");
      expect(h1).not.toBe(h2);
    });
  });
});
