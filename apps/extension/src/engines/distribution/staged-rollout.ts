/**
 * @module Staged Rollout
 * @description Enterprise staged rollout for extension updates.
 * Manages progressive deployment with canary, beta, and GA stages.
 */

/* ── Types ── */

export interface RolloutStage {
  name: string;
  percentage: number;
}

export interface RolloutConfig {
  version: string;
  stages: RolloutStage[];
}

export interface RolloutProgress {
  version: string;
  currentStage: string;
  stageIndex: number;
  totalStages: number;
  percentage: number;
}

/* ── Helpers ── */

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/* ── Rollout ── */

/**
 * Staged rollout controller.
 */
export class StagedRollout {
  private readonly config: RolloutConfig;
  private stageIndex = 0;

  constructor(config: RolloutConfig) {
    this.config = config;
  }

  /** Get the current rollout stage. */
  getCurrentStage(): RolloutStage {
    return { ...this.config.stages[this.stageIndex]! };
  }

  /**
   * Advance to the next stage.
   *
   * @throws Error if already at final stage
   */
  advance(): void {
    if (this.stageIndex >= this.config.stages.length - 1) {
      throw new Error("Already at final stage");
    }
    this.stageIndex++;
  }

  /**
   * Roll back to the previous stage.
   *
   * @throws Error if already at first stage
   */
  rollback(): void {
    if (this.stageIndex <= 0) {
      throw new Error("Already at first stage");
    }
    this.stageIndex--;
  }

  /**
   * Check if a user is targeted in the current rollout stage.
   *
   * @param userId - User identifier
   * @returns True if user falls within rollout percentage
   */
  isTargeted(userId: string): boolean {
    const hash = simpleHash(userId) % 100;
    return hash < this.getCurrentStage().percentage;
  }

  /** Get rollout progress. */
  getProgress(): RolloutProgress {
    const stage = this.getCurrentStage();
    return {
      version: this.config.version,
      currentStage: stage.name,
      stageIndex: this.stageIndex,
      totalStages: this.config.stages.length,
      percentage: stage.percentage,
    };
  }
}
