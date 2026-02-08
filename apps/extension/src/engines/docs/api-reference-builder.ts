/**
 * @module API Reference Builder
 * @description API reference documentation generation.
 * Manages endpoints, schemas, and produces structured API docs.
 */

/* ── Types ── */

export enum HttpMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  PATCH = "PATCH",
  DELETE = "DELETE",
}

export interface EndpointDef {
  method: HttpMethod;
  path: string;
  summary: string;
  tags: string[];
}

export interface SchemaProperty {
  name: string;
  type: string;
  required: boolean;
}

export interface SchemaDef {
  name: string;
  properties: SchemaProperty[];
}

export interface ApiDocs {
  title: string;
  endpoints: EndpointDef[];
  schemas: SchemaDef[];
}

/* ── Builder ── */

/**
 * API reference documentation builder.
 */
export class ApiReferenceBuilder {
  private readonly title: string;
  private readonly endpoints: EndpointDef[] = [];
  private readonly schemas: SchemaDef[] = [];

  constructor(config: { title: string }) {
    this.title = config.title;
  }

  /** Add an endpoint. */
  addEndpoint(endpoint: EndpointDef): void {
    this.endpoints.push(endpoint);
  }

  /** Get all endpoints. */
  getEndpoints(): EndpointDef[] {
    return [...this.endpoints];
  }

  /** Add a schema. */
  addSchema(schema: SchemaDef): void {
    this.schemas.push(schema);
  }

  /** Get all schemas. */
  getSchemas(): SchemaDef[] {
    return [...this.schemas];
  }

  /** Filter endpoints by tag. */
  getByTag(tag: string): EndpointDef[] {
    return this.endpoints.filter((e) => e.tags.includes(tag));
  }

  /** Generate API docs. */
  generateDocs(): ApiDocs {
    return {
      title: this.title,
      endpoints: this.getEndpoints(),
      schemas: this.getSchemas(),
    };
  }
}
