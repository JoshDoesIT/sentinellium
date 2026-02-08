/**
 * @module OpenAPI Spec Builder
 * @description Programmatic OpenAPI 3.1 specification builder.
 * Generates API documentation from route definitions with schemas.
 */

/* ── Types ── */

export interface OpenApiInfo {
  title: string;
  version: string;
  description?: string;
}

export interface OpenApiOperation {
  summary: string;
  operationId: string;
  responses: Record<string, { description: string }>;
  requestBody?: unknown;
  parameters?: unknown[];
}

export interface OpenApiPath {
  get?: OpenApiOperation;
  post?: OpenApiOperation;
  put?: OpenApiOperation;
  patch?: OpenApiOperation;
  delete?: OpenApiOperation;
}

export interface OpenApiServer {
  url: string;
  description?: string;
}

export interface OpenApiSpec {
  openapi: string;
  info: OpenApiInfo;
  paths: Record<string, OpenApiPath>;
  servers?: OpenApiServer[];
  components?: {
    schemas?: Record<string, unknown>;
  };
}

/* ── Builder ── */

/**
 * Builds OpenAPI 3.1 specs programmatically.
 */
export class OpenApiBuilder {
  private readonly info: OpenApiInfo;
  private readonly paths: Record<string, OpenApiPath> = {};
  private readonly schemas: Record<string, unknown> = {};
  private readonly servers: OpenApiServer[] = [];

  constructor(info: OpenApiInfo) {
    this.info = { ...info };
  }

  /**
   * Add a path operation.
   *
   * @param path - URL path
   * @param method - HTTP method
   * @param operation - Operation definition
   */
  addPath(
    path: string,
    method: "get" | "post" | "put" | "patch" | "delete",
    operation: OpenApiOperation,
  ): void {
    if (!this.paths[path]) {
      this.paths[path] = {};
    }
    this.paths[path]![method] = operation;
  }

  /**
   * Add a component schema.
   *
   * @param name - Schema name
   * @param schema - Schema definition
   */
  addSchema(name: string, schema: unknown): void {
    this.schemas[name] = schema;
  }

  /**
   * Add a server entry.
   *
   * @param url - Server URL
   * @param description - Optional description
   */
  addServer(url: string, description?: string): void {
    this.servers.push({ url, description });
  }

  /** Build the complete OpenAPI spec. */
  build(): OpenApiSpec {
    const spec: OpenApiSpec = {
      openapi: "3.1.0",
      info: { ...this.info },
      paths: { ...this.paths },
    };

    if (this.servers.length > 0) {
      spec.servers = [...this.servers];
    }

    if (Object.keys(this.schemas).length > 0) {
      spec.components = { schemas: { ...this.schemas } };
    }

    return spec;
  }
}
