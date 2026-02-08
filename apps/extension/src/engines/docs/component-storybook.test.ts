/**
 * @module Component Storybook Tests
 * @description TDD tests for interactive component storybook.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { ComponentStorybook } from "./component-storybook";

describe("ComponentStorybook", () => {
  let storybook: ComponentStorybook;

  beforeEach(() => {
    storybook = new ComponentStorybook();
  });

  describe("registerComponent", () => {
    it("registers a component with variants", () => {
      storybook.registerComponent({
        id: "button",
        name: "Button",
        description: "Primary action button",
        variants: [
          { name: "default", props: { label: "Click me" } },
          { name: "disabled", props: { label: "Disabled", disabled: true } },
        ],
      });

      expect(storybook.getComponents()).toHaveLength(1);
    });
  });

  describe("getComponent", () => {
    it("retrieves a component by ID", () => {
      storybook.registerComponent({
        id: "alert-badge",
        name: "Alert Badge",
        description: "Displays alert severity",
        variants: [{ name: "critical", props: { severity: "critical" } }],
      });

      const component = storybook.getComponent("alert-badge");
      expect(component!.name).toBe("Alert Badge");
    });
  });

  describe("getVariants", () => {
    it("returns all variants for a component", () => {
      storybook.registerComponent({
        id: "card",
        name: "Card",
        description: "Content card",
        variants: [
          { name: "default", props: {} },
          { name: "elevated", props: { elevation: 3 } },
        ],
      });

      const variants = storybook.getVariants("card");
      expect(variants).toHaveLength(2);
    });
  });

  describe("search", () => {
    it("searches components by name", () => {
      storybook.registerComponent({
        id: "nav-bar",
        name: "Navigation Bar",
        description: "Top navigation",
        variants: [],
      });

      expect(storybook.search("navigation")).toHaveLength(1);
    });
  });

  describe("getCatalog", () => {
    it("generates a component catalog", () => {
      storybook.registerComponent({
        id: "c1",
        name: "Component 1",
        description: "Desc",
        variants: [],
      });

      const catalog = storybook.getCatalog();
      expect(catalog.totalComponents).toBe(1);
    });
  });
});
