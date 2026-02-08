/**
 * @module Retention Manager Tests
 * @description TDD tests for telemetry data lifecycle management.
 * Configurable retention periods, automatic cleanup, and quota enforcement.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { RetentionManager, type RetentionPolicy } from "./retention-manager";
import { TelemetryCategory, type RecordedEvent } from "./telemetry-collector";

/** Helper to create events at specific timestamps. */
function makeEvent(timestamp: number, overrides?: Partial<RecordedEvent>): RecordedEvent {
    return {
        category: TelemetryCategory.SCAN,
        action: "page_scanned",
        engine: "phishing",
        timestamp,
        ...overrides,
    };
}

describe("RetentionManager", () => {
    let manager: RetentionManager;

    beforeEach(() => {
        manager = new RetentionManager({
            defaultTtlMs: 7 * 24 * 60 * 60 * 1000, // 7 days
            maxEvents: 1000,
        });
    });

    /* ── Retention Policy ── */

    describe("policy", () => {
        it("stores the configured default TTL", () => {
            expect(manager.policy.defaultTtlMs).toBe(7 * 24 * 60 * 60 * 1000);
        });

        it("stores the configured max events quota", () => {
            expect(manager.policy.maxEvents).toBe(1000);
        });
    });

    /* ── Expiry-Based Cleanup ── */

    describe("purgeExpired", () => {
        it("removes events older than the TTL", () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date("2026-02-14T10:00:00Z"));

            const now = Date.now();
            const eightDaysAgo = now - 8 * 24 * 60 * 60 * 1000;
            const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;

            const events = [
                makeEvent(eightDaysAgo),
                makeEvent(twoDaysAgo),
                makeEvent(now),
            ];

            const retained = manager.purgeExpired(events);
            expect(retained).toHaveLength(2);

            vi.useRealTimers();
        });

        it("retains all events within TTL", () => {
            const now = Date.now();
            const events = [
                makeEvent(now - 1000),
                makeEvent(now - 2000),
                makeEvent(now),
            ];

            const retained = manager.purgeExpired(events);
            expect(retained).toHaveLength(3);
        });

        it("returns empty array when all events expired", () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date("2026-02-14T10:00:00Z"));

            const tenDaysAgo = Date.now() - 10 * 24 * 60 * 60 * 1000;
            const events = [makeEvent(tenDaysAgo), makeEvent(tenDaysAgo - 1000)];

            const retained = manager.purgeExpired(events);
            expect(retained).toHaveLength(0);

            vi.useRealTimers();
        });
    });

    /* ── Quota Enforcement ── */

    describe("enforceQuota", () => {
        it("trims to maxEvents keeping newest events", () => {
            const small = new RetentionManager({
                defaultTtlMs: 7 * 24 * 60 * 60 * 1000,
                maxEvents: 3,
            });

            const events = [
                makeEvent(1000, { action: "first" }),
                makeEvent(2000, { action: "second" }),
                makeEvent(3000, { action: "third" }),
                makeEvent(4000, { action: "fourth" }),
                makeEvent(5000, { action: "fifth" }),
            ];

            const retained = small.enforceQuota(events);
            expect(retained).toHaveLength(3);
            expect(retained[0].action).toBe("third");
            expect(retained[2].action).toBe("fifth");
        });

        it("returns all events when under quota", () => {
            const events = [makeEvent(1000), makeEvent(2000)];
            const retained = manager.enforceQuota(events);
            expect(retained).toHaveLength(2);
        });

        it("returns exact maxEvents when at quota", () => {
            const small = new RetentionManager({
                defaultTtlMs: 7 * 24 * 60 * 60 * 1000,
                maxEvents: 2,
            });

            const events = [makeEvent(1000), makeEvent(2000)];
            const retained = small.enforceQuota(events);
            expect(retained).toHaveLength(2);
        });
    });

    /* ── Combined Cleanup ── */

    describe("cleanup", () => {
        it("applies both TTL purge and quota enforcement", () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date("2026-02-14T10:00:00Z"));

            const small = new RetentionManager({
                defaultTtlMs: 7 * 24 * 60 * 60 * 1000,
                maxEvents: 2,
            });

            const now = Date.now();
            const events = [
                makeEvent(now - 10 * 24 * 60 * 60 * 1000, { action: "expired" }),
                makeEvent(now - 1000, { action: "recent1" }),
                makeEvent(now - 500, { action: "recent2" }),
                makeEvent(now, { action: "newest" }),
            ];

            const retained = small.cleanup(events);
            // Expired event removed by TTL, then quota trims to 2
            expect(retained).toHaveLength(2);
            expect(retained[0].action).toBe("recent2");
            expect(retained[1].action).toBe("newest");

            vi.useRealTimers();
        });

        it("handles empty input", () => {
            const retained = manager.cleanup([]);
            expect(retained).toEqual([]);
        });
    });
});
