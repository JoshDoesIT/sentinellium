/**
 * @module Geo Mapper Tests
 * @description TDD tests for geographic threat mapping.
 * Maps domains to approximate regions and builds heatmap data.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { GeoMapper } from "./geo-mapper";
import {
  AlertSource,
  AlertSeverity,
  type UnifiedAlert,
} from "./alert-aggregator";

const makeAlert = (domain: string): UnifiedAlert => ({
  id: `alert-${domain}`,
  source: AlertSource.PHISHING,
  severity: AlertSeverity.HIGH,
  title: `Alert on ${domain}`,
  domain,
  url: `https://${domain}`,
  timestamp: new Date().toISOString(),
});

describe("Geo Mapper", () => {
  let mapper: GeoMapper;

  beforeEach(() => {
    mapper = new GeoMapper();
  });

  /* ── Initialization ── */

  describe("initialization", () => {
    it("creates an instance", () => {
      expect(mapper).toBeInstanceOf(GeoMapper);
    });
  });

  /* ── TLD to Region ── */

  describe("TLD to region mapping", () => {
    it("maps .ru to Russia", () => {
      const region = mapper.getRegion("evil.ru");
      expect(region).toBe("Russia");
    });

    it("maps .cn to China", () => {
      const region = mapper.getRegion("site.cn");
      expect(region).toBe("China");
    });

    it("maps .com to Global", () => {
      const region = mapper.getRegion("example.com");
      expect(region).toBe("Global");
    });

    it("maps .de to Germany", () => {
      const region = mapper.getRegion("site.de");
      expect(region).toBe("Germany");
    });
  });

  /* ── Heatmap Data ── */

  describe("heatmap data", () => {
    it("aggregates alerts by region", () => {
      const alerts = [
        makeAlert("evil.ru"),
        makeAlert("phish.ru"),
        makeAlert("scam.cn"),
        makeAlert("bad.com"),
      ];

      const heatmap = mapper.buildHeatmap(alerts);
      expect(heatmap.find((h) => h.region === "Russia")?.count).toBe(2);
      expect(heatmap.find((h) => h.region === "China")?.count).toBe(1);
    });

    it("sorts regions by count descending", () => {
      const alerts = [makeAlert("a.ru"), makeAlert("b.ru"), makeAlert("c.cn")];

      const heatmap = mapper.buildHeatmap(alerts);
      expect(heatmap[0]?.region).toBe("Russia");
    });
  });

  /* ── Empty Input ── */

  describe("empty input", () => {
    it("handles empty alerts", () => {
      const heatmap = mapper.buildHeatmap([]);
      expect(heatmap).toHaveLength(0);
    });
  });
});
