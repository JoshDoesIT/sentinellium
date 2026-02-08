/**
 * @module Geo Mapper
 * @description Maps domains to geographic regions using TLD analysis.
 * Builds heatmap data for the geographic threat map.
 */
import { type UnifiedAlert } from "./alert-aggregator";

/* ── Types ── */

/** Heatmap entry. */
export interface HeatmapEntry {
  region: string;
  count: number;
}

/* ── Constants ── */

/** TLD to region mapping. */
const TLD_REGIONS: Record<string, string> = {
  ru: "Russia",
  cn: "China",
  ir: "Iran",
  kp: "North Korea",
  br: "Brazil",
  in: "India",
  de: "Germany",
  uk: "United Kingdom",
  fr: "France",
  jp: "Japan",
  kr: "South Korea",
  au: "Australia",
  ca: "Canada",
  nl: "Netherlands",
  se: "Sweden",
  ng: "Nigeria",
  za: "South Africa",
  mx: "Mexico",
};

/* ── Mapper ── */

/**
 * Maps domains to regions and builds geographic threat data.
 */
export class GeoMapper {
  /**
   * Get the region for a domain based on TLD.
   *
   * @param domain - The domain to classify
   * @returns Region name (or "Global" for generic TLDs)
   */
  getRegion(domain: string): string {
    const tld = domain.split(".").pop()?.toLowerCase() ?? "";
    return TLD_REGIONS[tld] ?? "Global";
  }

  /**
   * Build heatmap data from alerts.
   * Aggregates by region and sorts by count descending.
   *
   * @param alerts - Alerts to aggregate
   * @returns Heatmap entries sorted by count
   */
  buildHeatmap(alerts: readonly UnifiedAlert[]): HeatmapEntry[] {
    if (alerts.length === 0) return [];

    const counts = new Map<string, number>();
    for (const alert of alerts) {
      const region = this.getRegion(alert.domain);
      counts.set(region, (counts.get(region) ?? 0) + 1);
    }

    return [...counts.entries()]
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count);
  }
}
