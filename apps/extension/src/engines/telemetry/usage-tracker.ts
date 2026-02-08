/**
 * @module Usage Statistics Tracker
 * @description Privacy-preserving usage statistics tracking.
 * Tracks extension usage patterns: pages scanned, features used,
 * engine uptime, and session duration. No URLs or page content
 * are ever collected.
 */

/* ── Types ── */

/** Snapshot of current usage statistics. */
export interface UsageSnapshot {
    pagesScanned: number;
    scansByEngine: Record<string, number>;
    featuresUsed: string[];
    activeEngines: string[];
    sessionStartedAt: number;
    sessionDurationMs: number;
}

/* ── Tracker ── */

/**
 * Tracks extension usage patterns in a privacy-preserving way.
 * All data is aggregate counts and identifiers only.
 */
export class UsageTracker {
    private pagesScanned = 0;
    private scansByEngine: Record<string, number> = {};
    private featuresUsed = new Set<string>();
    private activeEngines = new Set<string>();
    private sessionStart = 0;

    /**
     * Record a page scan for a specific engine.
     *
     * @param engine - Engine that performed the scan
     */
    recordPageScan(engine: string): void {
        this.pagesScanned++;
        this.scansByEngine[engine] = (this.scansByEngine[engine] ?? 0) + 1;
    }

    /**
     * Record that a feature was used.
     * Deduplicates repeated uses of the same feature.
     *
     * @param feature - Feature identifier
     */
    recordFeatureUsed(feature: string): void {
        this.featuresUsed.add(feature);
    }

    /**
     * Mark an engine as currently active.
     *
     * @param engine - Engine name
     */
    markEngineActive(engine: string): void {
        this.activeEngines.add(engine);
    }

    /**
     * Mark an engine as inactive.
     *
     * @param engine - Engine name
     */
    markEngineInactive(engine: string): void {
        this.activeEngines.delete(engine);
    }

    /** Start a new usage session. Records the current timestamp. */
    startSession(): void {
        this.sessionStart = Date.now();
    }

    /**
     * Get a snapshot of current usage statistics.
     * Returns independent copies to prevent external mutation.
     *
     * @returns Current usage snapshot
     */
    getSnapshot(): UsageSnapshot {
        return {
            pagesScanned: this.pagesScanned,
            scansByEngine: { ...this.scansByEngine },
            featuresUsed: [...this.featuresUsed],
            activeEngines: [...this.activeEngines],
            sessionStartedAt: this.sessionStart,
            sessionDurationMs:
                this.sessionStart > 0 ? Date.now() - this.sessionStart : 0,
        };
    }
}
