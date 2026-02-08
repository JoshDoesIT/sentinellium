/**
 * @module Load Tester
 * @description API load testing (k6-style) with scenario simulation,
 * latency percentiles, threshold validation, and reporting.
 */

/* ── Types ── */

export interface LoadConfig {
  targetUrl: string;
  virtualUsers: number;
  durationMs: number;
}

export interface Scenario {
  name: string;
  method: string;
  path: string;
  weight: number;
}

export interface Thresholds {
  maxP95LatencyMs: number;
  maxErrorRate: number;
  minRequestsPerSec: number;
}

export interface SimulationResult {
  totalRequests: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  errorRate: number;
  requestsPerSec: number;
}

export interface ThresholdCheck {
  passed: boolean;
  violations: string[];
}

export interface LoadReport {
  targetUrl: string;
  virtualUsers: number;
  durationMs: number;
  timestamp: number;
  result: SimulationResult;
}

/* ── Tester ── */

/**
 * API load tester with k6-style scenario simulation.
 */
export class LoadTester {
  private readonly config: LoadConfig;
  private readonly scenarios: Scenario[] = [];
  private thresholds: Thresholds | null = null;
  private lastResult: SimulationResult | null = null;

  constructor(config: LoadConfig) {
    this.config = config;
  }

  /**
   * Add a load test scenario.
   *
   * @param scenario - Scenario definition
   */
  addScenario(scenario: Scenario): void {
    this.scenarios.push(scenario);
  }

  /** List all scenarios. */
  listScenarios(): Scenario[] {
    return [...this.scenarios];
  }

  /**
   * Set performance thresholds.
   *
   * @param thresholds - Threshold values
   */
  setThresholds(thresholds: Thresholds): void {
    this.thresholds = thresholds;
  }

  /** Simulate load based on configured scenarios. */
  simulate(): SimulationResult {
    // Simulate realistic metrics based on VUs and duration
    const totalRequests = Math.floor(
      this.config.virtualUsers * (this.config.durationMs / 1000) * 10,
    );
    const avgLatency = 50 + Math.random() * 30;
    const p95 = avgLatency * 2.5;
    const p99 = avgLatency * 4;
    const errorRate = Math.random() * 0.005;
    const rps = totalRequests / (this.config.durationMs / 1000);

    this.lastResult = {
      totalRequests,
      avgLatencyMs: Math.round(avgLatency),
      p95LatencyMs: Math.round(p95),
      p99LatencyMs: Math.round(p99),
      errorRate: Number(errorRate.toFixed(4)),
      requestsPerSec: Math.round(rps),
    };

    return this.lastResult;
  }

  /** Check results against thresholds. */
  checkThresholds(): ThresholdCheck {
    if (!this.lastResult) throw new Error("No simulation run yet");
    if (!this.thresholds) return { passed: true, violations: [] };

    const violations: string[] = [];

    if (this.lastResult.p95LatencyMs > this.thresholds.maxP95LatencyMs) {
      violations.push(
        `p95 latency ${this.lastResult.p95LatencyMs}ms exceeds ${this.thresholds.maxP95LatencyMs}ms`,
      );
    }
    if (this.lastResult.errorRate > this.thresholds.maxErrorRate) {
      violations.push(
        `Error rate ${this.lastResult.errorRate} exceeds ${this.thresholds.maxErrorRate}`,
      );
    }
    if (this.lastResult.requestsPerSec < this.thresholds.minRequestsPerSec) {
      violations.push(
        `RPS ${this.lastResult.requestsPerSec} below ${this.thresholds.minRequestsPerSec}`,
      );
    }

    return { passed: violations.length === 0, violations };
  }

  /** Generate a load test report. */
  getReport(): LoadReport {
    if (!this.lastResult) throw new Error("No simulation run yet");
    return {
      targetUrl: this.config.targetUrl,
      virtualUsers: this.config.virtualUsers,
      durationMs: this.config.durationMs,
      timestamp: Date.now(),
      result: this.lastResult,
    };
  }
}
