import styles from "./fleet.module.css";
import { fetchFleet, relativeTime } from "../lib/api";

/**
 * @module Fleet Page
 * @description Monitors all extension instances across the organization.
 * Shows online/stale/offline status with instance details.
 *
 * Fetches real fleet data from the Sentinellium API.
 */

export default async function FleetPage() {
  const fleetData = await fetchFleet();
  const instances = fleetData.instances;
  const online = instances.filter((i) => i.status === "ONLINE").length;
  const stale = instances.filter((i) => i.status === "STALE").length;
  const offline = instances.filter((i) => i.status === "OFFLINE").length;

  return (
    <div className={styles["fleet-page"]}>
      <header className="page-header">
        <h1 className="page-header__title">Fleet Management</h1>
        <p className="page-header__subtitle">
          Monitor all Sentinellium extension instances across your organization
        </p>
      </header>

      {/* ── Fleet Stats ── */}
      <div className={styles["fleet-stats"]}>
        <div className={`card ${styles["fleet-stat"]}`}>
          <span
            className={styles["fleet-stat__count"]}
            style={{ color: "var(--status-verified)" }}
          >
            {online}
          </span>
          <span className={styles["fleet-stat__label"]}>Online</span>
        </div>
        <div className={`card ${styles["fleet-stat"]}`}>
          <span
            className={styles["fleet-stat__count"]}
            style={{ color: "var(--status-unverified)" }}
          >
            {stale}
          </span>
          <span className={styles["fleet-stat__label"]}>Stale</span>
        </div>
        <div className={`card ${styles["fleet-stat"]}`}>
          <span
            className={styles["fleet-stat__count"]}
            style={{ color: "var(--severity-critical)" }}
          >
            {offline}
          </span>
          <span className={styles["fleet-stat__label"]}>Offline</span>
        </div>
        <div className={`card ${styles["fleet-stat"]}`}>
          <span
            className={styles["fleet-stat__count"]}
            style={{ color: "var(--sentinel-white)" }}
          >
            {instances.length}
          </span>
          <span className={styles["fleet-stat__label"]}>Total</span>
        </div>
      </div>

      {/* ── Instance Grid ── */}
      <div className={styles["instance-grid"]}>
        {instances.map((instance) => (
          <div
            key={instance.instanceId}
            className={`card ${styles["instance-card"]} ${styles[`instance-card--${instance.status.toLowerCase()}`]}`}
          >
            <div className={styles["instance-card__header"]}>
              <span className={styles["instance-card__hostname"]}>
                {instance.hostname}
              </span>
              <div className={styles["instance-card__status"]}>
                <span
                  className={`status-dot ${
                    instance.status === "ONLINE"
                      ? "status-dot--active"
                      : instance.status === "STALE"
                        ? "status-dot--stale"
                        : "status-dot--error"
                  }`}
                />
                {instance.status}
              </div>
            </div>
            <div className={styles["instance-card__detail"]}>
              <strong>Browser:</strong> {instance.browser}
            </div>
            <div className={styles["instance-card__detail"]}>
              <strong>Version:</strong> {instance.version}
            </div>
            <div className={styles["instance-card__detail"]}>
              <strong>Last seen:</strong> {relativeTime(instance.lastSeen)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
