import styles from "./timeline.module.css";
import { fetchTimeline, fetchDashboard, fetchAlertsBySource } from "../lib/api";

/**
 * @module Timeline Page
 * @description Temporal threat analysis — 24h bar chart, trend indicator,
 * and source breakdown.
 *
 * Fetches real timeline data from the Sentinellium API.
 */

export default async function TimelinePage() {
  const [timelineData, dashboard, bySource] = await Promise.all([
    fetchTimeline(),
    fetchDashboard(),
    fetchAlertsBySource(),
  ]);

  const buckets = timelineData.buckets;
  const maxCount = Math.max(...buckets.map((b) => b.count), 1);
  const trend = timelineData.trend;

  const trendDir = trend.direction;
  const trendLabel =
    trendDir === "up"
      ? "Increasing"
      : trendDir === "down"
        ? "Decreasing"
        : "Stable";
  const trendArrow = trendDir === "up" ? "↑" : trendDir === "down" ? "↓" : "→";

  const totalAlerts = dashboard.totalAlerts;

  const sourceColors: Record<string, string> = {
    PHISHING: "var(--sentinel-cyan)",
    C2PA: "var(--status-verified)",
    DLP: "hsl(260, 80%, 60%)",
  };

  return (
    <div className={styles["timeline-page"]}>
      <header className="page-header">
        <h1 className="page-header__title">Threat Timeline</h1>
        <p className="page-header__subtitle">
          Temporal analysis of threat activity across all engines
        </p>
      </header>

      {/* ── Trend Hero ── */}
      <div className={`card ${styles["trend-hero"]}`}>
        <span
          className={`${styles["trend-hero__arrow"]} ${styles[`trend-hero__arrow--${trendDir}`]}`}
        >
          {trendArrow}
        </span>
        <div className={styles["trend-hero__info"]}>
          <span className={styles["trend-hero__label"]}>
            Threat Trend: {trendLabel}
          </span>
          <span className={styles["trend-hero__detail"]}>
            Comparing last 12 hours vs previous 12 hours
          </span>
          <span className={styles["trend-hero__counts"]}>
            Recent: {trend.recentCount} · Previous: {trend.previousCount}
          </span>
        </div>
      </div>

      {/* ── 24h Bar Chart ── */}
      <div className={`card ${styles["chart-section"]}`}>
        <span className={styles["chart-section__title"]}>
          Hourly Threat Activity (24h)
        </span>
        <div className={styles["bar-chart"]}>
          {buckets.map((bucket, i) => (
            <div
              key={i}
              className={styles["bar-chart__bar"]}
              style={{
                height: `${Math.max((bucket.count / maxCount) * 100, 3)}%`,
                background:
                  bucket.count > maxCount * 0.7
                    ? "var(--severity-high)"
                    : "var(--sentinel-cyan-dim)",
                animationDelay: `${i * 25}ms`,
              }}
              data-count={bucket.count}
            />
          ))}
        </div>
        <div className={styles["bar-chart__labels"]}>
          {buckets.map((bucket, i) => (
            <span key={i} className={styles["bar-chart__label"]}>
              {i % 4 === 0
                ? new Date(bucket.start).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    hour12: true,
                  })
                : ""}
            </span>
          ))}
        </div>
      </div>

      {/* ── Source Breakdown ── */}
      <div className={`card ${styles["source-section"]}`}>
        <span className={styles["source-section__title"]}>
          Alert Distribution by Engine
        </span>
        {(["PHISHING", "C2PA", "DLP"] as const).map((source) => {
          const count = bySource[source] ?? 0;
          const pct = totalAlerts > 0 ? (count / totalAlerts) * 100 : 0;
          return (
            <div key={source} className={styles["source-row"]}>
              <span className={styles["source-row__label"]}>{source}</span>
              <div className={styles["source-row__bar-track"]}>
                <div
                  className={styles["source-row__bar-fill"]}
                  style={{
                    width: `${pct}%`,
                    background: sourceColors[source],
                  }}
                />
              </div>
              <span className={styles["source-row__count"]}>{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
