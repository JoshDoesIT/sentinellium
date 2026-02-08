/**
 * @module Contributor Guide
 * @description Contributor guide and onboarding management.
 * Manages onboarding steps and contribution guidelines.
 */

/* ── Types ── */

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  order: number;
}

export interface Guideline {
  id: string;
  title: string;
  content: string;
  category: string;
}

export interface ContributorGuideOutput {
  steps: OnboardingStep[];
  guidelines: Guideline[];
}

/* ── Guide ── */

/**
 * Contributor guide manager.
 */
export class ContributorGuide {
  private readonly steps: OnboardingStep[] = [];
  private readonly guidelines: Guideline[] = [];

  /** Add an onboarding step. */
  addStep(step: OnboardingStep): void {
    this.steps.push(step);
  }

  /** Get all steps (unordered). */
  getSteps(): OnboardingStep[] {
    return [...this.steps];
  }

  /** Add a guideline. */
  addGuideline(guideline: Guideline): void {
    this.guidelines.push(guideline);
  }

  /** Get all guidelines. */
  getGuidelines(): Guideline[] {
    return [...this.guidelines];
  }

  /** Get ordered onboarding checklist. */
  getOnboardingChecklist(): OnboardingStep[] {
    return [...this.steps].sort((a, b) => a.order - b.order);
  }

  /** Generate the complete guide. */
  generate(): ContributorGuideOutput {
    return {
      steps: this.getOnboardingChecklist(),
      guidelines: [...this.guidelines],
    };
  }
}
