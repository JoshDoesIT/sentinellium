/**
 * @module Console API Client
 * @description Server-side and client-side fetch helpers for the Sentinellium API.
 * Reads the base URL from NEXT_PUBLIC_API_URL env var.
 */

const API_BASE = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000";

/* ── Shared Types ── */

export type AlertSource = "PHISHING" | "C2PA" | "DLP";
export type AlertSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";

export interface UnifiedAlert {
  id: string;
  source: AlertSource;
  severity: AlertSeverity;
  title: string;
  domain: string;
  url: string;
  timestamp: string;
}

export interface PaginatedAlerts {
  items: UnifiedAlert[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export interface DashboardSnapshot {
  engines: Record<string, string>;
  totalAlerts: number;
  threatsBlocked: number;
  pagesScanned: number;
  connectedInstances: number;
  lastUpdated: string;
  severityCounts: Record<string, number>;
}

export interface TimeBucket {
  start: string;
  end: string;
  count: number;
}

export interface TimelineData {
  buckets: TimeBucket[];
  trend: {
    direction: "up" | "down" | "stable";
    recentCount: number;
    previousCount: number;
  };
}

export interface GeoEntry {
  region: string;
  count: number;
}

export interface FleetInstance {
  instanceId: string;
  hostname: string;
  browser: string;
  version: string;
  status: "ONLINE" | "STALE" | "OFFLINE";
  lastSeen: string;
  registeredAt: string;
}

export interface FleetData {
  instances: FleetInstance[];
  stats: { total: number; online: number };
}

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

export interface EngineHealth {
  name: string;
  key: string;
  status: "ACTIVE" | "INACTIVE" | "ERROR";
  description: string;
}

/* ── Generic Fetch ── */

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string };
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    cache: "no-store", // always fresh data for the console
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }

  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) {
    throw new Error(json.error?.message ?? "Unknown API error");
  }

  return json.data;
}

/* ── Dashboard ── */

export async function fetchDashboard(): Promise<DashboardSnapshot> {
  return apiFetch<DashboardSnapshot>("/api/dashboard");
}

/* ── Alerts ── */

export async function fetchAlerts(params?: {
  source?: string;
  minSeverity?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedAlerts> {
  const qs = new URLSearchParams();
  if (params?.source) qs.set("source", params.source);
  if (params?.minSeverity) qs.set("minSeverity", params.minSeverity);
  if (params?.search) qs.set("search", params.search);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.pageSize) qs.set("pageSize", String(params.pageSize));

  const q = qs.toString();
  return apiFetch<PaginatedAlerts>(`/api/alerts${q ? `?${q}` : ""}`);
}

/* ── Timeline ── */

export async function fetchTimeline(): Promise<TimelineData> {
  return apiFetch<TimelineData>("/api/dashboard/timeline");
}

/** Fetch alert counts broken down by source engine. */
export async function fetchAlertsBySource(): Promise<Record<string, number>> {
  return apiFetch<Record<string, number>>("/api/alerts/stats/source");
}

/* ── Geo ── */

export async function fetchGeoHeatmap(): Promise<GeoEntry[]> {
  return apiFetch<GeoEntry[]>("/api/dashboard/geo");
}

/* ── Fleet ── */

export async function fetchFleet(): Promise<FleetData> {
  return apiFetch<FleetData>("/api/fleet");
}

/* ── Users ── */

export async function fetchUsers(): Promise<ConsoleUser[]> {
  return apiFetch<ConsoleUser[]>("/api/users");
}

/* ── Audit ── */

export async function fetchAuditLog(params?: {
  action?: string;
  search?: string;
}): Promise<AuditEntry[]> {
  const qs = new URLSearchParams();
  if (params?.action) qs.set("action", params.action);
  if (params?.search) qs.set("search", params.search);

  const q = qs.toString();
  return apiFetch<AuditEntry[]>(`/api/audit${q ? `?${q}` : ""}`);
}

/* ── Formatting Helpers (kept for backwards compatibility) ── */

/** Format an ISO timestamp for display. */
export function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

/** Format relative time (e.g. "2h ago"). */
export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/* ── Engine Health Constants ── */

export const ENGINE_HEALTH_MAP: Record<
  string,
  { name: string; description: string }
> = {
  phishing: {
    name: "Context Engine",
    description: "Semantic phishing detection",
  },
  c2pa: { name: "Provenance Engine", description: "C2PA deepfake defense" },
  dlp: { name: "DLP Engine", description: "Shadow AI data protection" },
};
