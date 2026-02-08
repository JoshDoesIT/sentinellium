/**
 * @module Web Vitals Profiler Tests
 * @description TDD tests for console performance profiling (Core Web Vitals).
 */
import { describe, it, expect, beforeEach } from "vitest";
import { WebVitalsProfiler } from "./web-vitals-profiler";

describe("WebVitalsProfiler", () => {
  let profiler: WebVitalsProfiler;

  beforeEach(() => {
    profiler = new WebVitalsProfiler();
  });

  describe("recordVitals", () => {
    it("records Core Web Vitals for a page", () => {
      profiler.recordVitals({
        page: "/dashboard",
        lcp: 2100,
        fid: 45,
        cls: 0.03,
        ttfb: 320,
      });

      expect(profiler.getRecordings()).toHaveLength(1);
    });
  });

  describe("getAverages", () => {
    it("computes averages across recordings", () => {
      profiler.recordVitals({
        page: "/a",
        lcp: 2000,
        fid: 40,
        cls: 0.02,
        ttfb: 300,
      });
      profiler.recordVitals({
        page: "/b",
        lcp: 3000,
        fid: 60,
        cls: 0.04,
        ttfb: 400,
      });

      const avg = profiler.getAverages();
      expect(avg.lcp).toBe(2500);
      expect(avg.fid).toBe(50);
      expect(avg.cls).toBeCloseTo(0.03);
    });
  });

  describe("gradeVitals", () => {
    it("grades vitals as good/needs-improvement/poor", () => {
      profiler.recordVitals({
        page: "/fast",
        lcp: 1500,
        fid: 50,
        cls: 0.05,
        ttfb: 200,
      });

      const grade = profiler.gradeVitals(profiler.getRecordings()[0]!);
      expect(grade.lcp).toBe("good");
    });
  });

  describe("getSlowestPages", () => {
    it("returns pages ranked by LCP", () => {
      profiler.recordVitals({
        page: "/fast",
        lcp: 1000,
        fid: 30,
        cls: 0.01,
        ttfb: 100,
      });
      profiler.recordVitals({
        page: "/slow",
        lcp: 5000,
        fid: 200,
        cls: 0.25,
        ttfb: 800,
      });

      const slowest = profiler.getSlowestPages(1);
      expect(slowest[0]!.page).toBe("/slow");
    });
  });
});
