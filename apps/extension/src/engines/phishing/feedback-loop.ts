/**
 * @module Feedback Loop
 * @description Learns from user corrections to reduce false positives.
 * Stores dismiss/confirm/report actions locally and provides
 * auto-allowlist recommendations based on feedback history.
 *
 * Privacy: All data stays local — no cloud upload.
 */

/* ── Types ── */

/** User feedback action types. */
export enum FeedbackAction {
  DISMISS = "DISMISS",
  CONFIRM_PHISHING = "CONFIRM_PHISHING",
  REPORT = "REPORT",
}

/** A single feedback entry. */
export interface FeedbackEntry {
  domain: string;
  url: string;
  action: FeedbackAction;
  timestamp: number;
}

/** Aggregated stats for a domain. */
export interface DomainStats {
  dismissCount: number;
  confirmCount: number;
  reportCount: number;
  lastAction: FeedbackAction | null;
  lastTimestamp: number | null;
}

/** Storage adapter interface. */
interface StorageAdapter {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
}

/* ── Constants ── */

const STORAGE_KEY = "sentinellium:feedback";
const AUTO_ALLOWLIST_THRESHOLD = 3;

/* ── Feedback Loop ── */

/**
 * Manages user feedback for the phishing engine.
 *
 * Tracks dismiss/confirm/report actions per-domain and
 * recommends auto-allowlisting for repeatedly dismissed domains.
 */
export class FeedbackLoop {
  private readonly storage: StorageAdapter;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  /**
   * Record a user feedback action.
   *
   * @param entry - The feedback entry to record
   */
  async record(entry: FeedbackEntry): Promise<void> {
    const entries = await this.loadEntries();
    entries.push(entry);
    await this.storage.set(STORAGE_KEY, entries);
  }

  /**
   * Get aggregated stats for a domain.
   *
   * @param domain - The domain to query
   * @returns Stats with dismiss/confirm/report counts
   */
  async getDomainStats(domain: string): Promise<DomainStats> {
    const entries = await this.loadEntries();
    const domainEntries = entries.filter((e) => e.domain === domain);

    if (domainEntries.length === 0) {
      return {
        dismissCount: 0,
        confirmCount: 0,
        reportCount: 0,
        lastAction: null,
        lastTimestamp: null,
      };
    }

    const dismissCount = domainEntries.filter(
      (e) => e.action === FeedbackAction.DISMISS,
    ).length;
    const confirmCount = domainEntries.filter(
      (e) => e.action === FeedbackAction.CONFIRM_PHISHING,
    ).length;
    const reportCount = domainEntries.filter(
      (e) => e.action === FeedbackAction.REPORT,
    ).length;

    const lastEntry = domainEntries[domainEntries.length - 1];

    return {
      dismissCount,
      confirmCount,
      reportCount,
      lastAction: lastEntry?.action ?? null,
      lastTimestamp: lastEntry?.timestamp ?? null,
    };
  }

  /**
   * Check if a domain should be auto-allowlisted based on
   * repeated user dismissals.
   *
   * Requirements:
   * - At least AUTO_ALLOWLIST_THRESHOLD dismissals
   * - No confirm-phishing actions (user never agreed it was phishing)
   */
  async shouldAutoAllowlist(domain: string): Promise<boolean> {
    const stats = await this.getDomainStats(domain);
    return (
      stats.dismissCount >= AUTO_ALLOWLIST_THRESHOLD && stats.confirmCount === 0
    );
  }

  /* ── Storage ── */

  private async loadEntries(): Promise<FeedbackEntry[]> {
    const raw = await this.storage.get(STORAGE_KEY);
    if (Array.isArray(raw)) {
      return raw as FeedbackEntry[];
    }
    return [];
  }
}
