/**
 * @module Retention Manager
 * @description Manages telemetry data lifecycle with configurable
 * retention periods and storage quota enforcement. Automatically
 * cleans up expired data and trims to quota limits.
 */
import { type RecordedEvent } from "./telemetry-collector";

/* ── Types ── */

/** Retention policy configuration. */
export interface RetentionPolicy {
  defaultTtlMs: number;
  maxEvents: number;
}

/* ── Manager ── */

/**
 * Enforces data retention policies on telemetry events.
 * Supports TTL-based expiry and event count quotas.
 */
export class RetentionManager {
  /** The active retention policy. */
  readonly policy: RetentionPolicy;

  constructor(policy: RetentionPolicy) {
    this.policy = policy;
  }

  /**
   * Remove events older than the configured TTL.
   *
   * @param events - Events to filter
   * @returns Events within the retention window
   */
  purgeExpired(events: readonly RecordedEvent[]): RecordedEvent[] {
    const cutoff = Date.now() - this.policy.defaultTtlMs;
    return events.filter((e) => e.timestamp >= cutoff);
  }

  /**
   * Enforce the maximum event quota by keeping only the newest events.
   *
   * @param events - Events to trim
   * @returns Events trimmed to quota, keeping newest
   */
  enforceQuota(events: readonly RecordedEvent[]): RecordedEvent[] {
    if (events.length <= this.policy.maxEvents) {
      return [...events];
    }
    return events.slice(events.length - this.policy.maxEvents);
  }

  /**
   * Apply both TTL purge and quota enforcement.
   * Purges expired first, then trims to quota.
   *
   * @param events - Events to clean up
   * @returns Retained events after all policies applied
   */
  cleanup(events: readonly RecordedEvent[]): RecordedEvent[] {
    const afterPurge = this.purgeExpired(events);
    return this.enforceQuota(afterPurge);
  }
}
