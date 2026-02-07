/**
 * @module Storage Abstraction Tests
 * @description TDD tests for the typed chrome.storage wrapper.
 * Tests the contract of the storage abstraction without relying
 * on browser APIs directly.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createStorage, StorageArea } from './storage';

/**
 * Minimal mock of the chrome.storage API surface.
 * We mock at the boundary so tests verify our abstraction,
 * not Chrome internals.
 */
function createMockChromeStorage() {
    const stores: Record<string, Record<string, unknown>> = {
        local: {},
        sync: {},
        session: {},
    };

    const listeners: Array<
        (
            changes: Record<string, { oldValue?: unknown; newValue?: unknown }>,
            areaName: string,
        ) => void
    > = [];

    function makeArea(name: string) {
        return {
            get: vi.fn(async (keys: string | string[]) => {
                const keyList = Array.isArray(keys) ? keys : [keys];
                const result: Record<string, unknown> = {};
                for (const key of keyList) {
                    if (key in stores[name]!) {
                        result[key] = stores[name]![key];
                    }
                }
                return result;
            }),
            set: vi.fn(async (items: Record<string, unknown>) => {
                const changes: Record<
                    string,
                    { oldValue?: unknown; newValue?: unknown }
                > = {};
                for (const [key, value] of Object.entries(items)) {
                    changes[key] = { oldValue: stores[name]![key], newValue: value };
                    stores[name]![key] = value;
                }
                for (const listener of listeners) {
                    listener(changes, name);
                }
            }),
            remove: vi.fn(async (keys: string | string[]) => {
                const keyList = Array.isArray(keys) ? keys : [keys];
                for (const key of keyList) {
                    delete stores[name]![key];
                }
            }),
        };
    }

    return {
        storage: {
            local: makeArea('local'),
            sync: makeArea('sync'),
            session: makeArea('session'),
            onChanged: {
                addListener: vi.fn((cb: (typeof listeners)[0]) => {
                    listeners.push(cb);
                }),
                removeListener: vi.fn((cb: (typeof listeners)[0]) => {
                    const idx = listeners.indexOf(cb);
                    if (idx >= 0) listeners.splice(idx, 1);
                }),
            },
        },
    };
}

describe('createStorage', () => {
    let mockChrome: ReturnType<typeof createMockChromeStorage>;

    beforeEach(() => {
        mockChrome = createMockChromeStorage();
        // Inject mock into global scope for the module under test
        vi.stubGlobal('chrome', mockChrome);
    });

    describe('get', () => {
        it('returns defaults when storage is empty', async () => {
            const store = createStorage('settings', { theme: 'dark', volume: 80 });
            const result = await store.get();

            expect(result).toEqual({ theme: 'dark', volume: 80 });
        });

        it('returns stored values merged with defaults', async () => {
            await mockChrome.storage.local.set({
                settings: JSON.stringify({ theme: 'light' }),
            });

            const store = createStorage('settings', { theme: 'dark', volume: 80 });
            const result = await store.get();

            expect(result).toEqual({ theme: 'light', volume: 80 });
        });

        it('uses the specified storage area', async () => {
            await mockChrome.storage.sync.set({
                prefs: JSON.stringify({ lang: 'en' }),
            });

            const store = createStorage(
                'prefs',
                { lang: 'fr' },
                StorageArea.SYNC,
            );
            const result = await store.get();

            expect(result).toEqual({ lang: 'en' });
            expect(mockChrome.storage.sync.get).toHaveBeenCalledWith('prefs');
        });

        it('defaults to LOCAL storage area', async () => {
            const store = createStorage('key', { value: 1 });
            await store.get();

            expect(mockChrome.storage.local.get).toHaveBeenCalledWith('key');
        });
    });

    describe('set', () => {
        it('persists values as JSON to the correct area', async () => {
            const store = createStorage('config', { debug: false });
            await store.set({ debug: true });

            expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
                config: JSON.stringify({ debug: true }),
            });
        });

        it('merges partial updates with existing values', async () => {
            const store = createStorage('settings', { theme: 'dark', volume: 80 });
            await store.set({ volume: 50 });

            // Should have merged: { theme: 'dark', volume: 50 }
            const result = await store.get();
            expect(result).toEqual({ theme: 'dark', volume: 50 });
        });

        it('writes to the specified storage area', async () => {
            const store = createStorage(
                'sync-data',
                { enabled: true },
                StorageArea.SESSION,
            );
            await store.set({ enabled: false });

            expect(mockChrome.storage.session.set).toHaveBeenCalled();
        });
    });

    describe('clear', () => {
        it('removes the key from storage', async () => {
            const store = createStorage('temp', { data: 'value' });
            await store.set({ data: 'stored' });
            await store.clear();

            expect(mockChrome.storage.local.remove).toHaveBeenCalledWith('temp');
        });
    });

    describe('subscribe', () => {
        it('fires callback when the stored value changes', async () => {
            const store = createStorage('watched', { count: 0 });
            const callback = vi.fn();

            store.subscribe(callback);
            await store.set({ count: 5 });

            expect(callback).toHaveBeenCalledWith(
                expect.objectContaining({ count: 5 }),
            );
        });

        it('does not fire callback for changes to other keys', async () => {
            const store = createStorage('myKey', { value: 1 });
            const otherStore = createStorage('otherKey', { value: 2 });
            const callback = vi.fn();

            store.subscribe(callback);
            await otherStore.set({ value: 99 });

            expect(callback).not.toHaveBeenCalled();
        });

        it('returns an unsubscribe function', async () => {
            const store = createStorage('unsub-test', { active: true });
            const callback = vi.fn();

            const unsubscribe = store.subscribe(callback);
            unsubscribe();
            await store.set({ active: false });

            expect(callback).not.toHaveBeenCalled();
        });
    });

    describe('complex types', () => {
        it('handles nested objects', async () => {
            interface Config {
                engines: { phishing: boolean; dlp: boolean };
                threshold: number;
            }

            const store = createStorage<Config>('engine-config', {
                engines: { phishing: true, dlp: true },
                threshold: 0.8,
            });

            await store.set({ engines: { phishing: false, dlp: true } });
            const result = await store.get();

            expect(result.engines.phishing).toBe(false);
            expect(result.engines.dlp).toBe(true);
            expect(result.threshold).toBe(0.8);
        });

        it('handles arrays', async () => {
            const store = createStorage('blocklist', {
                domains: ['evil.com', 'phish.net'],
            });

            await store.set({ domains: ['evil.com', 'phish.net', 'scam.org'] });
            const result = await store.get();

            expect(result.domains).toHaveLength(3);
            expect(result.domains).toContain('scam.org');
        });
    });
});
