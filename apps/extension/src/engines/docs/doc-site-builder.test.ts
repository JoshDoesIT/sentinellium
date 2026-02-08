/**
 * @module Doc Site Builder Tests
 * @description TDD tests for documentation site builder (Starlight-style).
 */
import { describe, it, expect, beforeEach } from "vitest";
import { DocSiteBuilder } from "./doc-site-builder";

describe("DocSiteBuilder", () => {
  let builder: DocSiteBuilder;

  beforeEach(() => {
    builder = new DocSiteBuilder({
      title: "Sentinellium Docs",
      baseUrl: "https://docs.sentinellium.com",
    });
  });

  describe("addPage", () => {
    it("adds a documentation page", () => {
      builder.addPage({
        slug: "getting-started",
        title: "Getting Started",
        content: "# Getting Started\nWelcome to Sentinellium.",
        category: "guides",
      });

      expect(builder.getPages()).toHaveLength(1);
    });
  });

  describe("addCategory", () => {
    it("registers a category with order", () => {
      builder.addCategory({ id: "guides", label: "Guides", order: 1 });
      builder.addCategory({ id: "api", label: "API Reference", order: 2 });

      expect(builder.getCategories()).toHaveLength(2);
    });
  });

  describe("getNavigation", () => {
    it("builds navigation tree from pages and categories", () => {
      builder.addCategory({ id: "guides", label: "Guides", order: 1 });
      builder.addPage({
        slug: "install",
        title: "Installation",
        content: "# Install",
        category: "guides",
      });

      const nav = builder.getNavigation();
      expect(nav).toHaveLength(1);
      expect(nav[0]!.pages).toHaveLength(1);
    });
  });

  describe("search", () => {
    it("searches pages by content", () => {
      builder.addPage({
        slug: "config",
        title: "Configuration",
        content: "Configure your policies and alerts.",
        category: "guides",
      });

      const results = builder.search("policies");
      expect(results).toHaveLength(1);
      expect(results[0]!.slug).toBe("config");
    });
  });

  describe("build", () => {
    it("produces a site manifest", () => {
      builder.addPage({
        slug: "home",
        title: "Home",
        content: "# Home",
        category: "root",
      });

      const manifest = builder.build();
      expect(manifest.title).toBe("Sentinellium Docs");
      expect(manifest.pages).toHaveLength(1);
    });
  });
});
