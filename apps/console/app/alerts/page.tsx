"use client";

import { useState, useMemo, useEffect } from "react";
import styles from "./alerts.module.css";
import {
  relativeTime,
  type AlertSource,
  type AlertSeverity,
  type UnifiedAlert,
} from "../lib/api";

/**
 * @module Alerts Page
 * @description Threat investigation table with filtering, search, pagination,
 * and slide-out detail panel.
 *
 * Fetches real alert data from the Sentinellium API.
 */

const API_BASE = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000";
const SOURCES: AlertSource[] = ["PHISHING", "C2PA", "DLP"];
const SEVERITIES: AlertSeverity[] = [
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "LOW",
  "INFO",
];
const PAGE_SIZE = 10;

const SOURCE_LABELS: Record<AlertSource, string> = {
  PHISHING: "Phishing Detection",
  C2PA: "Deepfake Defense",
  DLP: "Data Loss Prevention",
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<UnifiedAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<AlertSource | null>(null);
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | "ALL">(
    "ALL",
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<UnifiedAlert | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/alerts?pageSize=100`, {
      headers: { "Content-Type": "application/json" },
    })
      .then((r) => r.json())
      .then((json) => {
        setAlerts(json.data?.items ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = [...alerts];
    if (sourceFilter) {
      result = result.filter((a) => a.source === sourceFilter);
    }
    if (severityFilter !== "ALL") {
      result = result.filter((a) => a.severity === severityFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.domain.toLowerCase().includes(q),
      );
    }
    return result;
  }, [alerts, sourceFilter, severityFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) {
    return (
      <div className={styles["alerts-page"]}>
        <header className="page-header">
          <h1 className="page-header__title">Alert Feed</h1>
          <p className="page-header__subtitle">Loading alerts…</p>
        </header>
      </div>
    );
  }

  return (
    <div className={styles["alerts-page"]}>
      <header className="page-header">
        <h1 className="page-header__title">Alert Feed</h1>
        <p className="page-header__subtitle">
          Investigate and triage unified alerts from all engines
        </p>
      </header>

      {/* ── Filter Bar ── */}
      <div className={styles["filter-bar"]}>
        <input
          type="text"
          className={`input ${styles["filter-bar__search"]}`}
          placeholder="Search alerts…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <div className={styles["filter-bar__chips"]}>
          {SOURCES.map((s) => (
            <button
              key={s}
              className={`chip ${sourceFilter === s ? "chip--active" : ""}`}
              onClick={() => {
                setSourceFilter(sourceFilter === s ? null : s);
                setPage(1);
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <select
          className={styles["filter-bar__select"]}
          value={severityFilter}
          onChange={(e) => {
            setSeverityFilter(e.target.value as AlertSeverity | "ALL");
            setPage(1);
          }}
        >
          <option value="ALL">All severities</option>
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* ── Alert Table ── */}
      {paginated.length > 0 ? (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Title</th>
                <th>Domain</th>
                <th>Source</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((alert) => (
                <tr
                  key={alert.id}
                  className={`${styles["alert-row"]} ${selected?.id === alert.id ? styles["alert-row--selected"] : ""}`}
                  onClick={() => setSelected(alert)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && setSelected(alert)}
                >
                  <td>
                    <span
                      className={`badge badge--${alert.severity.toLowerCase()}`}
                    >
                      {alert.severity}
                    </span>
                  </td>
                  <td>{alert.title}</td>
                  <td className="col-mono">{alert.domain}</td>
                  <td>{alert.source}</td>
                  <td className="col-mono">{relativeTime(alert.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ── Pagination ── */}
          <div className={styles.pagination}>
            <span className={styles.pagination__info}>
              {filtered.length} alert{filtered.length !== 1 ? "s" : ""} · Page{" "}
              {page} of {totalPages}
            </span>
            <div className={styles.pagination__controls}>
              <button
                className="btn btn--secondary"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                ← Prev
              </button>
              <button
                className="btn btn--secondary"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next →
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className={styles["empty-state"]}>
          <div className={styles["empty-state__icon"]}>⊘</div>
          <div className={styles["empty-state__text"]}>
            No alerts match your filters
          </div>
        </div>
      )}

      {/* ── Detail Panel ── */}
      {selected && (
        <div
          className={styles["detail-overlay"]}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
          role="dialog"
          aria-label="Alert detail"
        >
          <div className={styles["detail-panel"]}>
            <div className={styles["detail-panel__header"]}>
              <h2 className={styles["detail-panel__title"]}>
                {selected.title}
              </h2>
              <button
                className={styles["detail-panel__close"]}
                onClick={() => setSelected(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className={styles["detail-panel__field"]}>
              <span className={styles["detail-panel__label"]}>Severity</span>
              <span className={styles["detail-panel__value"]}>
                <span
                  className={`badge badge--${selected.severity.toLowerCase()}`}
                >
                  {selected.severity}
                </span>
              </span>
            </div>

            <div className={styles["detail-panel__field"]}>
              <span className={styles["detail-panel__label"]}>Engine</span>
              <span className={styles["detail-panel__value"]}>
                {SOURCE_LABELS[selected.source]}
              </span>
            </div>

            <div className={styles["detail-panel__field"]}>
              <span className={styles["detail-panel__label"]}>Domain</span>
              <span
                className={`${styles["detail-panel__value"]} ${styles["detail-panel__value--mono"]}`}
              >
                {selected.domain}
              </span>
            </div>

            <div className={styles["detail-panel__field"]}>
              <span className={styles["detail-panel__label"]}>
                Context Summary
              </span>
              <span className={styles["detail-panel__value"]}>
                {selected.severity} {SOURCE_LABELS[selected.source]} alert on{" "}
                {selected.domain}: {selected.title}
              </span>
            </div>

            <div className={styles["detail-panel__field"]}>
              <span className={styles["detail-panel__label"]}>Evidence</span>
              <a
                href={selected.url}
                className={styles["detail-panel__evidence"]}
                target="_blank"
                rel="noopener noreferrer"
              >
                Original URL →
              </a>
            </div>

            <div className={styles["detail-panel__field"]}>
              <span className={styles["detail-panel__label"]}>Timestamp</span>
              <span
                className={`${styles["detail-panel__value"]} ${styles["detail-panel__value--mono"]}`}
              >
                {selected.timestamp}
              </span>
            </div>

            <div className={styles["detail-panel__field"]}>
              <span className={styles["detail-panel__label"]}>Alert ID</span>
              <span
                className={`${styles["detail-panel__value"]} ${styles["detail-panel__value--mono"]}`}
              >
                {selected.id}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
