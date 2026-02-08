/**
 * @module PII Detector Tests
 * @description TDD tests for the PII detection engine.
 * Pattern-based detection for SSN, credit cards, emails,
 * phone numbers, API keys, and custom regex patterns.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { PiiDetector, PiiType } from "./pii-detector";

describe("PII Detector", () => {
  let detector: PiiDetector;

  beforeEach(() => {
    detector = new PiiDetector();
  });

  /* ── Initialization ── */

  describe("initialization", () => {
    it("creates an instance", () => {
      expect(detector).toBeInstanceOf(PiiDetector);
    });
  });

  /* ── SSN Detection ── */

  describe("SSN detection", () => {
    it("detects US Social Security Numbers", () => {
      const matches = detector.scan("My SSN is 123-45-6789 and it is private");
      const ssn = matches.find((m) => m.type === PiiType.SSN);
      expect(ssn).toBeDefined();
      expect(ssn?.value).toBe("123-45-6789");
    });

    it("detects SSN without dashes", () => {
      const matches = detector.scan("SSN: 123456789");
      const ssn = matches.find((m) => m.type === PiiType.SSN);
      expect(ssn).toBeDefined();
    });
  });

  /* ── Credit Card Detection ── */

  describe("credit card detection", () => {
    it("detects Visa card numbers", () => {
      const matches = detector.scan("Card: 4111-1111-1111-1111");
      const cc = matches.find((m) => m.type === PiiType.CREDIT_CARD);
      expect(cc).toBeDefined();
    });

    it("detects Mastercard numbers", () => {
      const matches = detector.scan("Pay with 5500 0000 0000 0004");
      const cc = matches.find((m) => m.type === PiiType.CREDIT_CARD);
      expect(cc).toBeDefined();
    });
  });

  /* ── Email Detection ── */

  describe("email detection", () => {
    it("detects email addresses", () => {
      const matches = detector.scan(
        "Contact me at john@example.com for details",
      );
      const email = matches.find((m) => m.type === PiiType.EMAIL);
      expect(email).toBeDefined();
      expect(email?.value).toBe("john@example.com");
    });
  });

  /* ── Phone Detection ── */

  describe("phone detection", () => {
    it("detects US phone numbers", () => {
      const matches = detector.scan("Call me at (555) 123-4567");
      const phone = matches.find((m) => m.type === PiiType.PHONE);
      expect(phone).toBeDefined();
    });
  });

  /* ── API Key Detection ── */

  describe("API key detection", () => {
    it("detects AWS access keys", () => {
      const matches = detector.scan("aws_access_key_id = AKIAIOSFODNN7EXAMPLE");
      const key = matches.find((m) => m.type === PiiType.API_KEY);
      expect(key).toBeDefined();
    });

    it("detects generic API keys", () => {
      const matches = detector.scan(
        "api_key: sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx",
      );
      const key = matches.find((m) => m.type === PiiType.API_KEY);
      expect(key).toBeDefined();
    });
  });

  /* ── Custom Regex ── */

  describe("custom regex", () => {
    it("supports custom patterns", () => {
      const custom = new PiiDetector({
        customPatterns: [{ name: "EMPLOYEE_ID", pattern: /EMP-\d{6}/g }],
      });
      const matches = custom.scan("Employee EMP-123456 submitted a request");
      const emp = matches.find((m) => m.type === PiiType.CUSTOM);
      expect(emp).toBeDefined();
      expect(emp?.label).toBe("EMPLOYEE_ID");
    });
  });

  /* ── No Matches ── */

  describe("no matches", () => {
    it("returns empty array for clean text", () => {
      const matches = detector.scan("This is a normal sentence with no PII.");
      expect(matches).toHaveLength(0);
    });
  });

  /* ── Position Tracking ── */

  describe("position tracking", () => {
    it("includes match position", () => {
      const matches = detector.scan("Email: john@example.com");
      expect(matches[0]?.start).toBeGreaterThanOrEqual(0);
      expect(matches[0]?.end).toBeGreaterThan(matches[0]?.start ?? 0);
    });
  });
});
