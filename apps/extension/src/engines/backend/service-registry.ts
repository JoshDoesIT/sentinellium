/**
 * @module Service Registry
 * @description Service discovery and registration with heartbeat-based liveness.
 * Tracks service endpoints, versions, and health status.
 */

/* ── Types ── */

export const ServiceStatus = {
  HEALTHY: "HEALTHY",
  UNHEALTHY: "UNHEALTHY",
} as const;

export type ServiceStatus = (typeof ServiceStatus)[keyof typeof ServiceStatus];

export interface RegisterInput {
  name: string;
  endpoint: string;
  version: string;
}

export interface ServiceRecord {
  name: string;
  endpoint: string;
  version: string;
  status: ServiceStatus;
  registeredAt: number;
  lastHeartbeat: number;
}

export interface ServiceRegistryConfig {
  heartbeatTimeoutMs: number;
}

/* ── Registry ── */

/**
 * Service registry with heartbeat-based health monitoring.
 */
export class ServiceRegistry {
  private readonly services = new Map<string, ServiceRecord>();
  private readonly config: ServiceRegistryConfig;

  constructor(config: ServiceRegistryConfig) {
    this.config = config;
  }

  /**
   * Register or update a service.
   *
   * @param input - Service registration data
   */
  register(input: RegisterInput): void {
    const now = Date.now();
    this.services.set(input.name, {
      name: input.name,
      endpoint: input.endpoint,
      version: input.version,
      status: ServiceStatus.HEALTHY,
      registeredAt: now,
      lastHeartbeat: now,
    });
  }

  /**
   * Record a heartbeat from a service.
   *
   * @param name - Service name
   */
  heartbeat(name: string): void {
    const service = this.services.get(name);
    if (service) {
      service.lastHeartbeat = Date.now();
      service.status = ServiceStatus.HEALTHY;
    }
  }

  /**
   * Check health of all services based on heartbeat timeout.
   */
  checkHealth(): void {
    const now = Date.now();
    for (const service of this.services.values()) {
      if (now - service.lastHeartbeat > this.config.heartbeatTimeoutMs) {
        service.status = ServiceStatus.UNHEALTHY;
      }
    }
  }

  /**
   * Get a service by name.
   *
   * @param name - Service name
   */
  get(name: string): ServiceRecord | undefined {
    const service = this.services.get(name);
    return service ? { ...service } : undefined;
  }

  /**
   * Remove a service from the registry.
   *
   * @param name - Service name
   */
  deregister(name: string): void {
    this.services.delete(name);
  }

  /** List all registered services. */
  listAll(): ServiceRecord[] {
    return [...this.services.values()].map((s) => ({ ...s }));
  }

  /** List only healthy services. */
  getHealthy(): ServiceRecord[] {
    return [...this.services.values()]
      .filter((s) => s.status === ServiceStatus.HEALTHY)
      .map((s) => ({ ...s }));
  }
}
