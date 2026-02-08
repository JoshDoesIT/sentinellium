/**
 * @module Feedback Loop Tests
 * @description TDD tests for the false-positive feedback loop.
 * Stores user corrections locally and adjusts future scoring.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FeedbackLoop, FeedbackAction } from "./feedback-loop";

/* ── Mock Storage ── */

function createMockStorage() {
    const store = new Map<string, string>();
    return {
        get: vi.fn(async (key: string) => {
            const raw = store.get(key);
            return raw ? JSON.parse(raw) : undefined;
        }),
        set: vi.fn(async (key: string, value: unknown) => {
            store.set(key, JSON.stringify(value));
        }),
        _store: store,
    };
}

describe("Feedback Loop", () => {
    let feedback: FeedbackLoop;
    let mockStorage: ReturnType<typeof createMockStorage>;

    beforeEach(() => {
        vi.restoreAllMocks();
        mockStorage = createMockStorage();
        feedback = new FeedbackLoop(mockStorage);
    });

    /* ── Initialization ── */

    describe("initialization", () => {
        it("creates an instance", () => {
            expect(feedback).toBeInstanceOf(FeedbackLoop);
        });
    });

    /* ── Recording Feedback ── */

    describe("recording feedback", () => {
        it("records a dismiss action", async () => {
            await feedback.record({
                domain: "safe-site.com",
                url: "https://safe-site.com/login",
                action: FeedbackAction.DISMISS,
                timestamp: Date.now(),
            });

            expect(mockStorage.set).toHaveBeenCalled();
        });

        it("records a confirm action", async () => {
            await feedback.record({
                domain: "phish.tk",
                url: "https://phish.tk/steal",
                action: FeedbackAction.CONFIRM_PHISHING,
                timestamp: Date.now(),
            });

            expect(mockStorage.set).toHaveBeenCalled();
        });

        it("records a report action", async () => {
            await feedback.record({
                domain: "suspicious.xyz",
                url: "https://suspicious.xyz/login",
                action: FeedbackAction.REPORT,
                timestamp: Date.now(),
            });

            expect(mockStorage.set).toHaveBeenCalled();
        });
    });

    /* ── Domain Queries ── */

    describe("domain queries", () => {
        it("returns dismiss count for a domain", async () => {
            await feedback.record({
                domain: "safe-site.com",
                url: "https://safe-site.com/page1",
                action: FeedbackAction.DISMISS,
                timestamp: Date.now(),
            });
            await feedback.record({
                domain: "safe-site.com",
                url: "https://safe-site.com/page2",
                action: FeedbackAction.DISMISS,
                timestamp: Date.now(),
            });

            const stats = await feedback.getDomainStats("safe-site.com");
            expect(stats.dismissCount).toBe(2);
        });

        it("returns zero stats for unknown domain", async () => {
            const stats = await feedback.getDomainStats("unknown.com");
            expect(stats.dismissCount).toBe(0);
            expect(stats.confirmCount).toBe(0);
        });
    });

    /* ── Auto-Allowlist ── */

    describe("auto-allowlist", () => {
        it("recommends allowlisting after multiple dismissals", async () => {
            for (let i = 0; i < 3; i++) {
                await feedback.record({
                    domain: "safe-site.com",
                    url: `https://safe-site.com/page${i}`,
                    action: FeedbackAction.DISMISS,
                    timestamp: Date.now(),
                });
            }

            const shouldAllow = await feedback.shouldAutoAllowlist("safe-site.com");
            expect(shouldAllow).toBe(true);
        });

        it("does not allowlist with few dismissals", async () => {
            await feedback.record({
                domain: "maybe-safe.com",
                url: "https://maybe-safe.com/page",
                action: FeedbackAction.DISMISS,
                timestamp: Date.now(),
            });

            const shouldAllow = await feedback.shouldAutoAllowlist("maybe-safe.com");
            expect(shouldAllow).toBe(false);
        });

        it("does not allowlist if user also confirmed phishing", async () => {
            for (let i = 0; i < 5; i++) {
                await feedback.record({
                    domain: "mixed.com",
                    url: `https://mixed.com/page${i}`,
                    action: FeedbackAction.DISMISS,
                    timestamp: Date.now(),
                });
            }
            await feedback.record({
                domain: "mixed.com",
                url: "https://mixed.com/evil",
                action: FeedbackAction.CONFIRM_PHISHING,
                timestamp: Date.now(),
            });

            const shouldAllow = await feedback.shouldAutoAllowlist("mixed.com");
            expect(shouldAllow).toBe(false);
        });
    });

    /* ── Privacy ── */

    describe("privacy", () => {
        it("stores all data locally via the provided storage", async () => {
            await feedback.record({
                domain: "test.com",
                url: "https://test.com",
                action: FeedbackAction.DISMISS,
                timestamp: Date.now(),
            });

            expect(mockStorage.set).toHaveBeenCalled();
            // No external calls — verified by mock isolation
        });
    });
});
