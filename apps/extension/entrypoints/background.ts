/**
 * @module Service Worker
 * @description Manifest V3 event-driven service worker that orchestrates
 * the three security engines (Context, Provenance, DLP).
 *
 * Lifecycle events:
 * - onInstalled: Detect GPU capabilities, initialize storage defaults
 * - onStartup: Restore engine state from storage
 * - onSuspend: Persist state before idle shutdown
 */
import { createStorage, StorageArea } from "@/src/storage/storage";
import { createMessageBus, MessageType } from "@/src/messaging/messages";
import { getCapabilityReport } from "@/src/capabilities/gpu-detect";
import { setBadgeState, BadgeState } from "@/src/ui/badge";

/** Engine state persisted in chrome.storage.local. */
interface EngineState {
  phishingEnabled: boolean;
  provenanceEnabled: boolean;
  dlpEnabled: boolean;
  lastScanTimestamp: number;
}

const ENGINE_DEFAULTS: EngineState = {
  phishingEnabled: true,
  provenanceEnabled: true,
  dlpEnabled: true,
  lastScanTimestamp: 0,
};

export default defineBackground(() => {
  const engineStorage = createStorage<EngineState>(
    "engineState",
    ENGINE_DEFAULTS,
    StorageArea.LOCAL,
  );

  const bus = createMessageBus();

  /**
   * onInstalled: Runs once on install or update.
   * Detects hardware capabilities and sets initial badge state.
   */
  browser.runtime.onInstalled.addListener(async (details) => {
    console.log("Sentinellium installed", { reason: details.reason });

    // Detect GPU capabilities for local AI inference
    const capabilities = await getCapabilityReport();
    const capStorage = createStorage(
      "capabilities",
      {
        webgpu: { level: "NONE" },
        webnn: { level: "NONE" },
        canRunInference: false,
        timestamp: 0,
      },
      StorageArea.LOCAL,
    );
    await capStorage.set(capabilities);

    // Initialize engine state with defaults
    await engineStorage.set(ENGINE_DEFAULTS);

    // Set initial badge to idle
    await setBadgeState(BadgeState.IDLE);

    console.log("Sentinellium initialized", {
      canRunInference: capabilities.canRunInference,
      webgpu: capabilities.webgpu.level,
    });
  });

  /**
   * onStartup: Runs when the browser starts (after an idle shutdown).
   * Restores badge state from persisted engine state.
   */
  browser.runtime.onStartup.addListener(async () => {
    const state = await engineStorage.get();
    const allEnabled =
      state.phishingEnabled && state.provenanceEnabled && state.dlpEnabled;

    if (allEnabled) {
      await setBadgeState(BadgeState.IDLE);
    } else {
      await setBadgeState(BadgeState.DISABLED);
    }
  });

  // Register message handlers
  bus.on<{ engine: string }>(MessageType.GET_ENGINE_STATE, async () => {
    return await engineStorage.get();
  });

  bus.on<Partial<EngineState>>(
    MessageType.ENGINE_STATE_CHANGED,
    async (payload) => {
      await engineStorage.set(payload);

      const state = await engineStorage.get();
      const allDisabled =
        !state.phishingEnabled && !state.provenanceEnabled && !state.dlpEnabled;

      if (allDisabled) {
        await setBadgeState(BadgeState.DISABLED);
      } else {
        await setBadgeState(BadgeState.IDLE);
      }
    },
  );

  console.log("Sentinellium service worker loaded", {
    id: browser.runtime.id,
  });
});
