/**
 * @module Auto Updater Tests
 * @description TDD tests for model auto-update mechanism.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { AutoUpdater, UpdateChannel } from "./auto-updater";

describe("AutoUpdater", () => {
  let updater: AutoUpdater;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
    updater = new AutoUpdater({
      currentVersion: "1.0.0",
      channel: UpdateChannel.STABLE,
      checkIntervalMs: 3600_000,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("checkForUpdate", () => {
    it("detects available update", () => {
      updater.setAvailableVersion("1.1.0");
      const result = updater.checkForUpdate();
      expect(result.available).toBe(true);
      expect(result.version).toBe("1.1.0");
    });

    it("reports no update when current", () => {
      updater.setAvailableVersion("1.0.0");
      const result = updater.checkForUpdate();
      expect(result.available).toBe(false);
    });
  });

  describe("applyUpdate", () => {
    it("applies update and changes current version", () => {
      updater.setAvailableVersion("1.1.0");
      updater.applyUpdate("1.1.0");
      expect(updater.getCurrentVersion()).toBe("1.1.0");
    });

    it("records update in history", () => {
      updater.setAvailableVersion("1.1.0");
      updater.applyUpdate("1.1.0");
      const history = updater.getUpdateHistory();
      expect(history).toHaveLength(1);
      expect(history[0]!.from).toBe("1.0.0");
      expect(history[0]!.to).toBe("1.1.0");
    });
  });

  describe("channel", () => {
    it("returns the update channel", () => {
      expect(updater.getChannel()).toBe(UpdateChannel.STABLE);
    });

    it("allows switching channels", () => {
      updater.setChannel(UpdateChannel.BETA);
      expect(updater.getChannel()).toBe(UpdateChannel.BETA);
    });
  });
});
