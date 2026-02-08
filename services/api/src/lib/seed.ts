import {
  EngineStatus,
  AlertSource,
  AlertSeverity,
} from "@sentinellium/engines";
import { ingestAlert, dashboard, fleet, addUser, addAuditEntry } from "./state";

const now = Date.now();
const hour = 3_600_000;

/* ── Alerts ── */

const SEED_ALERTS: {
  source: AlertSource;
  severity: AlertSeverity;
  title: string;
  domain: string;
  url: string;
}[] = [
  {
    source: AlertSource.PHISHING,
    severity: AlertSeverity.CRITICAL,
    title: "Credential harvesting form detected",
    domain: "secure-login.evil.ru",
    url: "https://secure-login.evil.ru/auth",
  },
  {
    source: AlertSource.DLP,
    severity: AlertSeverity.CRITICAL,
    title: "SSN pattern detected in ChatGPT input",
    domain: "chat.openai.com",
    url: "https://chat.openai.com/c/abc123",
  },
  {
    source: AlertSource.C2PA,
    severity: AlertSeverity.HIGH,
    title: "Deepfake video — missing provenance manifest",
    domain: "news-update.cn",
    url: "https://news-update.cn/breaking/video.mp4",
  },
  {
    source: AlertSource.PHISHING,
    severity: AlertSeverity.HIGH,
    title: "Typosquatted domain mimicking Microsoft",
    domain: "microsoftt-login.com",
    url: "https://microsoftt-login.com/office365",
  },
  {
    source: AlertSource.DLP,
    severity: AlertSeverity.HIGH,
    title: "API key leaked in Claude prompt",
    domain: "claude.ai",
    url: "https://claude.ai/chat/xyz",
  },
  {
    source: AlertSource.PHISHING,
    severity: AlertSeverity.MEDIUM,
    title: "Suspicious login form — SSL certificate mismatch",
    domain: "bank-verify.ng",
    url: "https://bank-verify.ng/login",
  },
  {
    source: AlertSource.C2PA,
    severity: AlertSeverity.MEDIUM,
    title: "Image provenance — signature expired",
    domain: "images.reuters.com",
    url: "https://images.reuters.com/photo/2025-01.jpg",
  },
  {
    source: AlertSource.DLP,
    severity: AlertSeverity.MEDIUM,
    title: "Email addresses detected in Gemini prompt",
    domain: "gemini.google.com",
    url: "https://gemini.google.com/app",
  },
  {
    source: AlertSource.PHISHING,
    severity: AlertSeverity.MEDIUM,
    title: "Hidden iframe overlay on login page",
    domain: "account-update.ir",
    url: "https://account-update.ir/verify",
  },
  {
    source: AlertSource.C2PA,
    severity: AlertSeverity.LOW,
    title: "Provenance chain incomplete — 1 of 3 assertions valid",
    domain: "social-media.br",
    url: "https://social-media.br/post/12345",
  },
  {
    source: AlertSource.DLP,
    severity: AlertSeverity.LOW,
    title: "Phone number pattern in Copilot chat",
    domain: "copilot.microsoft.com",
    url: "https://copilot.microsoft.com/chat",
  },
  {
    source: AlertSource.PHISHING,
    severity: AlertSeverity.LOW,
    title: "Newly registered domain — age < 7 days",
    domain: "quick-offer.de",
    url: "https://quick-offer.de/promo",
  },
  {
    source: AlertSource.C2PA,
    severity: AlertSeverity.INFO,
    title: "C2PA manifest verified — authentic media",
    domain: "nytimes.com",
    url: "https://nytimes.com/2025/photo.jpg",
  },
  {
    source: AlertSource.DLP,
    severity: AlertSeverity.INFO,
    title: "DLP scan completed — no PII detected",
    domain: "perplexity.ai",
    url: "https://perplexity.ai/search",
  },
  {
    source: AlertSource.PHISHING,
    severity: AlertSeverity.INFO,
    title: "Page scanned — no threats detected",
    domain: "github.com",
    url: "https://github.com/sentinellium",
  },
];

/* ── Fleet Instances ── */

const SEED_FLEET = [
  {
    instanceId: "inst-001",
    hostname: "ws-analyst-01",
    browser: "Chrome 121",
    version: "0.1.0",
  },
  {
    instanceId: "inst-002",
    hostname: "ws-analyst-02",
    browser: "Edge 121",
    version: "0.1.0",
  },
  {
    instanceId: "inst-003",
    hostname: "ws-exec-01",
    browser: "Chrome 121",
    version: "0.1.0",
  },
  {
    instanceId: "inst-004",
    hostname: "ws-soc-01",
    browser: "Firefox 122",
    version: "0.1.0",
  },
  {
    instanceId: "inst-005",
    hostname: "ws-remote-01",
    browser: "Chrome 120",
    version: "0.0.9",
  },
  {
    instanceId: "inst-006",
    hostname: "ws-contractor-01",
    browser: "Edge 120",
    version: "0.0.8",
  },
];

/* ── Users ── */

const SEED_USERS = [
  {
    name: "Alex Reeves",
    email: "a.reeves@corp.io",
    role: "Admin" as const,
    mfaEnabled: true,
    status: "Active" as const,
    lastLogin: new Date(now - 3 * hour).toISOString(),
  },
  {
    name: "Jordan Martinez",
    email: "j.martinez@corp.io",
    role: "Analyst" as const,
    mfaEnabled: true,
    status: "Active" as const,
    lastLogin: new Date(now - 0.1 * hour).toISOString(),
  },
  {
    name: "Sophia Chen",
    email: "s.chen@corp.io",
    role: "Analyst" as const,
    mfaEnabled: true,
    status: "Active" as const,
    lastLogin: new Date(now - 12 * hour).toISOString(),
  },
  {
    name: "Michael Okafor",
    email: "m.okafor@corp.io",
    role: "Viewer" as const,
    mfaEnabled: false,
    status: "Active" as const,
    lastLogin: new Date(now - 5 * hour).toISOString(),
  },
  {
    name: "Taro Nakamura",
    email: "t.nakamura@corp.io",
    role: "Analyst" as const,
    mfaEnabled: true,
    status: "Active" as const,
    lastLogin: new Date(now - 4 * hour).toISOString(),
  },
];

