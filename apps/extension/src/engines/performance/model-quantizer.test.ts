/**
 * @module Model Quantizer Tests
 * @description TDD tests for ONNX model quantization optimizer.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { ModelQuantizer, QuantizationLevel } from "./model-quantizer";

describe("ModelQuantizer", () => {
  let quantizer: ModelQuantizer;

  beforeEach(() => {
    quantizer = new ModelQuantizer();
  });

  describe("analyzeModel", () => {
    it("analyzes a model and returns size metrics", () => {
      const analysis = quantizer.analyzeModel({
        name: "phishing-classifier",
        sizeBytes: 50_000_000, // 50MB
        precision: "FP32",
      });

      expect(analysis.originalSizeBytes).toBe(50_000_000);
      expect(analysis.precision).toBe("FP32");
    });
  });

  describe("quantize", () => {
    it("simulates INT8 quantization with ~4x compression", () => {
      const result = quantizer.quantize(
        {
          name: "phishing-classifier",
          sizeBytes: 50_000_000,
          precision: "FP32",
        },
        QuantizationLevel.INT8,
      );

      expect(result.quantizedSizeBytes).toBeLessThan(50_000_000);
      expect(result.compressionRatio).toBeGreaterThanOrEqual(3);
    });

    it("simulates INT4 quantization with ~8x compression", () => {
      const result = quantizer.quantize(
        {
          name: "phishing-classifier",
          sizeBytes: 50_000_000,
          precision: "FP32",
        },
        QuantizationLevel.INT4,
      );

      expect(result.compressionRatio).toBeGreaterThanOrEqual(6);
    });
  });

  describe("estimateAccuracyLoss", () => {
    it("estimates accuracy loss from quantization", () => {
      const loss = quantizer.estimateAccuracyLoss(QuantizationLevel.INT8);
      expect(loss).toBeGreaterThanOrEqual(0);
      expect(loss).toBeLessThan(5); // < 5% loss expected
    });
  });
});
