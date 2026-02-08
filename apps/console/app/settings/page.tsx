"use client";

import { useState } from "react";
import styles from "./settings.module.css";

/**
 * @module Settings Page
 * @description Configuration hub — security, notifications, compliance,
 * integrations, reports, and about.
 */

type Tab =
  | "security"
  | "notifications"
  | "compliance"
  | "integrations"
  | "reports"
  | "about";

const TABS: { key: Tab; label: string }[] = [
  { key: "security", label: "Security" },
  { key: "notifications", label: "Notifications" },
  { key: "compliance", label: "Compliance" },
  { key: "integrations", label: "Integrations" },
  { key: "reports", label: "Reports" },
  { key: "about", label: "About" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("security");

  return (
    <div className={styles["settings-page"]}>
      <header className="page-header">
        <h1 className="page-header__title">Settings</h1>
        <p className="page-header__subtitle">
          Configure security, notifications, compliance, and integrations
        </p>
      </header>

      {/* ── Tabs ── */}
      <div className={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles["tab--active"] : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Security ── */}
      {activeTab === "security" && (
        <div className={`card ${styles.section}`}>
          <h2 className={styles.section__title}>Security Settings</h2>
          <p className={styles.section__subtitle}>
            Session management, authentication, and access policies
          </p>

          <div className={styles["setting-row"]}>
            <div className={styles["setting-row__info"]}>
              <span className={styles["setting-row__label"]}>Enforce MFA</span>
              <span className={styles["setting-row__desc"]}>
                Require multi-factor authentication for all users
              </span>
            </div>
            <label className="toggle">
              <input type="checkbox" defaultChecked />
              <span className="toggle__track" />
            </label>
          </div>

          <div className={styles["setting-row"]}>
            <div className={styles["setting-row__info"]}>
              <span className={styles["setting-row__label"]}>
                Session Timeout
              </span>
              <span className={styles["setting-row__desc"]}>
                Automatically expire inactive sessions
              </span>
            </div>
            <select className="input" style={{ width: 120 }} defaultValue="30">
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="60">60 min</option>
              <option value="120">2 hours</option>
            </select>
          </div>

          <div className={styles["setting-row"]}>
            <div className={styles["setting-row__info"]}>
              <span className={styles["setting-row__label"]}>
                Password Policy
              </span>
              <span className={styles["setting-row__desc"]}>
                Minimum 12 characters, 1 uppercase, 1 number, 1 symbol
              </span>
            </div>
            <span className="badge badge--info">Enforced</span>
          </div>

          <div className={styles["setting-row"]}>
            <div className={styles["setting-row__info"]}>
              <span className={styles["setting-row__label"]}>IP Allowlist</span>
              <span className={styles["setting-row__desc"]}>
                Restrict console access to specific IP ranges
              </span>
            </div>
            <button className="btn btn--secondary">Configure</button>
          </div>
        </div>
      )}

      {/* ── Notifications ── */}
      {activeTab === "notifications" && (
        <div className={`card ${styles.section}`}>
          <h2 className={styles.section__title}>Notification Channels</h2>
          <p className={styles.section__subtitle}>
            Configure alert routing to Email, Slack, and webhook endpoints
          </p>

          <div className={styles["channel-cards"]}>
            <div className={`card ${styles["channel-card"]}`}>
              <span className={styles["channel-card__name"]}>Email</span>
              <span className={styles["channel-card__detail"]}>
                soc-team@corp.io
              </span>
              <span className={styles["channel-card__detail"]}>
                Min severity: <span className="badge badge--high">HIGH</span>
              </span>
              <button
                className="btn btn--secondary"
                style={{ marginTop: "auto" }}
              >
                Edit
              </button>
            </div>
            <div className={`card ${styles["channel-card"]}`}>
              <span className={styles["channel-card__name"]}>Slack</span>
              <span className={styles["channel-card__detail"]}>
                #sentinellium-alerts
              </span>
              <span className={styles["channel-card__detail"]}>
                Min severity:{" "}
                <span className="badge badge--medium">MEDIUM</span>
              </span>
              <button
                className="btn btn--secondary"
                style={{ marginTop: "auto" }}
              >
                Edit
              </button>
            </div>
            <div className={`card ${styles["channel-card"]}`}>
              <span className={styles["channel-card__name"]}>Webhook</span>
              <span className={styles["channel-card__detail"]}>
                https://siem.corp.io/ingest
              </span>
              <span className={styles["channel-card__detail"]}>
                Min severity:{" "}
                <span className="badge badge--critical">CRITICAL</span>
              </span>
              <button
                className="btn btn--secondary"
                style={{ marginTop: "auto" }}
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Compliance ── */}
      {activeTab === "compliance" && (
        <div className={`card ${styles.section}`}>
          <h2 className={styles.section__title}>Compliance Frameworks</h2>
          <p className={styles.section__subtitle}>
            Supported regulatory and industry compliance certifications
          </p>

          <div className={styles["compliance-badges"]}>
            <div className={`card ${styles["compliance-badge"]}`}>
              <span className={styles["compliance-badge__icon"]}>🛡</span>
              <span className={styles["compliance-badge__name"]}>SOC 2</span>
              <span className={styles["compliance-badge__status"]}>
                ✓ Compliant
              </span>
            </div>
            <div className={`card ${styles["compliance-badge"]}`}>
              <span className={styles["compliance-badge__icon"]}>🇪🇺</span>
              <span className={styles["compliance-badge__name"]}>GDPR</span>
              <span className={styles["compliance-badge__status"]}>
                ✓ Compliant
              </span>
            </div>
            <div className={`card ${styles["compliance-badge"]}`}>
              <span className={styles["compliance-badge__icon"]}>🏥</span>
              <span className={styles["compliance-badge__name"]}>HIPAA</span>
              <span className={styles["compliance-badge__status"]}>
                ✓ Compliant
              </span>
            </div>
            <div className={`card ${styles["compliance-badge"]}`}>
              <span className={styles["compliance-badge__icon"]}>💳</span>
              <span className={styles["compliance-badge__name"]}>PCI DSS</span>
              <span className={styles["compliance-badge__status"]}>
                ✓ Compliant
              </span>
            </div>
            <div className={`card ${styles["compliance-badge"]}`}>
              <span className={styles["compliance-badge__icon"]}>🔒</span>
              <span className={styles["compliance-badge__name"]}>
                ISO 27001
              </span>
              <span className={styles["compliance-badge__status"]}>
                ✓ Compliant
              </span>
            </div>
          </div>

          <div className={styles["setting-row"]}>
            <div className={styles["setting-row__info"]}>
              <span className={styles["setting-row__label"]}>
                Data Retention
              </span>
              <span className={styles["setting-row__desc"]}>
                Alert and audit log data retained for 90 days
              </span>
            </div>
            <select className="input" style={{ width: 120 }} defaultValue="90">
              <option value="30">30 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
              <option value="365">1 year</option>
            </select>
          </div>

          <div className={styles["setting-row"]}>
            <div className={styles["setting-row__info"]}>
              <span className={styles["setting-row__label"]}>Last Audit</span>
              <span className={styles["setting-row__desc"]}>
                Most recent compliance audit completed
              </span>
            </div>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-xs)",
                color: "var(--ash)",
              }}
            >
              Jan 15, 2026
            </span>
          </div>
        </div>
      )}

      {/* ── Integrations ── */}
      {activeTab === "integrations" && (
        <div className={`card ${styles.section}`}>
          <h2 className={styles.section__title}>Integrations</h2>
          <p className={styles.section__subtitle}>
            SSO provider configuration and API key management
          </p>

          <div className={styles["setting-row"]}>
            <div className={styles["setting-row__info"]}>
              <span className={styles["setting-row__label"]}>
                SSO Provider (SAML)
              </span>
              <span className={styles["setting-row__desc"]}>
                Azure Active Directory — configured
              </span>
            </div>
            <button className="btn btn--secondary">Configure</button>
          </div>

          <div className={styles["setting-row"]}>
            <div className={styles["setting-row__info"]}>
              <span className={styles["setting-row__label"]}>
                OAuth Provider
              </span>
              <span className={styles["setting-row__desc"]}>
                Google Workspace — configured
              </span>
            </div>
            <button className="btn btn--secondary">Configure</button>
          </div>

          <div className={styles["setting-row"]}>
            <div className={styles["setting-row__info"]}>
              <span className={styles["setting-row__label"]}>API Keys</span>
              <span className={styles["setting-row__desc"]}>
                Manage API keys for programmatic access
              </span>
            </div>
            <button className="btn btn--secondary">Manage Keys</button>
          </div>

          <div className={styles["setting-row"]}>
            <div className={styles["setting-row__info"]}>
              <span className={styles["setting-row__label"]}>SIEM Export</span>
              <span className={styles["setting-row__desc"]}>
                Forward alerts to external SIEM via syslog/webhook
              </span>
            </div>
            <button className="btn btn--secondary">Configure</button>
          </div>
        </div>
      )}

      {/* ── Reports ── */}
      {activeTab === "reports" && (
        <div className={`card ${styles.section}`}>
          <h2 className={styles.section__title}>Report Generation</h2>
          <p className={styles.section__subtitle}>
            Generate executive summaries and compliance reports
          </p>

          <div className={styles["report-actions"]}>
            <button className="btn btn--primary">
              ↓ Executive Summary (JSON)
            </button>
            <button className="btn btn--secondary">
              ↓ Executive Summary (Text)
            </button>
            <button className="btn btn--secondary">
              ↓ Compliance Report (PDF)
            </button>
          </div>

          <div className={styles["setting-row"]}>
            <div className={styles["setting-row__info"]}>
              <span className={styles["setting-row__label"]}>
                Scheduled Reports
              </span>
              <span className={styles["setting-row__desc"]}>
                Automatically generate and email weekly executive summaries
              </span>
            </div>
            <label className="toggle">
              <input type="checkbox" />
              <span className="toggle__track" />
            </label>
          </div>
        </div>
      )}

      {/* ── About ── */}
      {activeTab === "about" && (
        <div className={`card ${styles.section}`}>
          <h2 className={styles.section__title}>About Sentinellium</h2>
          <p className={styles.section__subtitle}>
            Intelligence at the edge. Privacy at the core.
          </p>

          <div className={styles["about-grid"]}>
            <div className={styles["about-item"]}>
              <span className={styles["about-item__label"]}>Version</span>
              <span className={styles["about-item__value"]}>0.1.0</span>
            </div>
            <div className={styles["about-item"]}>
              <span className={styles["about-item__label"]}>
                Context Engine
              </span>
              <span className={styles["about-item__value"]}>
                ONNX Runtime Web + WebGPU
              </span>
            </div>
            <div className={styles["about-item"]}>
              <span className={styles["about-item__label"]}>
                Provenance Engine
              </span>
              <span className={styles["about-item__value"]}>C2PA JS SDK</span>
            </div>
            <div className={styles["about-item"]}>
              <span className={styles["about-item__label"]}>DLP Engine</span>
              <span className={styles["about-item__value"]}>
                Presidio (WASM)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
