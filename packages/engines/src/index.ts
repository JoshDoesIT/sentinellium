/**
 * @module @sentinellium/engines
 * @description Shared engine classes for the Sentinellium platform.
 *
 * These engines are used by both the browser extension (client-side)
 * and the API service (server-side) to process alerts, manage fleet
 * instances, build dashboards, and generate reports.
 */

// ─── Alert Pipeline ─────────────────────────────────────────────────
export {
  AlertAggregator,
  AlertSource,
  AlertSeverity,
  type UnifiedAlert,
  type AlertInput,
} from "./alert-aggregator";

export {
  AlertFeed,
  type AlertFilter,
  type PaginationOptions,
  type PaginatedResult,
} from "./alert-feed";

export {
  AlertDetailBuilder,
  type AlertDetail,
  type EvidenceLink,
} from "./alert-detail";

export {
  AlertStreamClient,
  ConnectionState,
  type StreamMessage,
  type StreamHandlers,
} from "./alert-stream-client";

// ─── Dashboard & Visualization ──────────────────────────────────────
export {
  DashboardState,
  EngineStatus,
  type DashboardSnapshot,
} from "./dashboard-state";

export {
  ThreatTimeline,
  TimeInterval,
  type TimeBucket,
  type TrendResult,
} from "./threat-timeline";

export { GeoMapper, type HeatmapEntry } from "./geo-mapper";

// ─── Fleet Management ───────────────────────────────────────────────
export {
  FleetManager,
  InstanceStatus,
  type ManagedInstance,
  type InstanceInput,
} from "./fleet-manager";

// ─── Notifications & Reports ────────────────────────────────────────
export {
  NotificationDispatcher,
  NotificationChannel,
  type ChannelConfig,
  type NotificationInput,
} from "./notification-dispatcher";

export { ReportGenerator, ReportFormat } from "./report-generator";
