/**
 * @module OpenAPI Spec Builder Tests
 * @description TDD tests for programmatic OpenAPI 3.1 spec generation.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { OpenApiBuilder } from "./openapi-builder";

describe("OpenApiBuilder", () => {
  let builder: OpenApiBuilder;

  beforeEach(() => {
    builder = new OpenApiBuilder({
      title: "Sentinellium API",
      version: "1.0.0",
      description: "Enterprise security platform API",
    });
  });

  describe("info", () => {
    it("sets API metadata", () => {
      const spec = builder.build();
      expect(spec.openapi).toBe("3.1.0");
      expect(spec.info.title).toBe("Sentinellium API");
      expect(spec.info.version).toBe("1.0.0");
    });
  });

  describe("addPath", () => {
    it("adds a path with operation", () => {
      builder.addPath("/api/alerts", "get", {
        summary: "List alerts",
        operationId: "listAlerts",
        responses: {
          "200": { description: "Alert list" },
        },
      });

      const spec = builder.build();
      expect(spec.paths["/api/alerts"]).toBeDefined();
      expect(spec.paths["/api/alerts"]!.get!.summary).toBe("List alerts");
    });

    it("supports multiple operations on same path", () => {
      builder.addPath("/api/alerts", "get", {
        summary: "List",
        operationId: "listAlerts",
        responses: { "200": { description: "ok" } },
      });
      builder.addPath("/api/alerts", "post", {
        summary: "Create",
        operationId: "createAlert",
        responses: { "201": { description: "created" } },
      });

      const spec = builder.build();
      expect(spec.paths["/api/alerts"]!.get).toBeDefined();
      expect(spec.paths["/api/alerts"]!.post).toBeDefined();
    });
  });

  describe("addSchema", () => {
    it("adds a component schema", () => {
      builder.addSchema("Alert", {
        type: "object",
        properties: {
          id: { type: "string" },
          severity: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
        },
      });

      const spec = builder.build();
      expect(spec.components!.schemas!.Alert).toBeDefined();
      expect(
        (spec.components!.schemas!.Alert as Record<string, unknown>).type,
      ).toBe("object");
    });
  });

  describe("addServer", () => {
    it("adds a server entry", () => {
      builder.addServer("http://localhost:3000", "Development");

      const spec = builder.build();
      expect(spec.servers).toHaveLength(1);
      expect(spec.servers![0]!.url).toBe("http://localhost:3000");
    });
  });

  describe("build", () => {
    it("returns a complete spec object", () => {
      const spec = builder.build();
      expect(spec).toHaveProperty("openapi");
      expect(spec).toHaveProperty("info");
      expect(spec).toHaveProperty("paths");
    });
  });
});
