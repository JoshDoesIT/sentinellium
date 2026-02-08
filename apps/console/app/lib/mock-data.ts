/**
 * @module Mock Data
 * @description Pre-seeded data for the Sentinellium enterprise console.
 * Provides realistic alerts, fleet instances, dashboard metrics, audit
 * entries, and user directory so the dashboard renders meaningful data
 * on first load.
 */

/* ── Alert Types ── */

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

/* ── Alerts ── */

const now = Date.now();
const hour = 3_600_000;

export const MOCK_ALERTS: UnifiedAlert[] = [
  {
    id: "alert-1",
    source: "PHISHING",
    severity: "CRITICAL",
    title: "Credential harvesting form detected",
    domain: "secure-login.evil.ru",
    url: "https://secure-login.evil.ru/auth",
    timestamp: new Date(now - 0.5 * hour).toISOString(),
  },
  {
    id: "alert-2",
    source: "DLP",
    severity: "CRITICAL",
    title: "SSN pattern detected in ChatGPT input",
    domain: "chat.openai.com",
    url: "https://chat.openai.com/c/abc123",
    timestamp: new Date(now - 1.2 * hour).toISOString(),
  },
  {
    id: "alert-3",
    source: "C2PA",
    severity: "HIGH",
    title: "Deepfake video — missing provenance manifest",
    domain: "news-update.cn",
    url: "https://news-update.cn/breaking/video.mp4",
    timestamp: new Date(now - 2 * hour).toISOString(),
  },
  {
    id: "alert-4",
    source: "PHISHING",
    severity: "HIGH",
    title: "Typosquatted domain mimicking Microsoft",
    domain: "microsoftt-login.com",
    url: "https://microsoftt-login.com/office365",
    timestamp: new Date(now - 3 * hour).toISOString(),
  },
  {
    id: "alert-5",
    source: "DLP",
    severity: "HIGH",
    title: "API key leaked in Claude prompt",
    domain: "claude.ai",
    url: "https://claude.ai/chat/xyz",
    timestamp: new Date(now - 4 * hour).toISOString(),
  },
  {
    id: "alert-6",
    source: "PHISHING",
    severity: "MEDIUM",
    title: "Suspicious login form — SSL certificate mismatch",
    domain: "bank-verify.ng",
    url: "https://bank-verify.ng/login",
    timestamp: new Date(now - 5 * hour).toISOString(),
  },
  {
    id: "alert-7",
    source: "C2PA",
    severity: "MEDIUM",
    title: "Image provenance — signature expired",
    domain: "images.reuters.com",
    url: "https://images.reuters.com/photo/2025-01.jpg",
    timestamp: new Date(now - 6 * hour).toISOString(),
  },
  {
    id: "alert-8",
    source: "DLP",
    severity: "MEDIUM",
    title: "Email addresses detected in Gemini prompt",
    domain: "gemini.google.com",
    url: "https://gemini.google.com/app",
    timestamp: new Date(now - 7 * hour).toISOString(),
  },
  {
    id: "alert-9",
    source: "PHISHING",
    severity: "MEDIUM",
    title: "Hidden iframe overlay on login page",
    domain: "account-update.ir",
    url: "https://account-update.ir/verify",
    timestamp: new Date(now - 9 * hour).toISOString(),
  },
  {
    id: "alert-10",
    source: "C2PA",
    severity: "LOW",
    title: "Provenance chain incomplete — 1 of 3 assertions valid",
    domain: "social-media.br",
    url: "https://social-media.br/post/12345",
    timestamp: new Date(now - 10 * hour).toISOString(),
  },
  {
    id: "alert-11",
    source: "DLP",
    severity: "LOW",
    title: "Phone number pattern in Copilot chat",
    domain: "copilot.microsoft.com",
    url: "https://copilot.microsoft.com/chat",
    timestamp: new Date(now - 12 * hour).toISOString(),
  },
  {
    id: "alert-12",
    source: "PHISHING",
    severity: "LOW",
    title: "Newly registered domain — age < 7 days",
    domain: "quick-offer.de",
    url: "https://quick-offer.de/promo",
    timestamp: new Date(now - 14 * hour).toISOString(),
  },
  {
    id: "alert-13",
    source: "C2PA",
    severity: "INFO",
    title: "C2PA manifest verified — authentic media",
    domain: "nytimes.com",
    url: "https://nytimes.com/2025/photo.jpg",
    timestamp: new Date(now - 16 * hour).toISOString(),
  },
  {
    id: "alert-14",
    source: "DLP",
    severity: "INFO",
    title: "DLP scan completed — no PII detected",
    domain: "perplexity.ai",
    url: "https://perplexity.ai/search",
    timestamp: new Date(now - 18 * hour).toISOString(),
  },
  {
    id: "alert-15",
    source: "PHISHING",
    severity: "INFO",
    title: "Page scanned — no threats detected",
    domain: "github.com",
    url: "https://github.com/sentinellium",
    timestamp: new Date(now - 20 * hour).toISOString(),
  },
];

