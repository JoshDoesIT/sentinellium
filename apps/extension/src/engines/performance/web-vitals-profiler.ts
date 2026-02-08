/**
 * @module Web Vitals Profiler
 * @description Console performance profiling with Core Web Vitals.
 * Records, averages, grades, and ranks page performance.
 */

/* ── Types ── */

export interface VitalsRecording {
  page: string;
  lcp: number;
  fid: number;
  cls: number;
  ttfb: number;
}

export interface VitalsAverage {
  lcp: number;
  fid: number;
  cls: number;
  ttfb: number;
}

export type VitalGrade = "good" | "needs-improvement" | "poor";

export interface VitalsGrade {
  lcp: VitalGrade;
  fid: VitalGrade;
  cls: VitalGrade;
  ttfb: VitalGrade;
}

/* ── Profiler ── */

/**
 * Core Web Vitals profiler.
 */
export class WebVitalsProfiler {
  private readonly recordings: VitalsRecording[] = [];

  /** Record vitals for a page. */
  recordVitals(recording: VitalsRecording): void {
    this.recordings.push(recording);
  }

  /** Get all recordings. */
  getRecordings(): VitalsRecording[] {
    return [...this.recordings];
  }

  /** Compute averages across all recordings. */
  getAverages(): VitalsAverage {
    const count = this.recordings.length;
    if (count === 0) return { lcp: 0, fid: 0, cls: 0, ttfb: 0 };

    const sum = this.recordings.reduce(
      (acc, r) => ({
        lcp: acc.lcp + r.lcp,
        fid: acc.fid + r.fid,
        cls: acc.cls + r.cls,
        ttfb: acc.ttfb + r.ttfb,
      }),
      { lcp: 0, fid: 0, cls: 0, ttfb: 0 },
    );

    return {
      lcp: sum.lcp / count,
      fid: sum.fid / count,
      cls: sum.cls / count,
      ttfb: sum.ttfb / count,
    };
  }

  /** Grade vitals for a recording. */
  gradeVitals(recording: VitalsRecording): VitalsGrade {
    return {
      lcp: this.gradeLcp(recording.lcp),
      fid: this.gradeFid(recording.fid),
      cls: this.gradeCls(recording.cls),
      ttfb: this.gradeTtfb(recording.ttfb),
    };
  }

  /** Get slowest pages by LCP. */
  getSlowestPages(limit: number): VitalsRecording[] {
    return [...this.recordings].sort((a, b) => b.lcp - a.lcp).slice(0, limit);
  }

  private gradeLcp(value: number): VitalGrade {
    if (value <= 2500) return "good";
    if (value <= 4000) return "needs-improvement";
    return "poor";
  }

  private gradeFid(value: number): VitalGrade {
    if (value <= 100) return "good";
    if (value <= 300) return "needs-improvement";
    return "poor";
  }

  private gradeCls(value: number): VitalGrade {
    if (value <= 0.1) return "good";
    if (value <= 0.25) return "needs-improvement";
    return "poor";
  }

  private gradeTtfb(value: number): VitalGrade {
    if (value <= 800) return "good";
    if (value <= 1800) return "needs-improvement";
    return "poor";
  }
}
