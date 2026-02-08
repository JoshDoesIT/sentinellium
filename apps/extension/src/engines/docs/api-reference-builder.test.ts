/**
 * @module API Reference Builder Tests
 * @description TDD tests for API reference documentation generation.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { ApiReferenceBuilder, HttpMethod } from "./api-reference-builder";

describe("ApiReferenceBuilder", () => {
  let builder: ApiReferenceBuilder;

  beforeEach(() => {
    builder = new ApiReferenceBuilder({ title: "Sentinellium API v1" });
  });

  describe("addEndpoint", () => {
    it("registers an API endpoint", () => {
      builder.addEndpoint({
        method: HttpMethod.GET,
        path: "/api/v1/alerts",
        summary: "List alerts",
        tags: ["alerts"],
      });

      expect(builder.getEndpoints()).toHaveLength(1);
    });
  });

  describe("addSchema", () => {
    it("registers a data schema", () => {
      builder.addSchema({
        name: "Alert",
        properties: [
          { name: "id", type: "string", required: true },
          { name: "severity", type: "string", required: true },
        ],
      });

      expect(builder.getSchemas()).toHaveLength(1);
    });
  });

  describe("generateDocs", () => {
    it("produces API documentation", () => {
      builder.addEndpoint({
        method: HttpMethod.POST,
        path: "/api/v1/alerts",
        summary: "Create alert",
        tags: ["alerts"],
      });

      const docs = builder.generateDocs();
      expect(docs.title).toBe("Sentinellium API v1");
      expect(docs.endpoints).toHaveLength(1);
    });
  });

  describe("getByTag", () => {
    it("filters endpoints by tag", () => {
      builder.addEndpoint({
        method: HttpMethod.GET,
        path: "/api/v1/alerts",
        summary: "List alerts",
        tags: ["alerts"],
      });
      builder.addEndpoint({
        method: HttpMethod.GET,
        path: "/api/v1/policies",
        summary: "List policies",
        tags: ["policies"],
      });

      expect(builder.getByTag("alerts")).toHaveLength(1);
      expect(builder.getByTag("policies")).toHaveLength(1);
    });
  });
});
