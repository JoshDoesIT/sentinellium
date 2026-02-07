/**
 * @module GPU Capability Detection
 * @description Detects WebGPU and WebNN support for on-device AI inference.
 * Used at install time and on startup to determine which inference
 * backends are available on the user's hardware.
 */

/** Support level for a browser capability. */
export enum SupportLevel {
  /** API present, adapter/context available, ready for inference. */
  FULL = "FULL",
  /** API present but no usable adapter/context. */
  PARTIAL = "PARTIAL",
  /** API not available in this browser/environment. */
  NONE = "NONE",
}

/** Adapter info returned from WebGPU detection. */
interface AdapterInfo {
  vendor: string;
  architecture: string;
}

/** Result from detecting a single capability. */
interface DetectionResult {
  level: SupportLevel;
  adapter?: AdapterInfo;
  error?: string;
}

/** Combined report of all hardware capabilities. */
export interface CapabilityReport {
  webgpu: DetectionResult;
  webnn: DetectionResult;
  canRunInference: boolean;
  timestamp: number;
}

/**
 * Detect WebGPU support by requesting a GPU adapter.
 * Returns FULL if adapter is present, PARTIAL if the API exists
 * but no adapter is available, and NONE if the API is missing.
 */
export async function detectWebGPU(): Promise<DetectionResult> {
  const gpu = (
    navigator as unknown as {
      gpu?: { requestAdapter: () => Promise<unknown | null> };
    }
  ).gpu;

  if (!gpu) {
    return { level: SupportLevel.NONE };
  }

  try {
    const adapter = await gpu.requestAdapter();

    if (!adapter) {
      return { level: SupportLevel.PARTIAL };
    }

    const info = await (
      adapter as unknown as {
        requestAdapterInfo: () => Promise<AdapterInfo>;
      }
    ).requestAdapterInfo();

    return {
      level: SupportLevel.FULL,
      adapter: {
        vendor: info.vendor,
        architecture: info.architecture,
      },
    };
  } catch (err) {
    return {
      level: SupportLevel.NONE,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Detect WebNN support by attempting to create an ML context.
 * Returns FULL if context creation succeeds, NONE otherwise.
 */
export async function detectWebNN(): Promise<DetectionResult> {
  const ml = (
    navigator as unknown as { ml?: { createContext: () => Promise<unknown> } }
  ).ml;

  if (!ml) {
    return { level: SupportLevel.NONE };
  }

  try {
    await ml.createContext();
    return { level: SupportLevel.FULL };
  } catch (err) {
    return {
      level: SupportLevel.NONE,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Generate a full capability report combining WebGPU and WebNN results.
 * Inference is possible if at least WebGPU has FULL support.
 */
export async function getCapabilityReport(): Promise<CapabilityReport> {
  const [webgpu, webnn] = await Promise.all([detectWebGPU(), detectWebNN()]);

  return {
    webgpu,
    webnn,
    canRunInference: webgpu.level === SupportLevel.FULL,
    timestamp: Date.now(),
  };
}
