/**
 * @module ADR Manager Tests
 * @description TDD tests for Architecture Decision Record management.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { AdrManager, AdrStatus } from "./adr-manager";

describe("AdrManager", () => {
  let manager: AdrManager;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
    manager = new AdrManager();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("create", () => {
    it("creates an ADR with sequential numbering", () => {
      const adr = manager.create({
        title: "Use ONNX Runtime for model inference",
        context: "Need cross-platform ML inference in the browser",
        decision: "Use ONNX Runtime Web for all model inference",
        consequences: "Locked into ONNX format for model distribution",
      });

      expect(adr.number).toBeGreaterThan(0);
      expect(adr.status).toBe(AdrStatus.PROPOSED);
    });
  });

  describe("updateStatus", () => {
    it("transitions ADR status", () => {
      const adr = manager.create({
        title: "Use WebGPU for acceleration",
        context: "GPU acceleration needed",
        decision: "Target WebGPU API",
        consequences: "Limited browser support",
      });

      manager.updateStatus(adr.number, AdrStatus.ACCEPTED);
      expect(manager.get(adr.number)!.status).toBe(AdrStatus.ACCEPTED);
    });
  });

  describe("list", () => {
    it("lists all ADRs", () => {
      manager.create({
        title: "ADR 1",
        context: "",
        decision: "",
        consequences: "",
      });
      manager.create({
        title: "ADR 2",
        context: "",
        decision: "",
        consequences: "",
      });

      expect(manager.list()).toHaveLength(2);
    });
  });

  describe("supersede", () => {
    it("marks an ADR as superseded by another", () => {
      const old = manager.create({
        title: "Old",
        context: "",
        decision: "",
        consequences: "",
      });
      const next = manager.create({
        title: "New",
        context: "",
        decision: "",
        consequences: "",
      });

      manager.supersede(old.number, next.number);
      expect(manager.get(old.number)!.status).toBe(AdrStatus.SUPERSEDED);
      expect(manager.get(old.number)!.supersededBy).toBe(next.number);
    });
  });
});
