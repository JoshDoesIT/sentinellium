/**
 * @module API State
 * @description Singleton engine instances for server-side state management.
 * Instantiates all console engines and exposes them for route handlers.
 *
 * In production, these would be backed by a database. For the portfolio
 * demo, in-memory state is correct and intentional — it demonstrates
 * the engine class APIs working end-to-end.
 */

import {
  AlertAggregator,
  AlertFeed,
  AlertDetailBuilder,
  DashboardState,
  FleetManager,
  GeoMapper,
  ThreatTimeline,
  ReportGenerator,
  type AlertSource,
  type AlertSeverity,
  type UnifiedAlert,
} from "@sentinellium/engines";

/* ── Engine Singletons ── */

/** Aggregates alerts from all three engines. */
export const aggregator = new AlertAggregator();

/** Filtering, search, and pagination for the alert feed. */
export const alertFeed = new AlertFeed();

/** Builds detailed context views for individual alerts. */
export const alertDetail = new AlertDetailBuilder();

/** Manages real-time dashboard counters and engine health. */
export const dashboard = new DashboardState();

/** Tracks connected extension instances. */
export const fleet = new FleetManager();

/** Maps domains to geographic regions. */
export const geo = new GeoMapper();

/** Builds time-bucketed data for charts. */
export const timeline = new ThreatTimeline();

/** Generates executive reports. */
export const reportGen = new ReportGenerator();

/* ── Users & Audit (simple in-memory stores) ── */

export interface ConsoleUser {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Analyst" | "Viewer";
  mfaEnabled: boolean;
  status: "Active" | "Disabled";
  lastLogin: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  ipAddress: string;
}

export const users: ConsoleUser[] = [];
export const auditLog: AuditEntry[] = [];

let nextUserId = 1;
let nextAuditId = 1;

/** Add a user. */
export function addUser(input: Omit<ConsoleUser, "id">): ConsoleUser {
  const user: ConsoleUser = {
    id: `usr-${String(nextUserId++).padStart(2, "0")}`,
    ...input,
  };
  users.push(user);
  return user;
}

/** Log an audit event. */
export function addAuditEntry(input: Omit<AuditEntry, "id">): AuditEntry {
  const entry: AuditEntry = {
    id: `aud-${String(nextAuditId++).padStart(2, "0")}`,
    ...input,
  };
  auditLog.push(entry);
  return entry;
}

/* ── Helpers ── */

/**
 * Record an alert in both the aggregator and dashboard state.
 * This is the single entry point for alert ingestion.
 */
export function ingestAlert(input: {
  source: AlertSource;
  severity: AlertSeverity;
  title: string;
  domain: string;
  url: string;
}): void {
  aggregator.add(input);
  dashboard.recordAlert(input.source, input.severity);
  if (input.severity === "CRITICAL" || input.severity === "HIGH") {
    dashboard.recordBlock();
  }
}

/** Get all alerts as a typed array (for timeline/geo computation). */
export function getAllAlerts(): readonly UnifiedAlert[] {
  return aggregator.getAll();
}
