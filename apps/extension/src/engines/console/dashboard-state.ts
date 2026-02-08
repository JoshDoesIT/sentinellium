/**
 * @module Dashboard State
 * @description Manages real-time dashboard state including
 * engine health, alert counts, and connected instances.
 */
import { type AlertSource, type AlertSeverity } from "./alert-aggregator";

/* ── Types ── */

/** Engine operational status. */
export enum EngineStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  ERROR = "ERROR",
}

/** Engine name type. */
type EngineName = "phishing" | "c2pa" | "dlp";

/** Dashboard snapshot. */
export interface DashboardSnapshot {
  engines: Record<EngineName, EngineStatus>;
  totalAlerts: number;
  threatsBlocked: number;
  pagesScanned: number;
  connectedInstances: number;
  lastUpdated: string;
}

/* ── State Manager ── */

/**
 * Tracks real-time dashboard state.
 */
export class DashboardState {
  private engines: Record<EngineName, EngineStatus> = {
    phishing: EngineStatus.INACTIVE,
    c2pa: EngineStatus.INACTIVE,
    dlp: EngineStatus.INACTIVE,
  };

  private totalAlerts = 0;
  private threatsBlocked = 0;
  private pagesScanned = 0;
  private connectedInstances = 0;

  /**
   * Update engine status.
   *
   * @param engine - Engine name
   * @param status - New status
   */
  setEngineStatus(engine: EngineName, status: EngineStatus): void {
    this.engines[engine] = status;
  }

  /**
   * Record an alert from any engine.
   *
   * @param _source - Alert source (for future per-source tracking)
   * @param _severity - Alert severity
   */
  recordAlert(_source: AlertSource, _severity: AlertSeverity): void {
    this.totalAlerts++;
  }

  /** Record a blocked threat. */
  recordBlock(): void {
    this.threatsBlocked++;
  }

  /** Record a page scan. */
  recordScan(): void {
    this.pagesScanned++;
  }

  /** Set connected instance count. */
  setInstanceCount(count: number): void {
    this.connectedInstances = count;
  }

  /**
   * Get a snapshot of current dashboard state.
   *
   * @returns Current dashboard state
   */
  getSnapshot(): DashboardSnapshot {
    return {
      engines: { ...this.engines },
      totalAlerts: this.totalAlerts,
      threatsBlocked: this.threatsBlocked,
      pagesScanned: this.pagesScanned,
      connectedInstances: this.connectedInstances,
      lastUpdated: new Date().toISOString(),
    };
  }
}
