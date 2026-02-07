/**
 * @module Analytics Tests
 * @description TDD tests for the privacy-preserving analytics opt-in
 * framework. Events only fire if the user has opted in.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAnalytics } from './analytics';
import type { AnalyticsEvent } from './analytics';

/**
 * Mock storage that simulates the createStorage interface.
 */
function createMockStorage(initialOptIn = false) {
    let state = { optedIn: initialOptIn };
    return {
        get: vi.fn(async () => ({ ...state })),
        set: vi.fn(async (partial: Partial<typeof state>) => {
            state = { ...state, ...partial };
        }),
        clear: vi.fn(),
        subscribe: vi.fn().mockReturnValue(() => { }),
    };
}

describe('createAnalytics', () => {
    beforeEach(() => {
        vi.unstubAllGlobals();
    });

    it('suppresses events when user is not opted in', async () => {
        const storage = createMockStorage(false);
        const analytics = createAnalytics(storage);
        const event: AnalyticsEvent = {
            name: 'scan_completed',
            properties: { duration: 150 },
        };

        const result = await analytics.trackEvent(event);

        expect(result.sent).toBe(false);
    });

    it('fires events when user is opted in', async () => {
        const storage = createMockStorage(true);
        const analytics = createAnalytics(storage);
        const event: AnalyticsEvent = {
            name: 'scan_completed',
            properties: { duration: 150 },
        };

        const result = await analytics.trackEvent(event);

        expect(result.sent).toBe(true);
        expect(result.event).toEqual(event);
    });

    it('reports current opt-in status', async () => {
        const storage = createMockStorage(true);
        const analytics = createAnalytics(storage);

        expect(await analytics.isOptedIn()).toBe(true);
    });

    it('persists opt-in preference via storage', async () => {
        const storage = createMockStorage(false);
        const analytics = createAnalytics(storage);

        await analytics.setOptIn(true);

        expect(storage.set).toHaveBeenCalledWith({ optedIn: true });
        expect(await analytics.isOptedIn()).toBe(true);
    });

    it('persists opt-out preference via storage', async () => {
        const storage = createMockStorage(true);
        const analytics = createAnalytics(storage);

        await analytics.setOptIn(false);

        expect(storage.set).toHaveBeenCalledWith({ optedIn: false });
    });

    it('includes timestamp on tracked events', async () => {
        const storage = createMockStorage(true);
        const analytics = createAnalytics(storage);

        const result = await analytics.trackEvent({
            name: 'engine_toggled',
            properties: { engine: 'phishing', enabled: false },
        });

        expect(result.timestamp).toBeDefined();
        expect(typeof result.timestamp).toBe('number');
    });
});
