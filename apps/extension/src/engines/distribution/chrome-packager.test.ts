/**
 * @module Chrome Packager Tests
 * @description TDD tests for Chrome Web Store packaging pipeline.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { ChromePackager } from "./chrome-packager";

describe("ChromePackager", () => {
  let packager: ChromePackager;

  beforeEach(() => {
    packager = new ChromePackager({
      extensionId: "sentinellium",
      version: "1.2.0",
      name: "Sentinellium",
      description: "Enterprise browser security",
    });
  });

  describe("generateManifest", () => {
    it("generates a valid Chrome MV3 manifest", () => {
      const manifest = packager.generateManifest();
      expect(manifest.manifest_version).toBe(3);
      expect(manifest.name).toBe("Sentinellium");
      expect(manifest.version).toBe("1.2.0");
    });

    it("includes required permissions", () => {
      packager.addPermission("storage");
      packager.addPermission("activeTab");
      const manifest = packager.generateManifest();
      expect(manifest.permissions).toContain("storage");
      expect(manifest.permissions).toContain("activeTab");
    });
  });

  describe("validate", () => {
    it("passes for valid configuration", () => {
      const result = packager.validate();
      expect(result.valid).toBe(true);
    });

    it("fails for missing name", () => {
      const bad = new ChromePackager({
        extensionId: "test",
        version: "1.0.0",
        name: "",
        description: "test",
      });
      const result = bad.validate();
      expect(result.valid).toBe(false);
    });
  });

  describe("buildArtifact", () => {
    it("produces a build artifact with metadata", () => {
      const artifact = packager.buildArtifact();
      expect(artifact.platform).toBe("chrome");
      expect(artifact.version).toBe("1.2.0");
      expect(artifact.files).toBeDefined();
    });
  });
});