/* ── Dashboard Metrics ── */

export interface EngineHealth {
  name: string;
  key: string;
  status: "ACTIVE" | "INACTIVE" | "ERROR";
  description: string;
}

export const ENGINE_HEALTH: EngineHealth[] = [
  {
    name: "Context Engine",
    key: "phishing",
    status: "ACTIVE",
    description: "Semantic phishing detection",
  },
  {
    name: "Provenance Engine",
    key: "c2pa",
    status: "ACTIVE",
    description: "C2PA deepfake defense",
  },
  {
    name: "DLP Engine",
    key: "dlp",
    status: "ACTIVE",
    description: "Shadow AI data protection",
  },
];

export const DASHBOARD_METRICS = {
  totalAlerts: 23,
  threatsBlocked: 18,
  pagesScanned: 2847,
  connectedInstances: 5,
};

/* ── Fleet Instances ── */

export interface FleetInstance {
  instanceId: string;
  hostname: string;
  browser: string;
  version: string;
  status: "ONLINE" | "STALE" | "OFFLINE";
  lastSeen: string;
}

export const FLEET_INSTANCES: FleetInstance[] = [
  {
    instanceId: "inst-001",
    hostname: "ws-analyst-01",
    browser: "Chrome 121",
    version: "0.1.0",
    status: "ONLINE",
    lastSeen: new Date(now - 30_000).toISOString(),
  },
  {
    instanceId: "inst-002",
    hostname: "ws-analyst-02",
    browser: "Edge 121",
    version: "0.1.0",
    status: "ONLINE",
    lastSeen: new Date(now - 45_000).toISOString(),
  },
  {
    instanceId: "inst-003",
    hostname: "ws-exec-01",
    browser: "Chrome 121",
    version: "0.1.0",
    status: "ONLINE",
    lastSeen: new Date(now - 60_000).toISOString(),
  },
  {
    instanceId: "inst-004",
    hostname: "ws-soc-01",
    browser: "Firefox 122",
    version: "0.1.0",
    status: "ONLINE",
    lastSeen: new Date(now - 90_000).toISOString(),
  },
  {
    instanceId: "inst-005",
    hostname: "ws-remote-01",
    browser: "Chrome 120",
    version: "0.0.9",
    status: "STALE",
    lastSeen: new Date(now - 15 * 60_000).toISOString(),
  },
  {
    instanceId: "inst-006",
    hostname: "ws-contractor-01",
    browser: "Edge 120",
    version: "0.0.8",
    status: "OFFLINE",
    lastSeen: new Date(now - 48 * hour).toISOString(),
  },
];

/* ── Timeline Buckets ── */

export interface TimeBucket {
  start: string;
  end: string;
  count: number;
}

export function generateTimelineBuckets(): TimeBucket[] {
  const buckets: TimeBucket[] = [];
  // Simulate 24 hours of data with realistic ebb/flow
  const counts = [
    0, 0, 1, 0, 0, 0, 1, 2, 3, 2, 1, 0, 1, 3, 4, 2, 1, 0, 0, 1, 2, 1, 0, 1,
  ];

  for (let i = 23; i >= 0; i--) {
    const start = now - (i + 1) * hour;
    const end = now - i * hour;
    buckets.push({
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
      count: counts[23 - i] ?? 0,
    });
  }
  return buckets;
}

