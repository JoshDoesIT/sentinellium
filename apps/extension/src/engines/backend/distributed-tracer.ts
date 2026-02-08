/**
 * @module Distributed Tracer
 * @description Request-scoped tracing with span creation, context propagation,
 * and timing. Compatible with OpenTelemetry trace format.
 */

/* ── Types ── */

export interface Span {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  serviceName: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
}

/* ── Helpers ── */

function generateId(): string {
  const chars = "0123456789abcdef";
  let result = "";
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/* ── Tracer ── */

/**
 * Distributed tracer with span hierarchy and timing.
 */
export class DistributedTracer {
  private readonly serviceName: string;
  private readonly spans = new Map<string, Span>();

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  /**
   * Start a new span. If parentSpanId is provided, the span inherits the parent's traceId.
   *
   * @param name - Span name (e.g., "GET /api/alerts")
   * @param parentSpanId - Optional parent span for child spans
   * @returns Created span
   */
  startSpan(name: string, parentSpanId?: string): Span {
    const parent = parentSpanId ? this.spans.get(parentSpanId) : undefined;
    const span: Span = {
      traceId: parent?.traceId ?? generateId(),
      spanId: generateId(),
      parentSpanId,
      name,
      serviceName: this.serviceName,
      startTime: Date.now(),
    };
    this.spans.set(span.spanId, span);
    return { ...span };
  }

  /**
   * End a span, recording end time and duration.
   *
   * @param spanId - Span to end
   */
  endSpan(spanId: string): void {
    const span = this.spans.get(spanId);
    if (span) {
      span.endTime = Date.now();
      span.durationMs = span.endTime - span.startTime;
    }
  }

  /**
   * Get a span by ID.
   *
   * @param spanId - Span ID
   */
  getSpan(spanId: string): Span | undefined {
    const span = this.spans.get(spanId);
    return span ? { ...span } : undefined;
  }

  /**
   * Get all spans belonging to a trace.
   *
   * @param traceId - Trace ID
   */
  getTrace(traceId: string): Span[] {
    return [...this.spans.values()]
      .filter((s) => s.traceId === traceId)
      .map((s) => ({ ...s }));
  }

  /** List all unique trace IDs. */
  listTraces(): string[] {
    const traceIds = new Set<string>();
    for (const span of this.spans.values()) {
      traceIds.add(span.traceId);
    }
    return [...traceIds];
  }
}
