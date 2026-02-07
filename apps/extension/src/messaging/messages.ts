/**
 * @module Message Passing
 * @description Typed message bus for communication between extension
 * contexts (popup, service worker, content scripts). All messages
 * are discriminated by MessageType for type-safe handling.
 */

/** All message types used in the Sentinellium extension. */
export enum MessageType {
  SCAN_REQUEST = "SCAN_REQUEST",
  SCAN_RESULT = "SCAN_RESULT",
  ENGINE_STATE_CHANGED = "ENGINE_STATE_CHANGED",
  GET_ENGINE_STATE = "GET_ENGINE_STATE",
  BADGE_UPDATE = "BADGE_UPDATE",
  CAPABILITY_REPORT = "CAPABILITY_REPORT",
}

/** Wire format for all extension messages. */
interface Message<T = unknown> {
  type: MessageType;
  payload: T;
}

/**
 * Send a typed message via chrome.runtime.sendMessage.
 * Used from popup or content script to reach the service worker.
 */
export async function sendMessage<T = unknown, R = unknown>(
  type: MessageType,
  payload: T,
): Promise<R> {
  const message: Message<T> = { type, payload };
  return chrome.runtime.sendMessage(message) as Promise<R>;
}

/**
 * Listen for a specific message type. The handler only fires
 * when the incoming message matches the specified type.
 *
 * @returns Unsubscribe function to remove the listener
 */
export function onMessage<T = unknown>(
  type: MessageType,
  handler: (payload: T, sender: chrome.runtime.MessageSender) => void,
): () => void {
  const listener = (
    message: unknown,
    sender: chrome.runtime.MessageSender,
    _sendResponse: (response?: unknown) => void,
  ) => {
    const msg = message as Message<T>;
    if (msg?.type === type) {
      handler(msg.payload, sender);
    }
  };

  chrome.runtime.onMessage.addListener(listener);

  return () => {
    chrome.runtime.onMessage.removeListener(listener);
  };
}

/**
 * Send a typed message to a specific tab's content script.
 */
export async function sendToTab<T = unknown>(
  tabId: number,
  type: MessageType,
  payload: T,
): Promise<void> {
  const message: Message<T> = { type, payload };
  await chrome.tabs.sendMessage(tabId, message);
}

/**
 * Create a scoped message bus with lifecycle management.
 * Tracks all registered listeners for clean disposal.
 */
export function createMessageBus() {
  const unsubscribers: Array<() => void> = [];

  return {
    send: sendMessage,

    on<T = unknown>(
      type: MessageType,
      handler: (payload: T, sender: chrome.runtime.MessageSender) => void,
    ) {
      const unsub = onMessage<T>(type, handler);
      unsubscribers.push(unsub);
      return unsub;
    },

    destroy() {
      for (const unsub of unsubscribers) {
        unsub();
      }
      unsubscribers.length = 0;
    },
  };
}
