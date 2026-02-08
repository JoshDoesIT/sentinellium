/**
 * @module Offscreen Manager Tests
 * @description TDD tests for the offscreen document manager.
 * Manages the lifecycle of the offscreen document used for
 * ONNX Runtime inference with WebGPU. Mocks Chrome APIs
 * since tests run in Node.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    OffscreenManager,
    OffscreenStatus,
    type InferenceRequest,
} from "./offscreen-manager";

/* ── Chrome API Mocking ── */

function mockChromeOffscreen() {
    return {
        createDocument: vi.fn().mockResolvedValue(undefined),
        closeDocument: vi.fn().mockResolvedValue(undefined),
        hasDocument: vi.fn().mockResolvedValue(false),
        Reason: { WORKERS: "WORKERS" },
    };
}

function mockChromeRuntime() {
    const listeners: Array<(message: unknown) => void> = [];
    return {
        sendMessage: vi
            .fn()
            .mockResolvedValue({ classification: "SAFE", confidence: 0.95 }),
        onMessage: {
            addListener: vi.fn((fn: (message: unknown) => void) =>
                listeners.push(fn),
            ),
            removeListener: vi.fn(),
        },
        _listeners: listeners,
    };
}

describe("Offscreen Manager", () => {
    let manager: OffscreenManager;
    let mockOffscreen: ReturnType<typeof mockChromeOffscreen>;
    let mockRuntime: ReturnType<typeof mockChromeRuntime>;

    beforeEach(() => {
        vi.restoreAllMocks();
        mockOffscreen = mockChromeOffscreen();
        mockRuntime = mockChromeRuntime();
        manager = new OffscreenManager(
            mockOffscreen as unknown as typeof chrome.offscreen,
            mockRuntime as unknown as typeof chrome.runtime,
        );
    });

    /* ── Initialization ── */

    describe("initialization", () => {
        it("creates an instance", () => {
            expect(manager).toBeInstanceOf(OffscreenManager);
        });

        it("starts with IDLE status", () => {
            expect(manager.status).toBe(OffscreenStatus.IDLE);
        });
    });

    /* ── Document Lifecycle ── */

    describe("document lifecycle", () => {
        it("creates an offscreen document", async () => {
            await manager.ensureDocument();
            expect(mockOffscreen.createDocument).toHaveBeenCalledWith(
                expect.objectContaining({
                    url: expect.stringContaining("offscreen"),
                    reasons: expect.arrayContaining(["WORKERS"]),
                }),
            );
        });

        it("reuses existing document if already created", async () => {
            mockOffscreen.hasDocument.mockResolvedValue(true);
            await manager.ensureDocument();
            expect(mockOffscreen.createDocument).not.toHaveBeenCalled();
        });

        it("closes the offscreen document", async () => {
            mockOffscreen.hasDocument.mockResolvedValue(true);
            await manager.closeDocument();
            expect(mockOffscreen.closeDocument).toHaveBeenCalled();
        });

        it("handles close when no document exists", async () => {
            mockOffscreen.hasDocument.mockResolvedValue(false);
            await manager.closeDocument();
            expect(mockOffscreen.closeDocument).not.toHaveBeenCalled();
        });
    });

    /* ── Inference Requests ── */

    describe("inference requests", () => {
        it("sends an inference request and receives a result", async () => {
            const request: InferenceRequest = {
                type: "INFERENCE_REQUEST",
                system: "You are a phishing classifier",
                user: "Analyze this page",
                requestId: "test-123",
            };

            mockRuntime.sendMessage.mockResolvedValue({
                type: "INFERENCE_RESULT",
                requestId: "test-123",
                classification: "SAFE",
                confidence: 0.95,
                reasoning: "No suspicious signals",
            });

            const result = await manager.runInference(request);
            expect(result.classification).toBe("SAFE");
            expect(result.confidence).toBe(0.95);
        });

        it("updates status during inference", async () => {
            const request: InferenceRequest = {
                type: "INFERENCE_REQUEST",
                system: "test",
                user: "test",
                requestId: "test-456",
            };

            expect(manager.status).toBe(OffscreenStatus.IDLE);

            // Start inference (the mock resolves immediately)
            const resultPromise = manager.runInference(request);
            // After await, status should reflect completion
            await resultPromise;
            expect(manager.status).toBe(OffscreenStatus.IDLE);
        });

        it("handles inference errors gracefully", async () => {
            const request: InferenceRequest = {
                type: "INFERENCE_REQUEST",
                system: "test",
                user: "test",
                requestId: "test-789",
            };

            mockRuntime.sendMessage.mockRejectedValue(new Error("Inference failed"));

            await expect(manager.runInference(request)).rejects.toThrow(
                "Inference failed",
            );
            expect(manager.status).toBe(OffscreenStatus.ERROR);
        });
    });

    /* ── Health Checks ── */

    describe("health checks", () => {
        it("reports healthy when document exists", async () => {
            mockOffscreen.hasDocument.mockResolvedValue(true);
            expect(await manager.isHealthy()).toBe(true);
        });

        it("reports unhealthy when document is missing", async () => {
            mockOffscreen.hasDocument.mockResolvedValue(false);
            expect(await manager.isHealthy()).toBe(false);
        });
    });
});
