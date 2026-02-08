/**
 * @module GPU Benchmark Tests
 * @description TDD tests for GPU inference benchmarking suite.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { GpuBenchmark } from "./gpu-benchmark";

describe("GpuBenchmark", () => {
  let benchmark: GpuBenchmark;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
    benchmark = new GpuBenchmark({
      modelName: "phishing-classifier",
      iterations: 100,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("run", () => {
    it("runs benchmark and produces latency metrics", () => {
      benchmark.setInferenceFunction(() => ({
        result: "phishing",
        confidence: 0.95,
      }));
      const result = benchmark.run();

      expect(result.iterations).toBe(100);
      expect(result.avgLatencyMs).toBeDefined();
      expect(result.p95LatencyMs).toBeDefined();
      expect(result.throughput).toBeDefined();
    });
  });

  describe("compare", () => {
    it("compares two backend results", () => {
      benchmark.setInferenceFunction(() => ({ result: "safe" }));
      const gpu = benchmark.run();

      benchmark.setInferenceFunction(() => ({ result: "safe" }));
      const cpu = benchmark.run();

      const comparison = benchmark.compare(gpu, cpu);
      expect(comparison.speedupFactor).toBeDefined();
    });
  });

  describe("getReport", () => {
    it("generates a benchmark report", () => {
      benchmark.setInferenceFunction(() => ({ result: "safe" }));
      benchmark.run();

      const report = benchmark.getReport();
      expect(report.modelName).toBe("phishing-classifier");
      expect(report.timestamp).toBe(Date.now());
    });
  });
});
