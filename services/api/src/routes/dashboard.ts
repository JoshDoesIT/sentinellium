/**
 * @module Dashboard API
 * @description Endpoints for dashboard state, timeline, and geo data.
 * Wired to DashboardState, ThreatTimeline, and GeoMapper engines.
 */

import { Hono } from "hono";
import { TimeInterval } from "@sentinellium/engines";
import { dashboard, timeline, geo, getAllAlerts } from "../lib/state";

const app = new Hono();

/* ── Routes ── */

/** Get the full dashboard snapshot. */
app.get("/", (c) => {
  const snapshot = dashboard.getSnapshot();
  const alerts = getAllAlerts();
  const severityCounts = (() => {
    const counts: Record<string, number> = {};
    for (const a of alerts) {
      counts[a.severity] = (counts[a.severity] ?? 0) + 1;
    }
    return counts;
  })();

  return c.json({
    success: true,
    data: {
      ...snapshot,
      severityCounts,
    },
  });
});

/** Get 24h timeline buckets. */
app.get("/timeline", (c) => {
  const alerts = getAllAlerts();
  const buckets = timeline.bucket(alerts, TimeInterval.HOUR);
  const trend = timeline.getTrend(alerts);

  return c.json({
    success: true,
    data: { buckets, trend },
  });
});

/** Get geographic threat heatmap. */
app.get("/geo", (c) => {
  const alerts = getAllAlerts();
  const heatmap = geo.buildHeatmap(alerts);

  return c.json({
    success: true,
    data: heatmap,
  });
});

export default app;
