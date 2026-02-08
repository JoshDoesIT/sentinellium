/**
 * @module Usage Statistics Tracker Tests
 * @description TDD tests for privacy-preserving usage statistics.
 * Tracks active time, pages scanned, features used, and engine uptime.
 * No URLs or page content are collected.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { UsageTracker, type UsageSnapshot } from "./usage-tracker";

describe("UsageTracker", () => {
    let tracker: UsageTracker;

    beforeEach(() => {
        tracker = new UsageTracker();
    });

    /* ── Page Scans ── */

    describe("recordPageScan", () => {
        it("increments total pages scanned", () => {
            tracker.recordPageScan("phishing");
            tracker.recordPageScan("c2pa");

            const snapshot = tracker.getSnapshot();
            expect(snapshot.pagesScanned).toBe(2);
        });

        it("tracks scans per engine", () => {
            tracker.recordPageScan("phishing");
            tracker.recordPageScan("phishing");
            tracker.recordPageScan("dlp");

            const snapshot = tracker.getSnapshot();
            expect(snapshot.scansByEngine.phishing).toBe(2);
            expect(snapshot.scansByEngine.dlp).toBe(1);
        });
    });

    /* ── Feature Usage ── */

    describe("recordFeatureUsed", () => {
        it("tracks unique features used", () => {
            tracker.recordFeatureUsed("phishing_toggle");
            tracker.recordFeatureUsed("dlp_anonymize");

            const snapshot = tracker.getSnapshot();
            expect(snapshot.featuresUsed).toContain("phishing_toggle");
            expect(snapshot.featuresUsed).toContain("dlp_anonymize");
        });

        it("deduplicates repeated feature uses", () => {
            tracker.recordFeatureUsed("phishing_toggle");
            tracker.recordFeatureUsed("phishing_toggle");

            const snapshot = tracker.getSnapshot();
            expect(snapshot.featuresUsed).toHaveLength(1);
        });
    });

    /* ── Engine Uptime ── */

    describe("engine uptime", () => {
        it("tracks engine activation", () => {
            tracker.markEngineActive("phishing");

            const snapshot = tracker.getSnapshot();
            expect(snapshot.activeEngines).toContain("phishing");
        });

        it("tracks engine deactivation", () => {
            tracker.markEngineActive("phishing");
            tracker.markEngineInactive("phishing");

            const snapshot = tracker.getSnapshot();
            expect(snapshot.activeEngines).not.toContain("phishing");
        });

        it("tracks multiple active engines", () => {
            tracker.markEngineActive("phishing");
            tracker.markEngineActive("c2pa");
            tracker.markEngineActive("dlp");

            const snapshot = tracker.getSnapshot();
            expect(snapshot.activeEngines).toHaveLength(3);
        });
    });

    /* ── Session Tracking ── */

    describe("session", () => {
        it("starts a session and records start time", () => {
            const before = Date.now();
            tracker.startSession();
            const snapshot = tracker.getSnapshot();

            expect(snapshot.sessionStartedAt).toBeGreaterThanOrEqual(before);
            expect(snapshot.sessionStartedAt).toBeLessThanOrEqual(Date.now());
        });

        it("calculates session duration", () => {
            vi.useFakeTimers();
            const start = new Date("2026-02-07T10:00:00Z");
            vi.setSystemTime(start);

            tracker.startSession();

            vi.advanceTimersByTime(60_000); // 1 minute

            const snapshot = tracker.getSnapshot();
            expect(snapshot.sessionDurationMs).toBe(60_000);

            vi.useRealTimers();
        });

        it("returns zero duration when no session started", () => {
            const snapshot = tracker.getSnapshot();
            expect(snapshot.sessionDurationMs).toBe(0);
        });
    });

    /* ── Snapshot ── */

    describe("getSnapshot", () => {
        it("returns a complete usage snapshot", () => {
            tracker.startSession();
            tracker.recordPageScan("phishing");
            tracker.recordFeatureUsed("c2pa_viewer");
            tracker.markEngineActive("dlp");

            const snapshot = tracker.getSnapshot();

            expect(snapshot.pagesScanned).toBe(1);
            expect(snapshot.featuresUsed).toContain("c2pa_viewer");
            expect(snapshot.activeEngines).toContain("dlp");
            expect(snapshot.sessionStartedAt).toBeGreaterThan(0);
        });

        it("returns independent copies (no shared references)", () => {
            tracker.recordFeatureUsed("test_feature");
            const snap1 = tracker.getSnapshot();
            const snap2 = tracker.getSnapshot();

            snap1.featuresUsed.push("injected");
            expect(snap2.featuresUsed).not.toContain("injected");
        });
    });
});
