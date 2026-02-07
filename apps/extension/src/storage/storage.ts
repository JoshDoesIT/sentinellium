/**
 * @module Storage Abstraction
 * @description Typed wrapper around chrome.storage that provides
 * type-safe get/set/clear/subscribe operations with JSON serialization.
 *
 * Supports LOCAL, SYNC, and SESSION storage areas. Defaults to LOCAL.
 * All values are JSON-serialized to handle complex types safely.
 */

/** Available chrome.storage areas. */
export enum StorageArea {
    LOCAL = 'local',
    SYNC = 'sync',
    SESSION = 'session',
}

/**
 * Returns the chrome.storage area object for the given enum value.
 */
function getArea(area: StorageArea): chrome.storage.StorageArea {
    return chrome.storage[area] as chrome.storage.StorageArea;
}

/**
 * Create a typed storage accessor for a single key.
 *
 * @param key - The storage key to read/write
 * @param defaults - Default values returned when storage is empty
 * @param area - Which chrome.storage area to use (defaults to LOCAL)
 * @returns Object with get, set, clear, and subscribe methods
 */
export function createStorage<T extends object>(
    key: string,
    defaults: T,
    area: StorageArea = StorageArea.LOCAL,
) {
    const storageArea = getArea(area);

    async function get(): Promise<T> {
        const result = await storageArea.get(key);
        if (!(key in result)) {
            return { ...defaults };
        }

        const stored = JSON.parse(result[key] as string) as Partial<T>;
        return { ...defaults, ...stored };
    }

    async function set(partial: Partial<T>): Promise<void> {
        const current = await get();
        const merged = { ...current, ...partial };
        await storageArea.set({ [key]: JSON.stringify(merged) });
    }

    async function clear(): Promise<void> {
        await storageArea.remove(key);
    }

    function subscribe(callback: (value: T) => void): () => void {
        const listener = (
            changes: Record<string, chrome.storage.StorageChange>,
            areaName: string,
        ) => {
            if (areaName !== area || !(key in changes)) {
                return;
            }
            const newValue = changes[key]?.newValue;
            if (newValue !== undefined) {
                const parsed = JSON.parse(newValue as string) as Partial<T>;
                callback({ ...defaults, ...parsed });
            }
        };

        chrome.storage.onChanged.addListener(listener);

        return () => {
            chrome.storage.onChanged.removeListener(listener);
        };
    }

    return { get, set, clear, subscribe };
}