export const TIMELINE_BUCKETS = generateTimelineBuckets();

/* ── Geo Heatmap ── */

export interface GeoEntry {
  region: string;
  count: number;
}

export const GEO_HEATMAP: GeoEntry[] = [
  { region: "Global", count: 5 },
  { region: "Russia", count: 3 },
  { region: "China", count: 2 },
  { region: "Nigeria", count: 1 },
  { region: "Iran", count: 1 },
  { region: "Brazil", count: 1 },
  { region: "Germany", count: 1 },
  { region: "United Kingdom", count: 1 },
];

/* ── Audit Log ── */

export type AuditAction =
  | "LOGIN"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "CONFIG_CHANGE"
  | "ALERT_DISMISSED"
  | "REPORT_EXPORTED"
  | "USER_CREATED"
  | "ROLE_CHANGED"
  | "MFA_ENABLED"
  | "SESSION_EXPIRED";

export interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: AuditAction;
  target: string;
  ipAddress: string;
}

export const AUDIT_LOG: AuditEntry[] = [
  {
    id: "aud-01",
    timestamp: new Date(now - 0.1 * hour).toISOString(),
    actor: "j.martinez",
    action: "LOGIN",
    target: "Console",
    ipAddress: "10.0.2.15",
  },
  {
    id: "aud-02",
    timestamp: new Date(now - 0.3 * hour).toISOString(),
    actor: "j.martinez",
    action: "ALERT_DISMISSED",
    target: "alert-13",
    ipAddress: "10.0.2.15",
  },
  {
    id: "aud-03",
    timestamp: new Date(now - 0.8 * hour).toISOString(),
    actor: "s.chen",
    action: "REPORT_EXPORTED",
    target: "Executive Summary (JSON)",
    ipAddress: "10.0.3.42",
  },
  {
    id: "aud-04",
    timestamp: new Date(now - 1.2 * hour).toISOString(),
    actor: "a.reeves",
    action: "CONFIG_CHANGE",
    target: "DLP sensitivity → 85",
    ipAddress: "10.0.1.8",
  },
  {
    id: "aud-05",
    timestamp: new Date(now - 2 * hour).toISOString(),
    actor: "system",
    action: "SESSION_EXPIRED",
    target: "m.okafor",
    ipAddress: "—",
  },
  {
    id: "aud-06",
    timestamp: new Date(now - 3 * hour).toISOString(),
    actor: "a.reeves",
    action: "USER_CREATED",
    target: "t.nakamura",
    ipAddress: "10.0.1.8",
  },
  {
    id: "aud-07",
    timestamp: new Date(now - 3.5 * hour).toISOString(),
    actor: "a.reeves",
    action: "ROLE_CHANGED",
    target: "t.nakamura → Analyst",
    ipAddress: "10.0.1.8",
  },
  {
    id: "aud-08",
    timestamp: new Date(now - 4 * hour).toISOString(),
    actor: "t.nakamura",
    action: "MFA_ENABLED",
    target: "TOTP",
    ipAddress: "10.0.4.77",
  },
  {
    id: "aud-09",
    timestamp: new Date(now - 5 * hour).toISOString(),
    actor: "m.okafor",
    action: "LOGIN",
    target: "Console",
    ipAddress: "10.0.5.23",
  },
  {
    id: "aud-10",
    timestamp: new Date(now - 6 * hour).toISOString(),
    actor: "unknown",
    action: "LOGIN_FAILED",
    target: "Console",
    ipAddress: "203.0.113.42",
  },
  {
    id: "aud-11",
    timestamp: new Date(now - 7 * hour).toISOString(),
    actor: "s.chen",
    action: "ALERT_DISMISSED",
    target: "alert-10",
    ipAddress: "10.0.3.42",
  },
  {
    id: "aud-12",
    timestamp: new Date(now - 8 * hour).toISOString(),
    actor: "j.martinez",
    action: "CONFIG_CHANGE",
    target: "Phishing sensitivity → 70",
    ipAddress: "10.0.2.15",
  },
  {
    id: "aud-13",
    timestamp: new Date(now - 10 * hour).toISOString(),
    actor: "a.reeves",
    action: "REPORT_EXPORTED",
    target: "Executive Summary (Text)",
    ipAddress: "10.0.1.8",
  },
  {
    id: "aud-14",
    timestamp: new Date(now - 12 * hour).toISOString(),
    actor: "s.chen",
    action: "LOGIN",
    target: "Console",
    ipAddress: "10.0.3.42",
  },
  {
    id: "aud-15",
    timestamp: new Date(now - 14 * hour).toISOString(),
    actor: "system",
    action: "SESSION_EXPIRED",
    target: "j.martinez",
    ipAddress: "—",
  },
  {
    id: "aud-16",
    timestamp: new Date(now - 16 * hour).toISOString(),
    actor: "j.martinez",
    action: "LOGIN",
    target: "Console (SSO)",
    ipAddress: "10.0.2.15",
  },
  {
    id: "aud-17",
    timestamp: new Date(now - 18 * hour).toISOString(),
    actor: "a.reeves",
    action: "CONFIG_CHANGE",
    target: "Slack webhook updated",
    ipAddress: "10.0.1.8",
  },
  {
    id: "aud-18",
    timestamp: new Date(now - 20 * hour).toISOString(),
    actor: "m.okafor",
    action: "LOGOUT",
    target: "Console",
    ipAddress: "10.0.5.23",
  },
];

