import styles from "./geo.module.css";
import { fetchGeoHeatmap } from "../lib/api";

/**
 * @module Geo Map Page
 * @description Geographic threat intelligence — region heatmap
 * ranked by threat origin count.
 *
 * Fetches real geographic data from the Sentinellium API.
 */

export default async function GeoPage() {
  const heatmap = await fetchGeoHeatmap();
  const sorted = [...heatmap].sort((a, b) => b.count - a.count);
  const total = sorted.reduce((s, e) => s + e.count, 0);
  const maxCount = sorted[0]?.count ?? 1;
  const top3 = sorted.slice(0, 3);

  return (
    <div className={styles["geo-page"]}>
      <header className="page-header">
        <h1 className="page-header__title">Geographic Intelligence</h1>
        <p className="page-header__subtitle">
          Threat origin analysis by TLD region
        </p>
      </header>

      {/* ── Top 3 Regions ── */}
      <div className={styles["top-regions"]}>
        {top3.map((entry, i) => (
          <div key={entry.region} className={`card ${styles["top-region"]}`}>
            <span className={styles["top-region__rank"]}>#{i + 1}</span>
            <span className={styles["top-region__name"]}>{entry.region}</span>
            <span className={styles["top-region__count"]}>{entry.count}</span>
            <span className={styles["top-region__pct"]}>
              {total > 0 ? Math.round((entry.count / total) * 100) : 0}% of
              total threats
            </span>
          </div>
        ))}
      </div>

      {/* ── Full Heatmap ── */}
      <div className={`card ${styles["heatmap-section"]}`}>
        <span className={styles["heatmap-section__title"]}>
          All Regions by Threat Volume
        </span>
        {sorted.map((entry, i) => (
          <div
            key={entry.region}
            className={styles["heatmap-row"]}
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <span className={styles["heatmap-row__ordinal"]}>{i + 1}</span>
            <span className={styles["heatmap-row__region"]}>
              {entry.region}
            </span>
            <div className={styles["heatmap-row__bar-track"]}>
              <div
                className={styles["heatmap-row__bar-fill"]}
                style={{
                  width: `${(entry.count / maxCount) * 100}%`,
                  animationDelay: `${i * 40}ms`,
                }}
              />
            </div>
            <span className={styles["heatmap-row__count"]}>{entry.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
