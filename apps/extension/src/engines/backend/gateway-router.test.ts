/**
 * @module Gateway Router Tests
 * @description TDD tests for API gateway routing.
 * Supports route registration, auth middleware injection,
 * path-based and method-based routing to downstream services.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  GatewayRouter,
  type RouteHandler,
  type Middleware,
} from "./gateway-router";

describe("GatewayRouter", () => {
  let router: GatewayRouter;

  beforeEach(() => {
    router = new GatewayRouter();
  });

  /* ── Route Registration ── */

  describe("register", () => {
    it("registers a GET route", () => {
      const handler: RouteHandler = () => ({ status: 200, body: "ok" });
      router.register("GET", "/api/health", handler);

      const routes = router.listRoutes();
      expect(routes).toHaveLength(1);
      expect(routes[0]!.method).toBe("GET");
      expect(routes[0]!.path).toBe("/api/health");
    });

    it("registers multiple routes", () => {
      router.register("GET", "/api/alerts", () => ({ status: 200, body: "" }));
      router.register("POST", "/api/alerts", () => ({ status: 201, body: "" }));
      router.register("GET", "/api/policies", () => ({
        status: 200,
        body: "",
      }));

      expect(router.listRoutes()).toHaveLength(3);
    });

    it("throws on duplicate method+path", () => {
      router.register("GET", "/api/health", () => ({ status: 200, body: "" }));
      expect(() =>
        router.register("GET", "/api/health", () => ({
          status: 200,
          body: "",
        })),
      ).toThrow();
    });
  });

  /* ── Request Routing ── */

  describe("handle", () => {
    it("routes request to matching handler", async () => {
      router.register("GET", "/api/health", () => ({
        status: 200,
        body: "healthy",
      }));

      const response = await router.handle({
        method: "GET",
        path: "/api/health",
        headers: {},
      });
      expect(response.status).toBe(200);
      expect(response.body).toBe("healthy");
    });

    it("returns 404 for unregistered path", async () => {
      const response = await router.handle({
        method: "GET",
        path: "/api/unknown",
        headers: {},
      });
      expect(response.status).toBe(404);
    });

    it("returns 405 for wrong method on existing path", async () => {
      router.register("GET", "/api/alerts", () => ({
        status: 200,
        body: "[]",
      }));

      const response = await router.handle({
        method: "DELETE",
        path: "/api/alerts",
        headers: {},
      });
      expect(response.status).toBe(405);
    });

    it("passes request context to handler", async () => {
      router.register("POST", "/api/alerts", (req) => ({
        status: 201,
        body: `received: ${req.body}`,
      }));

      const response = await router.handle({
        method: "POST",
        path: "/api/alerts",
        headers: { "content-type": "application/json" },
        body: '{"alert":"test"}',
      });
      expect(response.body).toBe('received: {"alert":"test"}');
    });
  });

  /* ── Middleware ── */

  describe("middleware", () => {
    it("runs middleware before handler", async () => {
      const order: string[] = [];

      const mw: Middleware = (req, next) => {
        order.push("middleware");
        return next(req);
      };
      router.use(mw);
      router.register("GET", "/api/test", () => {
        order.push("handler");
        return { status: 200, body: "" };
      });

      await router.handle({ method: "GET", path: "/api/test", headers: {} });
      expect(order).toEqual(["middleware", "handler"]);
    });

    it("middleware can reject requests", async () => {
      const mw: Middleware = () => {
        return { status: 401, body: "Unauthorized" };
      };
      router.use(mw);
      router.register("GET", "/api/secure", () => ({
        status: 200,
        body: "secret",
      }));

      const response = await router.handle({
        method: "GET",
        path: "/api/secure",
        headers: {},
      });
      expect(response.status).toBe(401);
    });

    it("chains multiple middleware in order", async () => {
      const order: string[] = [];

      const mw1: Middleware = (req, next) => {
        order.push("first");
        return next(req);
      };
      const mw2: Middleware = (req, next) => {
        order.push("second");
        return next(req);
      };
      router.use(mw1);
      router.use(mw2);
      router.register("GET", "/api/test", () => {
        order.push("handler");
        return { status: 200, body: "" };
      });

      await router.handle({ method: "GET", path: "/api/test", headers: {} });
      expect(order).toEqual(["first", "second", "handler"]);
    });
  });
});
