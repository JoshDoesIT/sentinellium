/**
 * @module Alert Stream Client
 * @description WebSocket client for real-time alert streaming.
 * Handles connection lifecycle, message parsing, handler dispatch,
 * and exponential backoff reconnection.
 */

/* ── Types ── */

/** Connection state. */
export enum ConnectionState {
  DISCONNECTED = "DISCONNECTED",
  CONNECTING = "CONNECTING",
  CONNECTED = "CONNECTED",
  RECONNECTING = "RECONNECTING",
}

/** Known message types. */
const KNOWN_TYPES = new Set(["alert", "heartbeat", "policy-update"]);

/** Parsed WebSocket message. */
export interface StreamMessage {
  type: string;
  data: Record<string, unknown>;
}

/** Event handlers. */
export interface StreamHandlers {
  onAlert: (data: Record<string, unknown>) => void;
  onStateChange?: (state: ConnectionState) => void;
}

/** Client configuration. */
interface StreamConfig {
  url: string;
  handlers: StreamHandlers;
}

/* ── Constants ── */

const BASE_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30_000;

/* ── Client ── */

/**
 * WebSocket client for real-time alert streaming.
 */
export class AlertStreamClient {
  private readonly config: StreamConfig;
  private state: ConnectionState = ConnectionState.DISCONNECTED;

  constructor(config: StreamConfig) {
    this.config = config;
  }

  /** Get current connection state. */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * Parse a raw WebSocket message.
   *
   * @param raw - Raw message string
   * @returns Parsed message or null if invalid
   */
  parseMessage(raw: string): StreamMessage | null {
    try {
      const parsed = JSON.parse(raw) as {
        type?: string;
        data?: Record<string, unknown>;
      };
      if (!parsed.type || !KNOWN_TYPES.has(parsed.type)) return null;
      return { type: parsed.type, data: parsed.data ?? {} };
    } catch {
      return null;
    }
  }

  /**
   * Dispatch a parsed message to the appropriate handler.
   *
   * @param message - Parsed stream message
   */
  dispatchMessage(message: StreamMessage): void {
    if (message.type === "alert") {
      this.config.handlers.onAlert(message.data);
    }
  }

  /**
   * Calculate exponential backoff delay.
   *
   * @param attempt - Retry attempt number (0-based)
   * @returns Delay in milliseconds
   */
  getBackoffMs(attempt: number): number {
    return Math.min(BASE_BACKOFF_MS * Math.pow(2, attempt), MAX_BACKOFF_MS);
  }
}
