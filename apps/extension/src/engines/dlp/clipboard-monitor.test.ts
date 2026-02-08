/**
 * @module Clipboard Monitor Tests
 * @description TDD tests for privacy-preserving clipboard monitoring.
 * Tracks paste events to LLM domains without storing raw data.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ClipboardMonitor } from "./clipboard-monitor";

describe("Clipboard Monitor", () => {
  let monitor: ClipboardMonitor;

  beforeEach(() => {
    vi.restoreAllMocks();
    monitor = new ClipboardMonitor();
  });

  /* ── Initialization ── */

  describe("initialization", () => {
    it("creates an instance", () => {
      expect(monitor).toBeInstanceOf(ClipboardMonitor);
    });
  });

  /* ── Hash Generation ── */

  describe("hash generation", () => {
    it("generates a hash from text", () => {
      const hash = monitor.hashText("sensitive data");
      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
    });

    it("generates consistent hashes for the same input", () => {
      const hash1 = monitor.hashText("same text");
      const hash2 = monitor.hashText("same text");
      expect(hash1).toBe(hash2);
    });

    it("generates different hashes for different input", () => {
      const hash1 = monitor.hashText("text one");
      const hash2 = monitor.hashText("text two");
      expect(hash1).not.toBe(hash2);
    });
  });

  /* ── Paste Event Tracking ── */

  describe("paste event tracking", () => {
    it("records a paste event", () => {
      monitor.recordPaste({
        textHash: monitor.hashText("sensitive data"),
        domain: "chatgpt.com",
        elementType: "textarea",
      });

      expect(monitor.getEventCount()).toBe(1);
    });

    it("tracks multiple paste events", () => {
      monitor.recordPaste({
        textHash: "hash1",
        domain: "chatgpt.com",
        elementType: "textarea",
      });
      monitor.recordPaste({
        textHash: "hash2",
        domain: "claude.ai",
        elementType: "contenteditable",
      });

      expect(monitor.getEventCount()).toBe(2);
    });
  });

  /* ── Privacy Preservation ── */

  describe("privacy preservation", () => {
    it("does not store raw text", () => {
      monitor.recordPaste({
        textHash: monitor.hashText("credit card 4111-1111-1111-1111"),
        domain: "chatgpt.com",
        elementType: "textarea",
      });

      const events = monitor.getEvents();
      const allValues = JSON.stringify(events);
      expect(allValues).not.toContain("4111-1111-1111-1111");
    });
  });

  /* ── Event Clearing ── */

  describe("event clearing", () => {
    it("clears all tracked events", () => {
      monitor.recordPaste({
        textHash: "hash1",
        domain: "chatgpt.com",
        elementType: "textarea",
      });
      monitor.clear();
      expect(monitor.getEventCount()).toBe(0);
    });
  });
});
