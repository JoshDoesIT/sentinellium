/**
 * @module GPU Benchmark
 * @description GPU inference benchmarking suite.
 * Measures latency, throughput, and supports backend comparisons.
 */

/* ── Types ── */

export interface BenchmarkConfig {
  modelName: string;
  iterations: number;
}

export interface BenchmarkResult {
  iterations: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  throughput: number;
}

export interface ComparisonResult {
  speedupFactor: number;
  latencyDiff: number;
}

export interface BenchmarkReport {
  modelName: string;
  timestamp: number;
  result: BenchmarkResult;
}

/* ── Benchmark ── */

/**
 * GPU inference benchmark.
 */
export class GpuBenchmark {
  private readonly config: BenchmarkConfig;
  private inferFn: () => Record<string, unknown> = () => ({});
  private lastResult: BenchmarkResult | null = null;

  constructor(config: BenchmarkConfig) {
    this.config = config;
  }

  /** Set the inference function to benchmark. */
  setInferenceFunction(fn: () => Record<string, unknown>): void {
    this.inferFn = fn;
  }

  /** Run the benchmark. */
  run(): BenchmarkResult {
    const latencies: number[] = [];

    for (let i = 0; i < this.config.iterations; i++) {
      const start = performance.now();
      this.inferFn();
      latencies.push(performance.now() - start);
    }

    latencies.sort((a, b) => a - b);

    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const p95Index = Math.floor(latencies.length * 0.95);
    const p95 = latencies[p95Index] ?? avg;

    this.lastResult = {
      iterations: this.config.iterations,
      avgLatencyMs: Number(avg.toFixed(3)),
      p95LatencyMs: Number(p95.toFixed(3)),
      minLatencyMs: Number((latencies[0] ?? 0).toFixed(3)),
      maxLatencyMs: Number((latencies[latencies.length - 1] ?? 0).toFixed(3)),
      throughput: Number((1000 / avg).toFixed(1)),
    };

    return this.lastResult;
  }

  /** Compare two benchmark results. */
  compare(a: BenchmarkResult, b: BenchmarkResult): ComparisonResult {
    return {
      speedupFactor: Number(
        (b.avgLatencyMs / Math.max(a.avgLatencyMs, 0.001)).toFixed(2),
      ),
      latencyDiff: Number((b.avgLatencyMs - a.avgLatencyMs).toFixed(3)),
    };
  }

  /** Generate a report. */
  getReport(): BenchmarkReport {
    if (!this.lastResult) throw new Error("No benchmark run yet");
    return {
      modelName: this.config.modelName,
      timestamp: Date.now(),
      result: this.lastResult,
    };
  }
}
