/**
 * @module Analytics
 * @description Privacy-preserving analytics opt-in framework.
 * Events are only collected when the user explicitly opts in.
 * No PII is ever collected. All data is aggregated.
 */

/** Shape of an analytics event. */
export interface AnalyticsEvent {
    name: string;
    properties?: Record<string, unknown>;
}

/** Result of attempting to track an event. */
export interface TrackResult {
    sent: boolean;
    event?: AnalyticsEvent;
    timestamp?: number;
}

/** Storage interface matching createStorage's return type. */
interface AnalyticsStorage {
    get: () => Promise<{ optedIn: boolean }>;
    set: (partial: Partial<{ optedIn: boolean }>) => Promise<void>;
}

/**
 * Create an analytics instance backed by the given storage.
 * Events are only tracked when the user has opted in.
 */
export function createAnalytics(storage: AnalyticsStorage) {
    async function isOptedIn(): Promise<boolean> {
        const state = await storage.get();
        return state.optedIn;
    }

    async function setOptIn(value: boolean): Promise<void> {
        await storage.set({ optedIn: value });
    }

    async function trackEvent(event: AnalyticsEvent): Promise<TrackResult> {
        const opted = await isOptedIn();

        if (!opted) {
            return { sent: false };
        }

        return {
            sent: true,
            event,
            timestamp: Date.now(),
        };
    }

    return { isOptedIn, setOptIn, trackEvent };
}
