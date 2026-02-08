/**
 * @module Auto Updater
 * @description Model auto-update mechanism with channels,
 * version detection, and update history.
 */

/* ── Types ── */

export enum UpdateChannel {
  STABLE = "stable",
  BETA = "beta",
  CANARY = "canary",
}

export interface UpdateConfig {
  currentVersion: string;
  channel: UpdateChannel;
  checkIntervalMs: number;
}

export interface UpdateCheck {
  available: boolean;
  version?: string;
  checkedAt: number;
}

export interface UpdateRecord {
  from: string;
  to: string;
  appliedAt: number;
  channel: UpdateChannel;
}

/* ── Updater ── */

/**
 * Auto-updater with channels and history.
 */
export class AutoUpdater {
  private currentVersion: string;
  private channel: UpdateChannel;
  private availableVersion: string;
  private readonly history: UpdateRecord[] = [];

  constructor(config: UpdateConfig) {
    this.currentVersion = config.currentVersion;
    this.channel = config.channel;
    this.availableVersion = config.currentVersion;
  }

  /**
   * Set the available upstream version (simulates server response).
   *
   * @param version - Available version string
   */
  setAvailableVersion(version: string): void {
    this.availableVersion = version;
  }

  /** Check if an update is available. */
  checkForUpdate(): UpdateCheck {
    const available = this.availableVersion !== this.currentVersion;
    return {
      available,
      version: available ? this.availableVersion : undefined,
      checkedAt: Date.now(),
    };
  }

  /**
   * Apply an update.
   *
   * @param version - Version to update to
   */
  applyUpdate(version: string): void {
    this.history.push({
      from: this.currentVersion,
      to: version,
      appliedAt: Date.now(),
      channel: this.channel,
    });
    this.currentVersion = version;
  }

  /** Get current version. */
  getCurrentVersion(): string {
    return this.currentVersion;
  }

  /** Get update channel. */
  getChannel(): UpdateChannel {
    return this.channel;
  }

  /**
   * Switch update channel.
   *
   * @param channel - New channel
   */
  setChannel(channel: UpdateChannel): void {
    this.channel = channel;
  }

  /** Get update history. */
  getUpdateHistory(): UpdateRecord[] {
    return [...this.history];
  }
}