/* ── Users & RBAC ── */

export type UserRole = "Admin" | "Analyst" | "Viewer";

export interface ConsoleUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  mfaEnabled: boolean;
  status: "Active" | "Disabled";
  lastLogin: string;
}

export const USERS: ConsoleUser[] = [
  {
    id: "usr-01",
    name: "Alex Reeves",
    email: "a.reeves@corp.io",
    role: "Admin",
    mfaEnabled: true,
    status: "Active",
    lastLogin: new Date(now - 3 * hour).toISOString(),
  },
  {
    id: "usr-02",
    name: "Jordan Martinez",
    email: "j.martinez@corp.io",
    role: "Analyst",
    mfaEnabled: true,
    status: "Active",
    lastLogin: new Date(now - 0.1 * hour).toISOString(),
  },
  {
    id: "usr-03",
    name: "Sophia Chen",
    email: "s.chen@corp.io",
    role: "Analyst",
    mfaEnabled: true,
    status: "Active",
    lastLogin: new Date(now - 12 * hour).toISOString(),
  },
  {
    id: "usr-04",
    name: "Michael Okafor",
    email: "m.okafor@corp.io",
    role: "Viewer",
    mfaEnabled: false,
    status: "Active",
    lastLogin: new Date(now - 5 * hour).toISOString(),
  },
  {
    id: "usr-05",
    name: "Taro Nakamura",
    email: "t.nakamura@corp.io",
    role: "Analyst",
    mfaEnabled: true,
    status: "Active",
    lastLogin: new Date(now - 4 * hour).toISOString(),
  },
];

/* ── Helpers ── */

const SEVERITY_ORDER: Record<AlertSeverity, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
  INFO: 4,
};

/** Get alerts sorted by severity (most severe first). */
export function getSortedAlerts(): UnifiedAlert[] {
  return [...MOCK_ALERTS].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );
}

/** Count alerts by severity. */
export function alertCountsBySeverity(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const alert of MOCK_ALERTS) {
    counts[alert.severity] = (counts[alert.severity] ?? 0) + 1;
  }
  return counts;
}

/** Count alerts by source. */
export function alertCountsBySource(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const alert of MOCK_ALERTS) {
    counts[alert.source] = (counts[alert.source] ?? 0) + 1;
  }
  return counts;
}

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
