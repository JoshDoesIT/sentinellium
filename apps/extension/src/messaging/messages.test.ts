/**
 * @module Message Passing Tests
 * @description TDD tests for the typed message bus that enables
 * communication between popup, service worker, and content scripts.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  MessageType,
  sendMessage,
  onMessage,
  sendToTab,
  createMessageBus,
} from "./messages";

/**
 * Mock of the chrome.runtime and chrome.tabs messaging APIs.
 */
function createMockChromeMessaging() {
  const listeners: Array<
    (
      message: unknown,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: unknown) => void,
    ) => boolean | void
  > = [];

  return {
    runtime: {
      sendMessage: vi.fn(async (message: unknown) => {
        let response: unknown;
        for (const listener of listeners) {
          listener(
            message,
            { id: "test-extension" } as chrome.runtime.MessageSender,
            (r) => {
              response = r;
            },
          );
        }
        return response;
      }),
      onMessage: {
        addListener: vi.fn(
          (
            cb: (
              message: unknown,
              sender: chrome.runtime.MessageSender,
              sendResponse: (response?: unknown) => void,
            ) => boolean | void,
          ) => {
            listeners.push(cb);
          },
        ),
        removeListener: vi.fn(
          (
            cb: (
              message: unknown,
              sender: chrome.runtime.MessageSender,
              sendResponse: (response?: unknown) => void,
            ) => boolean | void,
          ) => {
            const idx = listeners.indexOf(cb);
            if (idx >= 0) listeners.splice(idx, 1);
          },
        ),
      },
    },
    tabs: {
      sendMessage: vi.fn(async (_tabId: number, _message: unknown) => {
        return undefined;
      }),
    },
  };
}

describe("MessageType", () => {
  it("defines the expected message type constants", () => {
    expect(MessageType.SCAN_REQUEST).toBe("SCAN_REQUEST");
    expect(MessageType.SCAN_RESULT).toBe("SCAN_RESULT");
    expect(MessageType.ENGINE_STATE_CHANGED).toBe("ENGINE_STATE_CHANGED");
    expect(MessageType.GET_ENGINE_STATE).toBe("GET_ENGINE_STATE");
    expect(MessageType.BADGE_UPDATE).toBe("BADGE_UPDATE");
    expect(MessageType.CAPABILITY_REPORT).toBe("CAPABILITY_REPORT");
  });
});

describe("sendMessage", () => {
  let mockChrome: ReturnType<typeof createMockChromeMessaging>;

  beforeEach(() => {
    mockChrome = createMockChromeMessaging();
    vi.stubGlobal("chrome", mockChrome);
  });

  it("sends a typed message via chrome.runtime.sendMessage", async () => {
    await sendMessage(MessageType.SCAN_REQUEST, { url: "https://evil.com" });

    expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: MessageType.SCAN_REQUEST,
      payload: { url: "https://evil.com" },
    });
  });

  it("returns the response from the listener", async () => {
    mockChrome.runtime.sendMessage.mockResolvedValueOnce({ safe: false });

    const response = await sendMessage(MessageType.SCAN_REQUEST, {
      url: "https://phish.net",
    });

    expect(response).toEqual({ safe: false });
  });
});

describe("onMessage", () => {
  let mockChrome: ReturnType<typeof createMockChromeMessaging>;

  beforeEach(() => {
    mockChrome = createMockChromeMessaging();
    vi.stubGlobal("chrome", mockChrome);
  });

  it("registers a listener for a specific message type", async () => {
    const handler = vi.fn();
    onMessage(MessageType.SCAN_RESULT, handler);

    // Trigger a matching message
    await mockChrome.runtime.sendMessage({
      type: MessageType.SCAN_RESULT,
      payload: { threatLevel: "high" },
    });

    expect(handler).toHaveBeenCalledWith(
      { threatLevel: "high" },
      expect.objectContaining({ id: "test-extension" }),
    );
  });

  it("does not fire handler for non-matching message types", async () => {
    const handler = vi.fn();
    onMessage(MessageType.SCAN_RESULT, handler);

    await mockChrome.runtime.sendMessage({
      type: MessageType.BADGE_UPDATE,
      payload: { state: "IDLE" },
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it("returns an unsubscribe function", async () => {
    const handler = vi.fn();
    const unsubscribe = onMessage(MessageType.SCAN_RESULT, handler);

    unsubscribe();
    await mockChrome.runtime.sendMessage({
      type: MessageType.SCAN_RESULT,
      payload: { threatLevel: "low" },
    });

    expect(handler).not.toHaveBeenCalled();
  });
});

describe("sendToTab", () => {
  let mockChrome: ReturnType<typeof createMockChromeMessaging>;

  beforeEach(() => {
    mockChrome = createMockChromeMessaging();
    vi.stubGlobal("chrome", mockChrome);
  });

  it("sends a typed message to a specific tab", async () => {
    await sendToTab(42, MessageType.SCAN_REQUEST, {
      selector: "form",
    });

    expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(42, {
      type: MessageType.SCAN_REQUEST,
      payload: { selector: "form" },
    });
  });
});

describe("createMessageBus", () => {
  let mockChrome: ReturnType<typeof createMockChromeMessaging>;

  beforeEach(() => {
    mockChrome = createMockChromeMessaging();
    vi.stubGlobal("chrome", mockChrome);
  });

  it("provides a scoped send/listen interface", async () => {
    const bus = createMessageBus();
    const handler = vi.fn();

    bus.on(MessageType.GET_ENGINE_STATE, handler);
    await bus.send(MessageType.GET_ENGINE_STATE, { engine: "phishing" });

    expect(handler).toHaveBeenCalledWith(
      { engine: "phishing" },
      expect.any(Object),
    );
  });

  it("disposes all listeners on destroy", async () => {
    const bus = createMessageBus();
    const handler = vi.fn();

    bus.on(MessageType.CAPABILITY_REPORT, handler);
    bus.destroy();

    await mockChrome.runtime.sendMessage({
      type: MessageType.CAPABILITY_REPORT,
      payload: { webgpu: true },
    });

    expect(handler).not.toHaveBeenCalled();
  });
});
