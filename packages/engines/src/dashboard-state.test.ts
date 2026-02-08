/**
 * @module Dashboard State Tests
 * @description TDD tests for the dashboard state manager.
 * Tracks real-time stats and engine health across all engines.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { DashboardState, EngineStatus } from "./dashboard-state";
import { AlertSource, AlertSeverity } from "./alert-aggregator";

describe("Dashboard State", () => {
  let state: DashboardState;

  beforeEach(() => {
    state = new DashboardState();
  });

  /* ── Initialization ── */

  describe("initialization", () => {
    it("creates an instance", () => {
      expect(state).toBeInstanceOf(DashboardState);
    });

    it("starts with all engines inactive", () => {
      const snapshot = state.getSnapshot();
      expect(snapshot.engines.phishing).toBe(EngineStatus.INACTIVE);
      expect(snapshot.engines.c2pa).toBe(EngineStatus.INACTIVE);
      expect(snapshot.engines.dlp).toBe(EngineStatus.INACTIVE);
    });
  });

  /* ── Engine Status ── */

  describe("engine status", () => {
    it("updates engine status", () => {
      state.setEngineStatus("phishing", EngineStatus.ACTIVE);

      expect(state.getSnapshot().engines.phishing).toBe(EngineStatus.ACTIVE);
    });

    it("tracks engine errors", () => {
      state.setEngineStatus("c2pa", EngineStatus.ERROR);

      expect(state.getSnapshot().engines.c2pa).toBe(EngineStatus.ERROR);
    });
  });

  /* ── Stats Tracking ── */

  describe("stats tracking", () => {
    it("tracks total alerts", () => {
      state.recordAlert(AlertSource.PHISHING, AlertSeverity.HIGH);
      state.recordAlert(AlertSource.DLP, AlertSeverity.CRITICAL);

      expect(state.getSnapshot().totalAlerts).toBe(2);
    });

    it("tracks blocked threats", () => {
      state.recordBlock();
      state.recordBlock();

      expect(state.getSnapshot().threatsBlocked).toBe(2);
    });

    it("tracks pages scanned", () => {
      state.recordScan();

      expect(state.getSnapshot().pagesScanned).toBe(1);
    });
  });

  /* ── Connected Instances ── */

  describe("connected instances", () => {
    it("tracks instance count", () => {
      state.setInstanceCount(5);

      expect(state.getSnapshot().connectedInstances).toBe(5);
    });
  });

  /* ── Snapshot ── */

  describe("snapshot", () => {
    it("returns a complete snapshot", () => {
      state.setEngineStatus("phishing", EngineStatus.ACTIVE);
      state.setEngineStatus("c2pa", EngineStatus.ACTIVE);
      state.setEngineStatus("dlp", EngineStatus.ACTIVE);
      state.recordAlert(AlertSource.PHISHING, AlertSeverity.HIGH);
      state.recordBlock();
      state.recordScan();
      state.setInstanceCount(3);

      const snapshot = state.getSnapshot();
      expect(snapshot.totalAlerts).toBe(1);
      expect(snapshot.threatsBlocked).toBe(1);
      expect(snapshot.pagesScanned).toBe(1);
      expect(snapshot.connectedInstances).toBe(3);
    });
  });
});
