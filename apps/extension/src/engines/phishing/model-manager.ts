/**
 * @module Model Manager
 * @description Manages the lifecycle of ONNX models: download,
 * caching, versioning, and integrity verification. Designed to
 * run in the service worker with Cache API for persistence.
 */

/* ── Types ── */

/** Model lifecycle state. */
export enum ModelStatus {
  NOT_DOWNLOADED = "NOT_DOWNLOADED",
  DOWNLOADING = "DOWNLOADING",
  VERIFYING = "VERIFYING",
  READY = "READY",
  UPDATING = "UPDATING",
  ERROR = "ERROR",
}

/** Remote model manifest from CDN. */
export interface ModelManifest {
  /** Semantic version string. */
  version: string;
  /** URL to download the ONNX model file. */
  modelUrl: string;
  /** SHA-256 hex hash of the model file. */
  hash: string;
  /** File size in bytes (for progress reporting). */
  sizeBytes: number;
}

/** Local model metadata. */
export interface ModelInfo {
  version: string;
  hash: string;
  sizeBytes: number;
}

/** Callback for download progress updates. */
export type ProgressCallback = (progress: number) => void;

/* ── Model Manager ── */

/**
 * Manages model download, caching, versioning, and integrity.
 *
 * Responsibilities:
 * - Fetch remote manifests to check for updates
 * - Download models with progress reporting
 * - Verify model integrity via SHA-256 hash
 * - Track lifecycle status
 */
export class ModelManager {
  private _status: ModelStatus = ModelStatus.NOT_DOWNLOADED;

  /** Current model lifecycle status. */
  get status(): ModelStatus {
    return this._status;
  }

  /** Explicitly set the status (for state machine transitions). */
  setStatus(status: ModelStatus): void {
    this._status = status;
  }

  /**
   * Fetch the model manifest from a remote URL.
   * @throws Error if the fetch fails.
   */
  async fetchManifest(url: string): Promise<ModelManifest> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch model manifest: HTTP ${response.status}`,
      );
    }
    return (await response.json()) as ModelManifest;
  }

  /**
   * Check if a remote manifest has a newer model than the local version.
   *
   * Returns true if:
   * - The versions differ, OR
   * - The hashes differ (same version but different build)
   */
  isUpdateAvailable(local: ModelInfo, remote: ModelManifest): boolean {
    return local.version !== remote.version || local.hash !== remote.hash;
  }

  /**
   * Download a model file from a URL with progress reporting.
   *
   * @param url - The model download URL
   * @param onProgress - Callback with progress (0-100)
   * @returns The downloaded model as an ArrayBuffer
   * @throws Error if the download fails
   */
  async downloadModel(
    url: string,
    onProgress: ProgressCallback,
  ): Promise<ArrayBuffer> {
    this._status = ModelStatus.DOWNLOADING;

    const response = await fetch(url);
    if (!response.ok) {
      this._status = ModelStatus.ERROR;
      throw new Error(`Failed to download model: HTTP ${response.status}`);
    }

    const contentLength = parseInt(
      response.headers.get("content-length") ?? "0",
      10,
    );
    const reader = response.body?.getReader();
    if (!reader) {
      this._status = ModelStatus.ERROR;
      throw new Error("Response body is not readable");
    }

    const chunks: Uint8Array[] = [];
    let receivedBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        receivedBytes += value.byteLength;
        if (contentLength > 0) {
          onProgress(Math.round((receivedBytes / contentLength) * 100));
        }
      }
    }

    // Combine chunks into a single ArrayBuffer
    const result = new Uint8Array(receivedBytes);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.byteLength;
    }

    return result.buffer;
  }

  /**
   * Verify the integrity of downloaded model data against an expected hash.
   *
   * @param data - The downloaded model bytes
   * @param expectedHash - The expected SHA-256 hex hash
   * @returns true if the hash matches
   */
  async verifyIntegrity(
    data: Uint8Array | ArrayBuffer,
    expectedHash: string,
  ): Promise<boolean> {
    this._status = ModelStatus.VERIFYING;

    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    const arrayBuffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ) as ArrayBuffer;
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const matched = hashHex === expectedHash;
    this._status = matched ? ModelStatus.READY : ModelStatus.ERROR;
    return matched;
  }
}
