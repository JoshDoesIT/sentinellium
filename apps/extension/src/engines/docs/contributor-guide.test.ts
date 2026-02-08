/**
 * @module Contributor Guide Tests
 * @description TDD tests for contributor guide and onboarding.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { ContributorGuide } from "./contributor-guide";

describe("ContributorGuide", () => {
  let guide: ContributorGuide;

  beforeEach(() => {
    guide = new ContributorGuide();
  });

  describe("addStep", () => {
    it("adds an onboarding step", () => {
      guide.addStep({
        id: "fork-repo",
        title: "Fork the repository",
        description: "Fork sentinellium on GitHub",
        order: 1,
      });

      expect(guide.getSteps()).toHaveLength(1);
    });
  });

  describe("addGuideline", () => {
    it("adds a contribution guideline", () => {
      guide.addGuideline({
        id: "commit-msgs",
        title: "Commit Messages",
        content: "Use conventional commits format.",
        category: "git",
      });

      expect(guide.getGuidelines()).toHaveLength(1);
    });
  });

  describe("getOnboardingChecklist", () => {
    it("returns ordered onboarding steps", () => {
      guide.addStep({
        id: "s2",
        title: "Install deps",
        description: "Run pnpm install",
        order: 2,
      });
      guide.addStep({
        id: "s1",
        title: "Clone repo",
        description: "Clone the repo",
        order: 1,
      });

      const checklist = guide.getOnboardingChecklist();
      expect(checklist[0]!.title).toBe("Clone repo");
      expect(checklist[1]!.title).toBe("Install deps");
    });
  });

  describe("generate", () => {
    it("generates the complete contributor guide", () => {
      guide.addStep({ id: "s1", title: "Step 1", description: "d", order: 1 });
      guide.addGuideline({
        id: "g1",
        title: "Guide 1",
        content: "c",
        category: "general",
      });

      const output = guide.generate();
      expect(output.steps).toHaveLength(1);
      expect(output.guidelines).toHaveLength(1);
    });
  });
});
