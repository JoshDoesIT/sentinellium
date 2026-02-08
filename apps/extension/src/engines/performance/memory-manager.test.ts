/**
 * @module Memory Manager Tests
 * @description TDD tests for memory management and model unloading.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { MemoryManager } from "./memory-manager";

describe("MemoryManager", () => {
  let manager: MemoryManager;

  beforeEach(() => {
    manager = new MemoryManager({ maxMemoryMb: 512 });
  });

  describe("loadModel", () => {
    it("loads a model into memory", () => {
      manager.loadModel({ id: "phishing", sizeMb: 50 });
      expect(manager.getLoadedModels()).toHaveLength(1);
      expect(manager.getUsedMemoryMb()).toBe(50);
    });
  });

  describe("unloadModel", () => {
    it("unloads a model and frees memory", () => {
      manager.loadModel({ id: "phishing", sizeMb: 50 });
      manager.unloadModel("phishing");
      expect(manager.getLoadedModels()).toHaveLength(0);
      expect(manager.getUsedMemoryMb()).toBe(0);
    });
  });

  describe("evictLRU", () => {
    it("evicts least recently used model when at capacity", () => {
      manager.loadModel({ id: "model-a", sizeMb: 300 });
      manager.loadModel({ id: "model-b", sizeMb: 200 });

      // Access model-b to make it "recent"
      manager.touchModel("model-b");

      // This should evict model-a (LRU)
      manager.loadModel({ id: "model-c", sizeMb: 100 });

      const loaded = manager.getLoadedModels().map((m) => m.id);
      expect(loaded).toContain("model-b");
      expect(loaded).toContain("model-c");
    });
  });

  describe("getMemoryReport", () => {
    it("reports memory usage", () => {
      manager.loadModel({ id: "m1", sizeMb: 100 });
      const report = manager.getMemoryReport();
      expect(report.usedMb).toBe(100);
      expect(report.availableMb).toBe(412);
      expect(report.utilizationPercent).toBeCloseTo(19.53, 0);
    });
  });
});
