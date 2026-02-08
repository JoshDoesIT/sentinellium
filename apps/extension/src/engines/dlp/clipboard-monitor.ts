/**
 * @module Clipboard Monitor
 * @description Privacy-preserving clipboard monitoring for DLP.
 * Tracks paste events to LLM domains using text hashes,
 * never storing raw clipboard content.
 */

/* ── Types ── */

/** A recorded paste event (privacy-preserving). */
export interface PasteEvent {
  textHash: string;
  domain: string;
  elementType: string;
  timestamp: string;
}

/** Input for recording a paste event. */
export interface PasteInput {
  textHash: string;
  domain: string;
  elementType: string;
}

/* ── Monitor ── */

/**
 * Monitors clipboard paste events without storing raw text.
 * Uses simple hashing for deduplication and audit trails.
 */
export class ClipboardMonitor {
  private readonly events: PasteEvent[] = [];

  /**
   * Generate a simple hash from text.
   * Uses a fast non-crypto hash — sufficient for dedup/audit.
   *
   * @param text - Text to hash
   * @returns Hex hash string
   */
  hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, "0");
  }

  /**
   * Record a paste event.
   *
   * @param input - Paste event data (hash, not raw text)
   */
  recordPaste(input: PasteInput): void {
    this.events.push({
      ...input,
      timestamp: new Date().toISOString(),
    });
  }

  /** Get all recorded paste events. */
  getEvents(): readonly PasteEvent[] {
    return [...this.events];
  }

  /** Get count of recorded events. */
  getEventCount(): number {
    return this.events.length;
  }

  /** Clear all tracked events. */
  clear(): void {
    this.events.length = 0;
  }
}
