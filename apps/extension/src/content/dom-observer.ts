/**
 * @module DOM Observer
 * @description Configurable MutationObserver wrapper for content scripts.
 * Watches for DOM changes in SPAs and dynamic pages, with debouncing
 * to avoid excessive callbacks during rapid DOM updates.
 */

/** Configuration for the DOM observer. */
export interface DOMObserverConfig {
  /** The DOM element to observe. */
  target: Element;
  /** Callback fired when mutations are detected. */
  onMutation: (records: MutationRecord[]) => void;
  /** Debounce interval in milliseconds (0 = no debounce). */
  debounceMs?: number;
  /** Custom MutationObserver init options to merge with defaults. */
  observerOptions?: MutationObserverInit;
}

/** Handle returned by createDOMObserver for lifecycle management. */
interface DOMObserverHandle {
  disconnect: () => void;
}

/**
 * Create and start a MutationObserver with sensible defaults
 * for content script DOM monitoring.
 *
 * Defaults to watching childList + subtree. Custom options are
 * merged on top of these defaults.
 */
export function createDOMObserver(
  config: DOMObserverConfig,
): DOMObserverHandle {
  const { target, onMutation, debounceMs = 0, observerOptions = {} } = config;

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingRecords: MutationRecord[] = [];

  const callback: MutationCallback = (records) => {
    if (debounceMs > 0) {
      pendingRecords.push(...records);
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        onMutation(pendingRecords);
        pendingRecords = [];
        debounceTimer = null;
      }, debounceMs);
    } else {
      onMutation(records);
    }
  };

  const observer = new MutationObserver(callback);

  const defaultOptions: MutationObserverInit = {
    childList: true,
    subtree: true,
  };

  observer.observe(target, { ...defaultOptions, ...observerOptions });

  return {
    disconnect: () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      observer.disconnect();
    },
  };
}
