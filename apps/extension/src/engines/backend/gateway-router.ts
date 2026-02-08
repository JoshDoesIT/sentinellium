/**
 * @module Gateway Router
 * @description API gateway with route registration, middleware chain,
 * and request routing to downstream service handlers.
 * Supports path-based and method-based routing.
 */

/* ── Types ── */

/** HTTP methods supported by the gateway. */
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** Incoming gateway request. */
export interface GatewayRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: string;
}

/** Gateway response returned by handlers. */
export interface GatewayResponse {
  status: number;
  body: string;
}

/** Route handler function. */
export type RouteHandler = (
  req: GatewayRequest,
) => GatewayResponse | Promise<GatewayResponse>;

/** Middleware function that can intercept or transform requests. */
export type Middleware = (
  req: GatewayRequest,
  next: (req: GatewayRequest) => GatewayResponse | Promise<GatewayResponse>,
) => GatewayResponse | Promise<GatewayResponse>;

/** Route metadata for listing. */
export interface RouteInfo {
  method: string;
  path: string;
}

/* ── Router ── */

/**
 * API gateway router with middleware support.
 * Routes requests to registered handlers with middleware chain execution.
 */
export class GatewayRouter {
  private readonly routes = new Map<string, RouteHandler>();
  private readonly registeredPaths = new Set<string>();
  private readonly middlewares: Middleware[] = [];

  /**
   * Register a route handler.
   *
   * @param method - HTTP method
   * @param path - URL path
   * @param handler - Handler function
   * @throws Error if route already registered
   */
  register(method: string, path: string, handler: RouteHandler): void {
    const key = `${method}:${path}`;
    if (this.routes.has(key)) {
      throw new Error(`Route ${method} ${path} already registered`);
    }
    this.routes.set(key, handler);
    this.registeredPaths.add(path);
  }

  /**
   * Add middleware to the chain.
   * Middleware runs in registration order before the route handler.
   *
   * @param middleware - Middleware function
   */
  use(middleware: Middleware): void {
    this.middlewares.push(middleware);
  }

  /**
   * Route a request through middleware and to the matching handler.
   *
   * @param req - Incoming request
   * @returns Response from handler or error response
   */
  async handle(req: GatewayRequest): Promise<GatewayResponse> {
    const key = `${req.method}:${req.path}`;
    const handler = this.routes.get(key);

    if (!handler) {
      if (this.registeredPaths.has(req.path)) {
        return { status: 405, body: "Method Not Allowed" };
      }
      return { status: 404, body: "Not Found" };
    }

    // Build middleware chain
    const chain = this.middlewares.reduceRight<
      (req: GatewayRequest) => GatewayResponse | Promise<GatewayResponse>
    >((next, mw) => (r) => mw(r, next), handler);

    return chain(req);
  }

  /** List all registered routes. */
  listRoutes(): RouteInfo[] {
    return [...this.routes.keys()].map((key) => {
      const [method, ...pathParts] = key.split(":");
      return { method: method!, path: pathParts.join(":") };
    });
  }
}
