/**
 * @module Content Script
 * @description WXT content script entrypoint. Injects into all pages
 * and monitors DOM mutations for security analysis by the three engines.
 *
 * Communicates with the service worker via the message passing system.
 * Supports SPA navigation via MutationObserver.
 */
import { createDOMObserver } from "@/src/content/dom-observer";
import { sendMessage, onMessage, MessageType } from "@/src/messaging/messages";

export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_idle",

  main() {
    /**
     * Start observing the page DOM for mutations.
     * Uses debouncing to avoid flooding the service worker.
     */
    function startObserving() {
      createDOMObserver({
        target: document.body,
        debounceMs: 250,
        onMutation: (records) => {
          const hasNewContent = records.some(
            (r) => r.type === "childList" && r.addedNodes.length > 0,
          );

          if (hasNewContent) {
            sendMessage(MessageType.SCAN_REQUEST, {
              url: window.location.href,
              title: document.title,
              timestamp: Date.now(),
            });
          }
        },
      });
    }

    // Listen for scan requests from the service worker
    onMessage(MessageType.SCAN_REQUEST, (payload) => {
      console.log("Content script received scan request", payload);
    });

    // Start observing
    startObserving();

    console.log("Sentinellium content script loaded", {
      url: window.location.href,
    });
  },
});
