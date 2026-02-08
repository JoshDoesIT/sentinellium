/**
 * @module Model Manager Tests
 * @description TDD tests for model download, caching, versioning,
 * and integrity verification. Uses mocked fetch/Cache APIs since
 * tests run in Node without browser APIs.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ModelManager,
  ModelStatus,
  type ModelManifest,
  type ModelInfo,
} from "./model-manager";

function createMockManifest(
  version: string = "1.0.0",
  hash: string = "abc123",
): ModelManifest {
  return {
    version,
    modelUrl: "https://cdn.sentinellium.dev/models/phishing-classifier-v1.onnx",
    hash,
    sizeBytes: 50_000_000,
  };
}

describe("Model Manager", () => {
  let manager: ModelManager;

  beforeEach(() => {
    vi.restoreAllMocks();
    manager = new ModelManager();
  });

  /* ── Initialization ── */

  describe("initialization", () => {
    it("creates an instance", () => {
      expect(manager).toBeInstanceOf(ModelManager);
    });

    it("starts with no model loaded", () => {
      expect(manager.status).toBe(ModelStatus.NOT_DOWNLOADED);
    });
  });

  /* ── Manifest Fetching ── */

  describe("manifest fetching", () => {
    it("fetches a remote manifest", async () => {
      const manifest = createMockManifest("2.0.0", "def456");
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(manifest),
        }),
      );

      const result = await manager.fetchManifest(
        "https://cdn.sentinellium.dev/models/manifest.json",
      );
      expect(result.version).toBe("2.0.0");
      expect(result.hash).toBe("def456");
    });

    it("throws on network failure", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: false, status: 500 }),
      );

      await expect(
        manager.fetchManifest("https://cdn.sentinellium.dev/bad"),
      ).rejects.toThrow();
    });
  });

  /* ── Version Checking ── */

  describe("version checking", () => {
    it("detects when an update is available", () => {
      const local: ModelInfo = {
        version: "1.0.0",
        hash: "abc123",
        sizeBytes: 50_000_000,
      };
      const remote = createMockManifest("2.0.0", "def456");
      expect(manager.isUpdateAvailable(local, remote)).toBe(true);
    });

    it("detects when model is up to date", () => {
      const local: ModelInfo = {
        version: "1.0.0",
        hash: "abc123",
        sizeBytes: 50_000_000,
      };
      const remote = createMockManifest("1.0.0", "abc123");
      expect(manager.isUpdateAvailable(local, remote)).toBe(false);
    });

    it("detects hash mismatch at same version", () => {
      const local: ModelInfo = {
        version: "1.0.0",
        hash: "abc123",
        sizeBytes: 50_000_000,
      };
      const remote = createMockManifest("1.0.0", "different_hash");
      expect(manager.isUpdateAvailable(local, remote)).toBe(true);
    });
  });

  /* ── Model Download ── */

  describe("model download", () => {
    it("downloads a model and reports progress", async () => {
      const mockBody = new Uint8Array(1000);
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(mockBody);
          controller.close();
        },
      });

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          headers: new Headers({ "content-length": "1000" }),
          body: mockStream,
        }),
      );

      const progressUpdates: number[] = [];
      const data = await manager.downloadModel(
        "https://cdn.sentinellium.dev/models/model.onnx",
        (progress) => progressUpdates.push(progress),
      );

      expect(data.byteLength).toBeGreaterThan(0);
      expect(progressUpdates.length).toBeGreaterThan(0);
    });

    it("throws on download failure", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: false, status: 404 }),
      );

      await expect(
        manager.downloadModel("https://cdn.sentinellium.dev/bad", () => {}),
      ).rejects.toThrow();
    });
  });

  /* ── Integrity Verification ── */

  describe("integrity verification", () => {
    it("verifies hash matches", async () => {
      // Provide a known buffer and its hash
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const knownHash =
        "74f81fe167d99b4cb41d6d0ccda82278caee9f3e2f25d5e5a3936ff3dcec60d0";
      const result = await manager.verifyIntegrity(data, knownHash);
      expect(result).toBe(true);
    });

    it("rejects hash mismatch", async () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const result = await manager.verifyIntegrity(data, "wrong_hash");
      expect(result).toBe(false);
    });
  });

  /* ── Status Tracking ── */

  describe("status tracking", () => {
    it("transitions through download states", () => {
      expect(manager.status).toBe(ModelStatus.NOT_DOWNLOADED);
      manager.setStatus(ModelStatus.DOWNLOADING);
      expect(manager.status).toBe(ModelStatus.DOWNLOADING);
      manager.setStatus(ModelStatus.READY);
      expect(manager.status).toBe(ModelStatus.READY);
    });

    it("can transition to ERROR state", () => {
      manager.setStatus(ModelStatus.ERROR);
      expect(manager.status).toBe(ModelStatus.ERROR);
    });
  });
});
