/**
 * @module Anonymize Engine Tests
 * @description TDD tests for the data redaction engine.
 * Replaces PII with masked values using configurable strategies.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { AnonymizeEngine, RedactionStrategy } from "./anonymize-engine";
import { PiiType } from "./pii-detector";

describe("Anonymize Engine", () => {
  let engine: AnonymizeEngine;

  beforeEach(() => {
    engine = new AnonymizeEngine();
  });

  /* ── Initialization ── */

  describe("initialization", () => {
    it("creates an instance", () => {
      expect(engine).toBeInstanceOf(AnonymizeEngine);
    });
  });

  /* ── SSN Redaction ── */

  describe("SSN redaction", () => {
    it("masks SSN with asterisks", () => {
      const result = engine.redact("My SSN is 123-45-6789", [
        {
          type: PiiType.SSN,
          value: "123-45-6789",
          start: 10,
          end: 21,
          confidence: 0.95,
        },
      ]);

      expect(result).toContain("***-**-****");
      expect(result).not.toContain("123-45-6789");
    });
  });

  /* ── Credit Card Redaction ── */

  describe("credit card redaction", () => {
    it("masks credit card preserving last 4 digits", () => {
      const result = engine.redact("Card: 4111-1111-1111-1111", [
        {
          type: PiiType.CREDIT_CARD,
          value: "4111-1111-1111-1111",
          start: 6,
          end: 25,
          confidence: 0.9,
        },
      ]);

      expect(result).toContain("****-****-****-1111");
      expect(result).not.toContain("4111");
    });
  });

  /* ── Email Redaction ── */

  describe("email redaction", () => {
    it("masks email address", () => {
      const result = engine.redact("Email: john@example.com", [
        {
          type: PiiType.EMAIL,
          value: "john@example.com",
          start: 7,
          end: 23,
          confidence: 0.95,
        },
      ]);

      expect(result).toContain("[EMAIL REDACTED]");
      expect(result).not.toContain("john@example.com");
    });
  });

  /* ── Phone Redaction ── */

  describe("phone redaction", () => {
    it("masks phone number", () => {
      const result = engine.redact("Call (555) 123-4567", [
        {
          type: PiiType.PHONE,
          value: "(555) 123-4567",
          start: 5,
          end: 19,
          confidence: 0.8,
        },
      ]);

      expect(result).toContain("[PHONE REDACTED]");
    });
  });

  /* ── API Key Redaction ── */

  describe("API key redaction", () => {
    it("masks API keys completely", () => {
      const result = engine.redact("key: AKIAIOSFODNN7EXAMPLE", [
        {
          type: PiiType.API_KEY,
          value: "AKIAIOSFODNN7EXAMPLE",
          start: 5,
          end: 25,
          confidence: 0.95,
        },
      ]);

      expect(result).toContain("[API KEY REDACTED]");
      expect(result).not.toContain("AKIAIOSFODNN7EXAMPLE");
    });
  });

  /* ── Multiple PII ── */

  describe("multiple PII", () => {
    it("redacts multiple PII in the same text", () => {
      const text = "SSN: 123-45-6789, Email: john@example.com";
      const result = engine.redact(text, [
        {
          type: PiiType.SSN,
          value: "123-45-6789",
          start: 5,
          end: 16,
          confidence: 0.95,
        },
        {
          type: PiiType.EMAIL,
          value: "john@example.com",
          start: 25,
          end: 41,
          confidence: 0.95,
        },
      ]);

      expect(result).not.toContain("123-45-6789");
      expect(result).not.toContain("john@example.com");
    });
  });

  /* ── Custom Strategy ── */

  describe("custom strategy", () => {
    it("supports PLACEHOLDER strategy", () => {
      const custom = new AnonymizeEngine({
        strategy: RedactionStrategy.PLACEHOLDER,
      });
      const result = custom.redact("SSN: 123-45-6789", [
        {
          type: PiiType.SSN,
          value: "123-45-6789",
          start: 5,
          end: 16,
          confidence: 0.95,
        },
      ]);

      expect(result).toContain("[SSN REDACTED]");
    });
  });

  /* ── No PII ── */

  describe("no PII", () => {
    it("returns original text when no PII found", () => {
      const result = engine.redact("Normal text here", []);
      expect(result).toBe("Normal text here");
    });
  });
});
