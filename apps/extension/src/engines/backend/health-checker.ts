/**
 * @module Health Checker
 * @description Health check and readiness probe system.
 * Aggregates component health into overall service status.
 * UNHEALTHY > DEGRADED > HEALTHY precedence.
 */

/* ── Types ── */

export const HealthStatus = {
  HEALTHY: "HEALTHY",
  DEGRADED: "DEGRADED",
  UNHEALTHY: "UNHEALTHY",
} as const;

export type HealthStatus = (typeof HealthStatus)[keyof typeof HealthStatus];

/** A health check function that returns component status. */
export type HealthCheckFn = () => HealthStatus;

/** Overall health check result with component breakdown. */
export interface HealthResult {
  overall: HealthStatus;
  components: Record<string, HealthStatus>;
  checkedAt: number;
}

/* ── Checker ── */

/**
 * Aggregates component health checks into overall service status.
 */
export class HealthChecker {
  private readonly checks = new Map<string, HealthCheckFn>();

  /**
   * Register a named health check.
   *
   * @param name - Component name
   * @param checkFn - Function that returns health status
   */
  registerCheck(name: string, checkFn: HealthCheckFn): void {
    this.checks.set(name, checkFn);
  }

  /**
   * Run all health checks and aggregate results.
   *
   * @returns Health result with component breakdown
   */
  check(): HealthResult {
    const components: Record<string, HealthStatus> = {};
    let overall: HealthStatus = HealthStatus.HEALTHY;

    for (const [name, checkFn] of this.checks) {
      const status = checkFn();
      components[name] = status;

      if (status === HealthStatus.UNHEALTHY) {
        overall = HealthStatus.UNHEALTHY;
      } else if (
        status === HealthStatus.DEGRADED &&
        overall !== HealthStatus.UNHEALTHY
      ) {
        overall = HealthStatus.DEGRADED;
      }
    }

    return { overall, components, checkedAt: Date.now() };
  }

  /**
   * Readiness probe: returns true if service can accept traffic.
   * Healthy and Degraded are considered ready; Unhealthy is not.
   */
  isReady(): boolean {
    const result = this.check();
    return result.overall !== HealthStatus.UNHEALTHY;
  }

  /** List all registered check names. */
  listChecks(): string[] {
    return [...this.checks.keys()];
  }
}
