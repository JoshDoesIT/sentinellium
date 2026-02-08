/**
 * @module Policy Distributor
 * @description Distributes validated policies to extension instances.
 * Uses Promise.allSettled for resilient multi-endpoint delivery.
 */
import { type PolicyDocument } from "./policy-schema-validator";

/* ── Types ── */

/** Distribution status. */
export enum DistributionStatus {
  SUCCESS = "SUCCESS",
  PARTIAL = "PARTIAL",
  FAILED = "FAILED",
}

/** Distribution result. */
export interface DistributionResult {
  status: DistributionStatus;
  successful: number;
  failed: number;
  total: number;
}

/** Distributor configuration. */
interface DistributorConfig {
  endpoints: string[];
  fetchFn: typeof fetch;
}

/* ── Distributor ── */

/**
 * Distributes policies to extension instances.
 */
export class PolicyDistributor {
  private readonly config: DistributorConfig;

  constructor(config: DistributorConfig) {
    this.config = config;
  }

  /**
   * Distribute a policy to all configured endpoints.
   *
   * @param policy - Policy to distribute
   * @returns Distribution result with success/failure counts
   */
  async distribute(policy: PolicyDocument): Promise<DistributionResult> {
    const results = await Promise.allSettled(
      this.config.endpoints.map((endpoint) =>
        this.config.fetchFn(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(policy),
        }),
      ),
    );

    const successful = results.filter(
      (r) => r.status === "fulfilled" && (r.value as Response).ok,
    ).length;
    const total = this.config.endpoints.length;
    const failed = total - successful;

    let status: DistributionStatus;
    if (successful === total) status = DistributionStatus.SUCCESS;
    else if (successful > 0) status = DistributionStatus.PARTIAL;
    else status = DistributionStatus.FAILED;

    return { status, successful, failed, total };
  }
}
