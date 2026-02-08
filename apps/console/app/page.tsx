import styles from "./page.module.css";
import Link from "next/link";
import {
  fetchDashboard,
  fetchAlerts,
  fetchTimeline,
  relativeTime,
  ENGINE_HEALTH_MAP,
  type AlertSeverity,
} from "./lib/api";

/**
 * @module Overview Dashboard
 * @description SOC command center — hero metrics, engine health,
 * threat sparkline, severity breakdown, recent alerts.
 *
 * This page fetches real data from the Sentinellium API at render time.
 */

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "var(--severity-critical)",
  HIGH: "var(--severity-high)",
  MEDIUM: "var(--severity-medium)",
  LOW: "var(--severity-low)",
  INFO: "var(--sentinel-cyan)",
};

export default async function OverviewPage() {
  const [dashboard, alertsResult, timelineData] = await Promise.all([
    fetchDashboard(),
    fetchAlerts({ pageSize: 5 }),
    fetchTimeline(),
  ]);

  const recent = alertsResult.items;
  const buckets = timelineData.buckets;
  const maxBucket = Math.max(...buckets.map((b) => b.count), 1);

  // Build engine health cards from API engine state
  const engineCards = Object.entries(dashboard.engines).map(
    ([key, status]) => ({
      key,
      name: ENGINE_HEALTH_MAP[key]?.name ?? key,
      description: ENGINE_HEALTH_MAP[key]?.description ?? "",
      status,
    }),
  );

  return (
    <div className={styles.overview}>
      <header className="page-header">
        <h1 className="page-header__title">Threat Overview</h1>
        <p className="page-header__subtitle">
          Real-time security posture across all engines
        </p>
      </header>

      {/* ── Hero Metrics ── */}
      <section className={styles.metrics}>
        <div className={`card ${styles.metric}`}>
          <span className={styles.metric__label}>Total Alerts</span>
          <span
            className={`${styles.metric__value} ${styles["metric__value--cyan"]}`}
          >
            {dashboard.totalAlerts}
          </span>
        </div>
        <div className={`card ${styles.metric}`}>
          <span className={styles.metric__label}>Threats Blocked</span>
          <span
            className={`${styles.metric__value} ${styles["metric__value--green"]}`}
          >
            {dashboard.threatsBlocked}
          </span>
        </div>
        <div className={`card ${styles.metric}`}>
          <span className={styles.metric__label}>Pages Scanned</span>
          <span
            className={`${styles.metric__value} ${styles["metric__value--white"]}`}
          >
            {dashboard.pagesScanned.toLocaleString()}
          </span>
        </div>
        <div className={`card ${styles.metric}`}>
          <span className={styles.metric__label}>Fleet Online</span>
          <span
            className={`${styles.metric__value} ${styles["metric__value--blue"]}`}
          >
            {dashboard.connectedInstances}
          </span>
        </div>
      </section>

      {/* ── Engine Health + Sparkline ── */}
      <section className={styles["grid-2"]}>
        <div className="card">
          <div className={styles["engine-list"]}>
            {engineCards.map((engine) => (
              <div key={engine.key} className={styles["engine-card"]}>
                <div className={styles["engine-card__info"]}>
                  <div className={styles["engine-card__name"]}>
                    {engine.name}
                  </div>
                  <div className={styles["engine-card__desc"]}>
                    {engine.description}
                  </div>
                </div>
                <div className={styles["engine-card__status"]}>
                  <span
                    className={`status-dot ${
                      engine.status === "ACTIVE"
                        ? "status-dot--active"
                        : engine.status === "ERROR"
                          ? "status-dot--error"
                          : "status-dot--inactive"
                    }`}
                  />
                  {engine.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`card ${styles["spark-section"]}`}>
          <span className={styles["spark-section__title"]}>
            Threat Activity (24h)
          </span>
          <div className={styles.sparkline}>
            {buckets.map((bucket, i) => (
              <div
                key={i}
                className={styles.sparkline__bar}
                style={{
                  height: `${Math.max((bucket.count / maxBucket) * 100, 3)}%`,
                  animationDelay: `${i * 20}ms`,
                }}
                title={`${bucket.count} alerts`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Severity Breakdown + Recent ── */}
      <section className={styles["grid-2"]}>
        <div className={`card ${styles["severity-section"]}`}>
          <span className={styles["severity-section__title"]}>
            Severity Distribution
          </span>
          <div className={styles["severity-bars"]}>
            {(
              ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"] as AlertSeverity[]
            ).map((sev) => {
              const count = dashboard.severityCounts[sev] ?? 0;
              const total = dashboard.totalAlerts || 1;
              const pct = (count / total) * 100;
              return (
                <div key={sev} className={styles["severity-row"]}>
                  <span className={styles["severity-row__label"]}>
                    <span className={`badge badge--${sev.toLowerCase()}`}>
                      {sev}
                    </span>
                  </span>
                  <div className={styles["severity-row__bar-track"]}>
                    <div
                      className={styles["severity-row__bar-fill"]}
                      style={{
                        width: `${pct}%`,
                        background: SEVERITY_COLORS[sev],
                      }}
                    />
                  </div>
                  <span className={styles["severity-row__count"]}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className={`card ${styles["recent-section"]}`}>
          <div className={styles["recent-section__header"]}>
            <span className={styles["recent-section__title"]}>
              Recent Alerts
            </span>
            <Link href="/alerts" className="btn btn--ghost">
              View all →
            </Link>
          </div>
          <div className={styles["recent-list"]}>
            {recent.map((alert, i) => (
              <div
                key={alert.id}
                className={styles["recent-item"]}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <span
                  className={`badge badge--${alert.severity.toLowerCase()}`}
                >
                  {alert.severity}
                </span>
                <span className={styles["recent-item__title"]}>
                  {alert.title}
                </span>
                <span className={styles["recent-item__domain"]}>
                  {alert.domain}
                </span>
                <span className={styles["recent-item__time"]}>
                  {relativeTime(alert.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
