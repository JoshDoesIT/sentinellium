/**
 * @module Input Interceptor
 * @description Intercepts text input from textarea, input,
 * and contenteditable elements for DLP scanning.
 *
 * Designed for content-script use. Uses a callback pattern
 * so the DLP pipeline can process captured text.
 */

/* ── Types ── */

/** A captured input event. */
export interface InputEvent {
  text: string;
  elementType: string;
  domain: string;
  isPaste: boolean;
  timestamp: string;
}

/** Raw input data from DOM events. */
export interface RawInput {
  elementType: string;
  value: string;
  domain: string;
}

/** Raw paste data from DOM events. */
export interface RawPaste {
  text: string;
  domain: string;
  elementType: string;
}

/** Interceptor configuration. */
export interface InterceptorConfig {
  onCapture: (event: InputEvent) => void;
  debounceMs?: number;
}

/* ── Constants ── */

/** Max text length to scan (truncate beyond this). */
const MAX_SCAN_LENGTH = 10_000;

/* ── Interceptor ── */

/**
 * Captures text input for DLP scanning.
 */
export class InputInterceptor {
  private readonly onCapture: (event: InputEvent) => void;

  constructor(config: InterceptorConfig) {
    this.onCapture = config.onCapture;
  }

  /**
   * Handle a text input event.
   *
   * @param input - Raw input data from the DOM
   */
  handleInput(input: RawInput): void {
    const text = input.value.trim();
    if (!text) return;

    this.onCapture({
      text: text.slice(0, MAX_SCAN_LENGTH),
      elementType: input.elementType,
      domain: input.domain,
      isPaste: false,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle a paste event.
   *
   * @param paste - Raw paste data from the DOM
   */
  handlePaste(paste: RawPaste): void {
    const text = paste.text.trim();
    if (!text) return;

    this.onCapture({
      text: text.slice(0, MAX_SCAN_LENGTH),
      elementType: paste.elementType,
      domain: paste.domain,
      isPaste: true,
      timestamp: new Date().toISOString(),
    });
  }
}
