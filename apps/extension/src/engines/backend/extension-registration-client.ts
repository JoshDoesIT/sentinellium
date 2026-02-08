/**
 * @module Extension Registration Client
 * @description Extension instance registration and heartbeat API client.
 * Manages instance ID, capabilities reporting, and keep-alive.
 */

/* ── Types ── */

export interface RegistrationInput {
  extensionVersion: string;
  browserInfo: string;
  capabilities: string[];
  tenantId: string;
}

export interface RegistrationResult {
  instanceId: string;
  registeredAt: number;
}

export interface InstanceInfo {
  instanceId: string;
  extensionVersion: string;
  browserInfo: string;
  capabilities: string[];
  tenantId: string;
  registeredAt: number;
  lastHeartbeat: number;
}

export interface ExtensionRegistrationConfig {
  heartbeatIntervalMs: number;
}

/* ── Helpers ── */

function generateInstanceId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "ext-";
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/* ── Client ── */

/**
 * Extension registration client with heartbeat keep-alive.
 */
export class ExtensionRegistrationClient {
  private instance: InstanceInfo | undefined;
  readonly heartbeatIntervalMs: number;

  constructor(config: ExtensionRegistrationConfig) {
    this.heartbeatIntervalMs = config.heartbeatIntervalMs;
  }

  /**
   * Register this extension instance.
   *
   * @param input - Registration data
   * @returns Registration result with instance ID
   */
  register(input: RegistrationInput): RegistrationResult {
    const now = Date.now();
    const instanceId = generateInstanceId();

    this.instance = {
      instanceId,
      extensionVersion: input.extensionVersion,
      browserInfo: input.browserInfo,
      capabilities: [...input.capabilities],
      tenantId: input.tenantId,
      registeredAt: now,
      lastHeartbeat: now,
    };

    return { instanceId, registeredAt: now };
  }

  /**
   * Send a heartbeat to keep the registration alive.
   *
   * @throws Error if not registered
   */
  heartbeat(): void {
    if (!this.instance) {
      throw new Error("Not registered. Call register() first.");
    }
    this.instance.lastHeartbeat = Date.now();
  }

  /** Deregister this extension instance. */
  deregister(): void {
    this.instance = undefined;
  }

  /** Get current instance info, or undefined if not registered. */
  getInstanceInfo(): InstanceInfo | undefined {
    return this.instance ? { ...this.instance } : undefined;
  }

  /** Whether this instance is registered. */
  isRegistered(): boolean {
    return this.instance !== undefined;
  }
}
