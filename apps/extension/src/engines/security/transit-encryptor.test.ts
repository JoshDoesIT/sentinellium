/**
 * @module Transit Encryptor Tests
 * @description TDD tests for end-to-end encryption of alert data in transit.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { TransitEncryptor } from "./transit-encryptor";

describe("TransitEncryptor", () => {
  let encryptor: TransitEncryptor;

  beforeEach(() => {
    encryptor = new TransitEncryptor();
  });

  describe("generateKey", () => {
    it("generates a key pair with shared secret", () => {
      const keyPair = encryptor.generateKey();
      expect(keyPair.publicKey).toBeTruthy();
      expect(keyPair.privateKey).toBeTruthy();
      expect(keyPair.sharedSecret).toBeTruthy();
    });
  });

  describe("encrypt / decrypt", () => {
    it("encrypts and decrypts data successfully", () => {
      const keyPair = encryptor.generateKey();
      const plaintext = '{"alert":"phishing","score":0.95}';

      const encrypted = encryptor.encrypt(plaintext, keyPair.sharedSecret);
      expect(encrypted.ciphertext).not.toBe(plaintext);
      expect(encrypted.iv).toBeTruthy();

      const decrypted = encryptor.decrypt(encrypted, keyPair.sharedSecret);
      expect(decrypted).toBe(plaintext);
    });

    it("produces different ciphertext for same plaintext (unique IV)", () => {
      const keyPair = encryptor.generateKey();
      const plaintext = "test data";

      const enc1 = encryptor.encrypt(plaintext, keyPair.sharedSecret);
      const enc2 = encryptor.encrypt(plaintext, keyPair.sharedSecret);
      expect(enc1.ciphertext).not.toBe(enc2.ciphertext);
    });

    it("fails to decrypt with wrong key", () => {
      const keyPair1 = encryptor.generateKey();
      const keyPair2 = encryptor.generateKey();
      const plaintext = "secret data";

      const encrypted = encryptor.encrypt(plaintext, keyPair1.sharedSecret);
      expect(() =>
        encryptor.decrypt(encrypted, keyPair2.sharedSecret),
      ).toThrow();
    });
  });

  describe("sign / verify", () => {
    it("signs and verifies data integrity", () => {
      const keyPair = encryptor.generateKey();
      const data = "important alert data";

      const signature = encryptor.sign(data, keyPair.sharedSecret);
      expect(signature).toBeTruthy();

      expect(encryptor.verify(data, signature, keyPair.sharedSecret)).toBe(
        true,
      );
    });

    it("rejects tampered data", () => {
      const keyPair = encryptor.generateKey();
      const signature = encryptor.sign("original", keyPair.sharedSecret);

      expect(
        encryptor.verify("tampered", signature, keyPair.sharedSecret),
      ).toBe(false);
    });
  });
});
