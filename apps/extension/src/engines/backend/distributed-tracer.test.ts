/**
 * @module Distributed Tracer Tests
 * @description TDD tests for request-scoped tracing with spans,
 * context propagation, and OpenTelemetry-compatible timing.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { DistributedTracer } from "./distributed-tracer";

describe("DistributedTracer", () => {
  let tracer: DistributedTracer;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
    tracer = new DistributedTracer("gateway-service");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("startSpan", () => {
    it("creates a span with name and trace ID", () => {
      const span = tracer.startSpan("GET /api/alerts");
      expect(span.name).toBe("GET /api/alerts");
      expect(span.traceId).toBeTruthy();
      expect(span.spanId).toBeTruthy();
      expect(span.startTime).toBe(Date.now());
    });

    it("generates unique span IDs", () => {
      const span1 = tracer.startSpan("op-a");
      const span2 = tracer.startSpan("op-b");
      expect(span1.spanId).not.toBe(span2.spanId);
    });
  });

  describe("endSpan", () => {
    it("records end time and duration", () => {
      const span = tracer.startSpan("db-query");
      vi.advanceTimersByTime(150);
      tracer.endSpan(span.spanId);

      const completed = tracer.getSpan(span.spanId);
      expect(completed!.endTime).toBe(Date.now());
      expect(completed!.durationMs).toBe(150);
    });
  });

  describe("child spans", () => {
    it("creates child span with parent reference", () => {
      const parent = tracer.startSpan("handle-request");
      const child = tracer.startSpan("db-query", parent.spanId);

      expect(child.parentSpanId).toBe(parent.spanId);
      expect(child.traceId).toBe(parent.traceId);
    });
  });

  describe("getTrace", () => {
    it("returns all spans for a trace ID", () => {
      const root = tracer.startSpan("root");
      tracer.startSpan("child-1", root.spanId);
      tracer.startSpan("child-2", root.spanId);

      const trace = tracer.getTrace(root.traceId);
      expect(trace).toHaveLength(3);
    });
  });

  describe("listTraces", () => {
    it("returns unique trace IDs", () => {
      tracer.startSpan("trace-a");
      tracer.startSpan("trace-b");

      const traces = tracer.listTraces();
      expect(traces.length).toBeGreaterThanOrEqual(2);
    });
  });
});
