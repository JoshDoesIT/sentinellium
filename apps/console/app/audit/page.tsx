"use client";

import { useState, useMemo, useEffect } from "react";
import styles from "./audit.module.css";
import { formatTime, type AuditEntry } from "../lib/api";

/**
 * @module Audit Log Page
 * @description Full compliance trail with actor, action, target, and IP tracking.
 * Supports filtering by actor and action type.
 *
 * Fetches real audit data from the Sentinellium API.
 */

const API_BASE = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000";

type AuditAction =
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

const ACTION_TYPES: AuditAction[] = [
  "LOGIN",
  "LOGIN_FAILED",
  "LOGOUT",
  "CONFIG_CHANGE",
  "ALERT_DISMISSED",
  "REPORT_EXPORTED",
  "USER_CREATED",
  "ROLE_CHANGED",
  "MFA_ENABLED",
  "SESSION_EXPIRED",
];

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<AuditAction | "ALL">("ALL");

  useEffect(() => {
    fetch(`${API_BASE}/api/audit`, {
      headers: { "Content-Type": "application/json" },
    })
      .then((r) => r.json())
      .then((json) => {
        setEntries(json.data ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = [...entries];
    if (actionFilter !== "ALL") {
      result = result.filter((e) => e.action === actionFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.actor.toLowerCase().includes(q) ||
          e.target.toLowerCase().includes(q),
      );
    }
    return result;
  }, [entries, actionFilter, search]);

  const handleExportCsv = () => {
    const header = "Timestamp,Actor,Action,Target,IP Address";
    const rows = filtered.map(
      (e) => `${e.timestamp},${e.actor},${e.action},${e.target},${e.ipAddress}`,
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sentinellium-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className={styles["audit-page"]}>
        <header className="page-header">
          <h1 className="page-header__title">Audit Log</h1>
          <p className="page-header__subtitle">Loading audit entries…</p>
        </header>
      </div>
    );
  }

  return (
    <div className={styles["audit-page"]}>
      <header className="page-header">
        <h1 className="page-header__title">Audit Log</h1>
        <p className="page-header__subtitle">
          Compliance-ready record of all platform actions
        </p>
      </header>

      {/* ── Toolbar ── */}
      <div className={styles["audit-toolbar"]}>
        <input
          type="text"
          className={`input ${styles["audit-toolbar__search"]}`}
          placeholder="Search actor or target…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input"
          style={{ maxWidth: 200 }}
          value={actionFilter}
          onChange={(e) =>
            setActionFilter(e.target.value as AuditAction | "ALL")
          }
        >
          <option value="ALL">All actions</option>
          {ACTION_TYPES.map((a) => (
            <option key={a} value={a}>
              {a.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <div style={{ flex: 1 }} />
        <button className="btn btn--secondary" onClick={handleExportCsv}>
          ↓ Export CSV
        </button>
      </div>

      {/* ── Audit Table ── */}
      <table className="data-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Actor</th>
            <th>Action</th>
            <th>Target</th>
            <th>IP Address</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((entry) => (
            <tr key={entry.id}>
              <td className="col-mono">{formatTime(entry.timestamp)}</td>
              <td>{entry.actor}</td>
              <td>
                <span
                  className={`${styles["action-badge"]} ${styles[`action-badge--${entry.action.toLowerCase()}`]}`}
                >
                  {entry.action.replace(/_/g, " ")}
                </span>
              </td>
              <td>{entry.target}</td>
              <td className="col-mono">{entry.ipAddress}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={styles["export-row"]}>
        <span
          className="col-mono"
          style={{ fontSize: "var(--text-xs)", color: "var(--smoke)" }}
        >
          {filtered.length} entries
        </span>
      </div>
    </div>
  );
}
