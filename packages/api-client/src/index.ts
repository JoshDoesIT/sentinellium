/**
 * @module @sentinellium/api-client
 * @description Typed fetch wrapper for all Sentinellium API endpoints.
 * Designed for use in both Next.js server components and client components.
 *
 * Uses native `fetch` — no runtime dependencies.
 */

/* ── Response Types ── */

/** Standard API envelope. */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string };
}

/* ── Domain Types (mirrors engine output shapes) ── */

export interface UnifiedAlert {
  id: string;
  source: "PHISHING" | "C2PA" | "DLP";
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  title: string;
  domain: string;
  url: string;
  timestamp: string;
}

export interface PaginatedAlerts {
  items: UnifiedAlert[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface AlertDetail extends UnifiedAlert {
  alertId: string;
  formattedTime: string;
  severityLabel: string;
  sourceLabel: string;
  summary: string;
  evidence: { label: string; url: string }[];
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

export interface TrendResult {
  direction: "up" | "down" | "stable";
  recentCount: number;
  previousCount: number;
}

export interface TimelineData {
  buckets: TimeBucket[];
  trend: TrendResult;
}

export interface GeoEntry {
  region: string;
  count: number;
}

export interface FleetData {
  instances: ManagedInstance[];
  stats: { total: number; online: number };
}

export interface ManagedInstance {
  instanceId: string;
  hostname: string;
  browser: string;
  version: string;
  status: "ONLINE" | "STALE" | "OFFLINE";
  lastSeen: string;
  registeredAt: string;
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

export interface AlertFilter {
  source?: string;
  minSeverity?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

/* ── Client Class ── */

/**
 * Typed API client for the Sentinellium backend.
 *
 * @example
 * ```ts
 * const client = new SentinelliumClient("http://localhost:4000");
 * const dashboard = await client.getDashboard();
 * ```
 */
export class SentinelliumClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  /** Internal fetch helper with error handling. */
  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }

    const json = (await res.json()) as ApiResponse<T>;
    if (!json.success) {
      throw new Error(json.error?.message ?? "Unknown API error");
    }

    return json.data;
  }

  // ── Alerts ──────────────────────────────────────────────────────

  /** Get paginated, filterable alerts. */
  async getAlerts(filter?: AlertFilter): Promise<PaginatedAlerts> {
    const params = new URLSearchParams();
    if (filter?.source) params.set("source", filter.source);
    if (filter?.minSeverity) params.set("minSeverity", filter.minSeverity);
    if (filter?.search) params.set("search", filter.search);
    if (filter?.page) params.set("page", String(filter.page));
    if (filter?.pageSize) params.set("pageSize", String(filter.pageSize));

    const qs = params.toString();
    return this.request<PaginatedAlerts>(`/api/alerts${qs ? `?${qs}` : ""}`);
  }

  /** Get a single alert with full detail. */
  async getAlertById(id: string): Promise<AlertDetail> {
    return this.request<AlertDetail>(`/api/alerts/${id}`);
  }

  /** Ingest a new alert. */
  async ingestAlert(input: {
    source: string;
    severity: string;
    title: string;
    domain: string;
    url: string;
  }): Promise<{ message: string }> {
    return this.request<{ message: string }>("/api/alerts", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  /** Get alert counts by severity. */
  async getAlertsBySeverity(): Promise<Record<string, number>> {
    return this.request<Record<string, number>>("/api/alerts/stats/severity");
  }

  /** Get alert counts by source. */
  async getAlertsBySource(): Promise<Record<string, number>> {
    return this.request<Record<string, number>>("/api/alerts/stats/source");
  }

  // ── Dashboard ───────────────────────────────────────────────────

  /** Get the full dashboard snapshot. */
  async getDashboard(): Promise<DashboardSnapshot> {
    return this.request<DashboardSnapshot>("/api/dashboard");
  }

  /** Get 24h timeline buckets and trend. */
  async getTimeline(): Promise<TimelineData> {
    return this.request<TimelineData>("/api/dashboard/timeline");
  }

  /** Get geographic threat heatmap. */
  async getGeoHeatmap(): Promise<GeoEntry[]> {
    return this.request<GeoEntry[]>("/api/dashboard/geo");
  }

  // ── Fleet ───────────────────────────────────────────────────────

  /** Get all fleet instances. */
  async getFleet(): Promise<FleetData> {
    return this.request<FleetData>("/api/fleet");
  }

  /** Register a new fleet instance. */
  async registerInstance(input: {
    instanceId: string;
    hostname: string;
    browser: string;
    version: string;
  }): Promise<{ message: string }> {
    return this.request<{ message: string }>("/api/fleet/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  // ── Users ───────────────────────────────────────────────────────

  /** Get all users. */
  async getUsers(): Promise<ConsoleUser[]> {
    return this.request<ConsoleUser[]>("/api/users");
  }

  /** Create a new user. */
  async createUser(input: {
    name: string;
    email: string;
    role: string;
  }): Promise<ConsoleUser> {
    return this.request<ConsoleUser>("/api/users", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  // ── Audit ───────────────────────────────────────────────────────

  /** Get audit log entries. */
  async getAuditLog(filter?: {
    action?: string;
    search?: string;
  }): Promise<AuditEntry[]> {
    const params = new URLSearchParams();
    if (filter?.action) params.set("action", filter.action);
    if (filter?.search) params.set("search", filter.search);

    const qs = params.toString();
    return this.request<AuditEntry[]>(`/api/audit${qs ? `?${qs}` : ""}`);
  }

  // ── Health ──────────────────────────────────────────────────────

  /** Health check. */
  async health(): Promise<{
    status: string;
    service: string;
    timestamp: string;
  }> {
    const res = await fetch(`${this.baseUrl}/health`);
    return (await res.json()) as {
      status: string;
      service: string;
      timestamp: string;
    };
  }
}