/* ── Audit Log ── */

const SEED_AUDIT = [
  {
    timestamp: new Date(now - 0.1 * hour).toISOString(),
    actor: "j.martinez",
    action: "LOGIN",
    target: "Console",
    ipAddress: "10.0.2.15",
  },
  {
    timestamp: new Date(now - 0.3 * hour).toISOString(),
    actor: "j.martinez",
    action: "ALERT_DISMISSED",
    target: "alert-13",
    ipAddress: "10.0.2.15",
  },
  {
    timestamp: new Date(now - 0.8 * hour).toISOString(),
    actor: "s.chen",
    action: "REPORT_EXPORTED",
    target: "Executive Summary (JSON)",
    ipAddress: "10.0.3.42",
  },
  {
    timestamp: new Date(now - 1.2 * hour).toISOString(),
    actor: "a.reeves",
    action: "CONFIG_CHANGE",
    target: "DLP sensitivity → 85",
    ipAddress: "10.0.1.8",
  },
  {
    timestamp: new Date(now - 2 * hour).toISOString(),
    actor: "system",
    action: "SESSION_EXPIRED",
    target: "m.okafor",
    ipAddress: "—",
  },
  {
    timestamp: new Date(now - 3 * hour).toISOString(),
    actor: "a.reeves",
    action: "USER_CREATED",
    target: "t.nakamura",
    ipAddress: "10.0.1.8",
  },
  {
    timestamp: new Date(now - 3.5 * hour).toISOString(),
    actor: "a.reeves",
    action: "ROLE_CHANGED",
    target: "t.nakamura → Analyst",
    ipAddress: "10.0.1.8",
  },
  {
    timestamp: new Date(now - 4 * hour).toISOString(),
    actor: "t.nakamura",
    action: "MFA_ENABLED",
    target: "TOTP",
    ipAddress: "10.0.4.77",
  },
  {
    timestamp: new Date(now - 5 * hour).toISOString(),
    actor: "m.okafor",
    action: "LOGIN",
    target: "Console",
    ipAddress: "10.0.5.23",
  },
  {
    timestamp: new Date(now - 6 * hour).toISOString(),
    actor: "unknown",
    action: "LOGIN_FAILED",
    target: "Console",
    ipAddress: "203.0.113.42",
  },
  {
    timestamp: new Date(now - 7 * hour).toISOString(),
    actor: "s.chen",
    action: "ALERT_DISMISSED",
    target: "alert-10",
    ipAddress: "10.0.3.42",
  },
  {
    timestamp: new Date(now - 8 * hour).toISOString(),
    actor: "j.martinez",
    action: "CONFIG_CHANGE",
    target: "Phishing sensitivity → 70",
    ipAddress: "10.0.2.15",
  },
  {
    timestamp: new Date(now - 10 * hour).toISOString(),
    actor: "a.reeves",
    action: "REPORT_EXPORTED",
    target: "Executive Summary (Text)",
    ipAddress: "10.0.1.8",
  },
  {
    timestamp: new Date(now - 12 * hour).toISOString(),
    actor: "s.chen",
    action: "LOGIN",
    target: "Console",
    ipAddress: "10.0.3.42",
  },
  {
    timestamp: new Date(now - 14 * hour).toISOString(),
    actor: "system",
    action: "SESSION_EXPIRED",
    target: "j.martinez",
    ipAddress: "—",
  },
  {
    timestamp: new Date(now - 16 * hour).toISOString(),
    actor: "j.martinez",
    action: "LOGIN",
    target: "Console (SSO)",
    ipAddress: "10.0.2.15",
  },
  {
    timestamp: new Date(now - 18 * hour).toISOString(),
    actor: "a.reeves",
    action: "CONFIG_CHANGE",
    target: "Slack webhook updated",
    ipAddress: "10.0.1.8",
  },
  {
    timestamp: new Date(now - 20 * hour).toISOString(),
    actor: "m.okafor",
    action: "LOGOUT",
    target: "Console",
    ipAddress: "10.0.5.23",
  },
];

/* ── Seed Function ── */

/**
 * Seeds all engine singletons with demo data.
 * Called once at API startup. Safe to call multiple times (idempotent
 * due to AlertAggregator's dedup by URL + source).
 */
export function seed(): void {
  // Activate all engines
  dashboard.setEngineStatus("phishing", EngineStatus.ACTIVE);
  dashboard.setEngineStatus("c2pa", EngineStatus.ACTIVE);
  dashboard.setEngineStatus("dlp", EngineStatus.ACTIVE);

  // Ingest alerts through the real pipeline
  for (const alert of SEED_ALERTS) {
    ingestAlert(alert);
  }

  // Simulate page scans
  for (let i = 0; i < 2847; i++) {
    dashboard.recordScan();
  }

  // Register fleet instances
  for (const inst of SEED_FLEET) {
    fleet.register(inst);
  }
  // Mark one as stale, one as offline for realism
  fleet.markStale("inst-005");

  // Set connected count
  dashboard.setInstanceCount(fleet.getOnlineCount());

  // Seed users
  for (const u of SEED_USERS) {
    addUser(u);
  }

  // Seed audit log
  for (const a of SEED_AUDIT) {
    addAuditEntry(a);
  }
}
