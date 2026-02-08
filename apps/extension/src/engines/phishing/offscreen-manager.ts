/**
 * @module Offscreen Manager
 * @description Manages the offscreen document lifecycle for ONNX
 * Runtime inference. The offscreen document provides a DOM context
 * with WebGPU access that MV3 service workers lack.
 *
 * Architecture:
 *   Service Worker → OffscreenManager → offscreen.html → ONNX Runtime → GPU
 *
 * The manager ensures exactly one offscreen document exists at a time
 * (Chrome limitation) and routes inference requests via message passing.
 */

/* ── Types ── */

/** Offscreen document lifecycle status. */
export enum OffscreenStatus {
  IDLE = "IDLE",
  CREATING = "CREATING",
  INFERRING = "INFERRING",
  ERROR = "ERROR",
}

/** Message sent to the offscreen document for inference. */
export interface InferenceRequest {
  type: "INFERENCE_REQUEST";
  system: string;
  user: string;
  requestId: string;
}

/** Result received from the offscreen document. */
export interface InferenceResult {
  type: "INFERENCE_RESULT";
  requestId: string;
  classification: string;
  confidence: number;
  reasoning: string;
}

/* ── Constants ── */

const OFFSCREEN_URL = "offscreen.html";
const OFFSCREEN_JUSTIFICATION =
  "ONNX Runtime Web inference requires DOM/WebGPU context";

/* ── Manager ── */

/**
 * Manages the offscreen document for ML inference.
 *
 * Chrome only allows one offscreen document per extension.
 * This manager handles creation, reuse, and teardown,
 * plus message routing for inference requests.
 */
export class OffscreenManager {
  private _status: OffscreenStatus = OffscreenStatus.IDLE;
  private readonly offscreenApi: typeof chrome.offscreen;
  private readonly runtimeApi: typeof chrome.runtime;

  constructor(
    offscreenApi: typeof chrome.offscreen,
    runtimeApi: typeof chrome.runtime,
  ) {
    this.offscreenApi = offscreenApi;
    this.runtimeApi = runtimeApi;
  }

  /** Current lifecycle status. */
  get status(): OffscreenStatus {
    return this._status;
  }

  /**
   * Ensure the offscreen document exists, creating it if needed.
   * Safe to call multiple times — will not create duplicates.
   */
  async ensureDocument(): Promise<void> {
    const exists = await this.offscreenApi.hasDocument();
    if (exists) return;

    this._status = OffscreenStatus.CREATING;
    await this.offscreenApi.createDocument({
      url: OFFSCREEN_URL,
      reasons: [this.offscreenApi.Reason.WORKERS],
      justification: OFFSCREEN_JUSTIFICATION,
    });
    this._status = OffscreenStatus.IDLE;
  }

  /**
   * Close the offscreen document if it exists.
   * No-op if no document is active.
   */
  async closeDocument(): Promise<void> {
    const exists = await this.offscreenApi.hasDocument();
    if (!exists) return;
    await this.offscreenApi.closeDocument();
    this._status = OffscreenStatus.IDLE;
  }

  /**
   * Send an inference request to the offscreen document and
   * await the result.
   *
   * @param request - The inference request payload
   * @returns The inference result from ONNX Runtime
   * @throws Error if inference fails
   */
  async runInference(request: InferenceRequest): Promise<InferenceResult> {
    this._status = OffscreenStatus.INFERRING;

    try {
      await this.ensureDocument();
      const result = (await this.runtimeApi.sendMessage(
        request,
      )) as InferenceResult;
      this._status = OffscreenStatus.IDLE;
      return result;
    } catch (error) {
      this._status = OffscreenStatus.ERROR;
      throw error;
    }
  }

  /**
   * Check if the offscreen document is active and healthy.
   */
  async isHealthy(): Promise<boolean> {
    return this.offscreenApi.hasDocument();
  }
}
