/**
 * @module Guide Generator Tests
 * @description TDD tests for user/admin guide generation.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { GuideGenerator, GuideType } from "./guide-generator";

describe("GuideGenerator", () => {
  let generator: GuideGenerator;

  beforeEach(() => {
    generator = new GuideGenerator();
  });

  describe("addSection", () => {
    it("adds a section to a guide", () => {
      generator.addSection({
        guideType: GuideType.USER,
        id: "install",
        title: "Installation",
        content: "Download from the Chrome Web Store.",
        order: 1,
      });

      expect(generator.getSections(GuideType.USER)).toHaveLength(1);
    });
  });

  describe("generate", () => {
    it("generates ordered guide content", () => {
      generator.addSection({
        guideType: GuideType.USER,
        id: "intro",
        title: "Introduction",
        content: "Welcome to Sentinellium.",
        order: 1,
      });
      generator.addSection({
        guideType: GuideType.USER,
        id: "config",
        title: "Configuration",
        content: "Configure your settings.",
        order: 2,
      });

      const guide = generator.generate(GuideType.USER);
      expect(guide.sections).toHaveLength(2);
      expect(guide.sections[0]!.title).toBe("Introduction");
      expect(guide.sections[1]!.title).toBe("Configuration");
    });

    it("generates admin guide separately", () => {
      generator.addSection({
        guideType: GuideType.ADMIN,
        id: "deploy",
        title: "Enterprise Deployment",
        content: "Deploy via GPO or MDM.",
        order: 1,
      });

      const guide = generator.generate(GuideType.ADMIN);
      expect(guide.type).toBe(GuideType.ADMIN);
      expect(guide.sections).toHaveLength(1);
    });
  });

  describe("getTableOfContents", () => {
    it("returns TOC for a guide type", () => {
      generator.addSection({
        guideType: GuideType.USER,
        id: "s1",
        title: "Setup",
        content: "...",
        order: 1,
      });

      const toc = generator.getTableOfContents(GuideType.USER);
      expect(toc).toHaveLength(1);
      expect(toc[0]!.title).toBe("Setup");
    });
  });
});
