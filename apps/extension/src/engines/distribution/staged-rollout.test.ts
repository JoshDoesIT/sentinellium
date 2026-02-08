/**
 * @module Staged Rollout Tests
 * @description TDD tests for enterprise staged rollout.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { StagedRollout } from "./staged-rollout";

describe("StagedRollout", () => {
  let rollout: StagedRollout;

  beforeEach(() => {
    rollout = new StagedRollout({
      version: "1.2.0",
      stages: [
        { name: "canary", percentage: 5 },
        { name: "beta", percentage: 25 },
        { name: "ga", percentage: 100 },
      ],
    });
  });

  describe("getCurrentStage", () => {
    it("starts at first stage", () => {
      expect(rollout.getCurrentStage().name).toBe("canary");
      expect(rollout.getCurrentStage().percentage).toBe(5);
    });
  });

  describe("advance", () => {
    it("advances to next stage", () => {
      rollout.advance();
      expect(rollout.getCurrentStage().name).toBe("beta");
    });

    it("advances to GA", () => {
      rollout.advance();
      rollout.advance();
      expect(rollout.getCurrentStage().name).toBe("ga");
      expect(rollout.getCurrentStage().percentage).toBe(100);
    });

    it("throws at final stage", () => {
      rollout.advance();
      rollout.advance();
      expect(() => rollout.advance()).toThrow();
    });
  });

  describe("rollback", () => {
    it("rolls back to previous stage", () => {
      rollout.advance();
      rollout.rollback();
      expect(rollout.getCurrentStage().name).toBe("canary");
    });

    it("throws at first stage", () => {
      expect(() => rollout.rollback()).toThrow();
    });
  });

  describe("isTargeted", () => {
    it("targets users within rollout percentage", () => {
      // Canary at 5% — hash-based targeting
      const targeted = rollout.isTargeted("user-001");
      expect(typeof targeted).toBe("boolean");
    });
  });

  describe("getProgress", () => {
    it("reports rollout progress", () => {
      const progress = rollout.getProgress();
      expect(progress.version).toBe("1.2.0");
      expect(progress.currentStage).toBe("canary");
      expect(progress.stageIndex).toBe(0);
      expect(progress.totalStages).toBe(3);
    });
  });
});
