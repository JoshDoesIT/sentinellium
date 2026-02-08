/**
 * @module Input Interceptor Tests
 * @description TDD tests for the input field interception system.
 * Captures text from textarea, input, and contenteditable elements.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { InputInterceptor, type InputEvent } from "./input-interceptor";

describe("Input Interceptor", () => {
  let interceptor: InputInterceptor;
  let capturedEvents: InputEvent[];

  beforeEach(() => {
    vi.restoreAllMocks();
    capturedEvents = [];
    interceptor = new InputInterceptor({
      onCapture: (event) => capturedEvents.push(event),
      debounceMs: 0,
    });
  });

  /* ── Initialization ── */

  describe("initialization", () => {
    it("creates an instance", () => {
      expect(interceptor).toBeInstanceOf(InputInterceptor);
    });
  });

  /* ── Text Capture ── */

  describe("text capture", () => {
    it("captures text from textarea elements", () => {
      interceptor.handleInput({
        elementType: "textarea",
        value: "My SSN is 123-45-6789",
        domain: "chatgpt.com",
      });

      expect(capturedEvents).toHaveLength(1);
      expect(capturedEvents[0]?.text).toBe("My SSN is 123-45-6789");
    });

    it("captures text from contenteditable elements", () => {
      interceptor.handleInput({
        elementType: "contenteditable",
        value: "Sending confidential data",
        domain: "claude.ai",
      });

      expect(capturedEvents).toHaveLength(1);
      expect(capturedEvents[0]?.elementType).toBe("contenteditable");
    });

    it("captures text from input fields", () => {
      interceptor.handleInput({
        elementType: "input",
        value: "api_key: sk-12345",
        domain: "chatgpt.com",
      });

      expect(capturedEvents).toHaveLength(1);
    });
  });

  /* ── Paste Events ── */

  describe("paste events", () => {
    it("captures paste events", () => {
      interceptor.handlePaste({
        text: "4111-1111-1111-1111",
        domain: "chatgpt.com",
        elementType: "textarea",
      });

      expect(capturedEvents).toHaveLength(1);
      expect(capturedEvents[0]?.isPaste).toBe(true);
    });
  });

  /* ── Filtering ── */

  describe("filtering", () => {
    it("skips empty input", () => {
      interceptor.handleInput({
        elementType: "textarea",
        value: "",
        domain: "chatgpt.com",
      });

      expect(capturedEvents).toHaveLength(0);
    });

    it("skips whitespace-only input", () => {
      interceptor.handleInput({
        elementType: "textarea",
        value: "   \n\t  ",
        domain: "chatgpt.com",
      });

      expect(capturedEvents).toHaveLength(0);
    });
  });

  /* ── Domain Tracking ── */

  describe("domain tracking", () => {
    it("includes the domain in captured events", () => {
      interceptor.handleInput({
        elementType: "textarea",
        value: "Some text",
        domain: "claude.ai",
      });

      expect(capturedEvents[0]?.domain).toBe("claude.ai");
    });
  });

  /* ── Length Limiting ── */

  describe("length limiting", () => {
    it("truncates very long input for scanning", () => {
      interceptor.handleInput({
        elementType: "textarea",
        value: "A".repeat(50_000),
        domain: "chatgpt.com",
      });

      expect(capturedEvents[0]?.text.length).toBeLessThanOrEqual(10_000);
    });
  });
});
