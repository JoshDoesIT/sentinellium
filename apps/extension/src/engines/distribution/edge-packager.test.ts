/**
 * @module Edge Packager Tests
 * @description TDD tests for Edge Add-ons packaging pipeline.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { EdgePackager } from "./edge-packager";

describe("EdgePackager", () => {
  let packager: EdgePackager;

  beforeEach(() => {
    packager = new EdgePackager({
      extensionId: "sentinellium-edge",
      version: "1.2.0",
      name: "Sentinellium",
      description: "Enterprise browser security",
    });
  });

  describe("generateManifest", () => {
    it("generates Edge-compatible MV3 manifest", () => {
      const manifest = packager.generateManifest();
      expect(manifest.manifest_version).toBe(3);
      expect(manifest.name).toBe("Sentinellium");
    });

    it("includes Edge-specific update URL", () => {
      packager.setUpdateUrl(
        "https://edge.microsoft.com/extensionwebstorebase/v1/crx",
      );
      const manifest = packager.generateManifest();
      expect(manifest.update_url).toBeTruthy();
    });
  });

  describe("validate", () => {
    it("passes for valid Edge config", () => {
      expect(packager.validate().valid).toBe(true);
    });
  });

  describe("buildArtifact", () => {
    it("produces Edge-specific artifact", () => {
      const artifact = packager.buildArtifact();
      expect(artifact.platform).toBe("edge");
      expect(artifact.version).toBe("1.2.0");
    });
  });
});
