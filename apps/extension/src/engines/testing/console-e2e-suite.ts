/**
 * @module Console E2E Suite
 * @description Console dashboard E2E test suite.
 * Manages user flow registration, execution, and result reporting.
 */

/* ── Types ── */

export interface FlowResult {
  passed: boolean;
  error?: string;
}

export interface E2eFlow {
  id: string;
  name: string;
  steps: string[];
  verify: () => FlowResult;
}

export interface FlowReport {
  flowId: string;
  flowName: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

export interface SuiteReport {
  baseUrl: string;
  timestamp: number;
  total: number;
  passed: number;
  failed: number;
  flows: FlowReport[];
}

export interface SuiteConfig {
  baseUrl: string;
}

/* ── Suite ── */

/**
 * Console E2E test suite.
 */
export class ConsoleE2eSuite {
  private readonly config: SuiteConfig;
  private readonly flows: E2eFlow[] = [];
  private lastReport: SuiteReport | null = null;

  constructor(config: SuiteConfig) {
    this.config = config;
  }

  /**
   * Register an E2E flow.
   *
   * @param flow - Flow definition
   */
  registerFlow(flow: E2eFlow): void {
    this.flows.push(flow);
  }

  /** List all registered flows. */
  listFlows(): E2eFlow[] {
    return [...this.flows];
  }

  /**
   * Run a single flow by ID.
   *
   * @param flowId - Flow to run
   */
  runFlow(flowId: string): FlowReport {
    const flow = this.flows.find((f) => f.id === flowId);
    if (!flow) throw new Error(`Flow '${flowId}' not found`);

    const start = Date.now();
    const result = flow.verify();

    return {
      flowId: flow.id,
      flowName: flow.name,
      passed: result.passed,
      error: result.error,
      durationMs: Date.now() - start,
    };
  }

  /** Run all registered flows. */
  runAll(): SuiteReport {
    const results = this.flows.map((flow) => this.runFlow(flow.id));

    this.lastReport = {
      baseUrl: this.config.baseUrl,
      timestamp: Date.now(),
      total: results.length,
      passed: results.filter((r) => r.passed).length,
      failed: results.filter((r) => !r.passed).length,
      flows: results,
    };

    return this.lastReport;
  }

  /** Get the latest report. */
  getReport(): SuiteReport {
    if (!this.lastReport) throw new Error("No tests have been run");
    return this.lastReport;
  }
}
