/**
 * @module Fleet Manager
 * @description Tracks connected extension instances across the fleet.
 * Handles registration, heartbeats, staleness detection, and stats.
 */

/* ── Types ── */

/** Instance operational status. */
export enum InstanceStatus {
  ONLINE = "ONLINE",
  STALE = "STALE",
  OFFLINE = "OFFLINE",
}

/** A managed extension instance. */
export interface ManagedInstance {
  instanceId: string;
  hostname: string;
  browser: string;
  version: string;
  status: InstanceStatus;
  lastSeen: string;
  registeredAt: string;
}

/** Registration input. */
export interface InstanceInput {
  instanceId: string;
  hostname: string;
  browser: string;
  version: string;
}

/* ── Fleet Manager ── */

/**
 * Manages the fleet of connected extension instances.
 */
export class FleetManager {
  private readonly instances = new Map<string, ManagedInstance>();

  /**
   * Register or update an instance.
   *
   * @param input - Instance registration data
   */
  register(input: InstanceInput): void {
    const now = new Date().toISOString();
    const existing = this.instances.get(input.instanceId);

    this.instances.set(input.instanceId, {
      ...input,
      status: InstanceStatus.ONLINE,
      lastSeen: now,
      registeredAt: existing?.registeredAt ?? now,
    });
  }

  /**
   * Record a heartbeat from an instance.
   *
   * @param instanceId - Instance ID
   */
  heartbeat(instanceId: string): void {
    const instance = this.instances.get(instanceId);
    if (!instance) return;

    instance.lastSeen = new Date().toISOString();
    instance.status = InstanceStatus.ONLINE;
  }

  /**
   * Mark an instance as stale (missed heartbeats).
   *
   * @param instanceId - Instance ID
   */
  markStale(instanceId: string): void {
    const instance = this.instances.get(instanceId);
    if (!instance) return;

    instance.status = InstanceStatus.STALE;
  }

  /**
   * Remove an instance from the fleet.
   *
   * @param instanceId - Instance ID
   */
  remove(instanceId: string): void {
    this.instances.delete(instanceId);
  }

  /** Get a specific instance. */
  getInstance(instanceId: string): ManagedInstance | undefined {
    return this.instances.get(instanceId);
  }

  /** Get all instances. */
  getAll(): ManagedInstance[] {
    return [...this.instances.values()];
  }

  /** Count online instances. */
  getOnlineCount(): number {
    return [...this.instances.values()].filter(
      (i) => i.status === InstanceStatus.ONLINE,
    ).length;
  }

  /** Count total instances. */
  getTotalCount(): number {
    return this.instances.size;
  }
}
