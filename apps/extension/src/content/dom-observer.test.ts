/**
 * @module DOM Observer Tests
 * @description TDD tests for the DOM mutation observer used by
 * content scripts to detect dynamic page changes (SPA support).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createDOMObserver } from './dom-observer';


/**
 * Minimal mock of MutationObserver for Node test environment.
 */
class MockMutationObserver {
    callback: MutationCallback;
    static instances: MockMutationObserver[] = [];

    constructor(callback: MutationCallback) {
        this.callback = callback;
        MockMutationObserver.instances.push(this);
    }

    observe = vi.fn();
    disconnect = vi.fn();
    takeRecords = vi.fn().mockReturnValue([]);

    /** Simulate a DOM mutation from tests. */
    trigger(records: Partial<MutationRecord>[]) {
        this.callback(records as MutationRecord[], this);
    }
}

describe('createDOMObserver', () => {
    beforeEach(() => {
        MockMutationObserver.instances = [];
        vi.stubGlobal('MutationObserver', MockMutationObserver);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('creates and starts a MutationObserver on the target', () => {
        const target = {} as Element;
        const observer = createDOMObserver({
            target,
            onMutation: vi.fn(),
        });

        expect(MockMutationObserver.instances).toHaveLength(1);
        expect(MockMutationObserver.instances[0]!.observe).toHaveBeenCalledWith(
            target,
            expect.objectContaining({
                childList: true,
                subtree: true,
            }),
        );

        observer.disconnect();
    });

    it('calls onMutation when DOM changes occur', () => {
        const onMutation = vi.fn();
        createDOMObserver({
            target: {} as Element,
            onMutation,
        });

        const instance = MockMutationObserver.instances[0]!;
        instance.trigger([{ type: 'childList', addedNodes: [] as unknown as NodeList }]);

        expect(onMutation).toHaveBeenCalledTimes(1);
    });

    it('debounces rapid mutations', async () => {
        vi.useFakeTimers();
        const onMutation = vi.fn();
        createDOMObserver({
            target: {} as Element,
            onMutation,
            debounceMs: 100,
        });

        const instance = MockMutationObserver.instances[0]!;

        // Fire 5 rapid mutations
        for (let i = 0; i < 5; i++) {
            instance.trigger([{ type: 'childList' }]);
        }

        expect(onMutation).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(100);

        expect(onMutation).toHaveBeenCalledTimes(1);

        vi.useRealTimers();
    });

    it('disconnects the observer on teardown', () => {
        const observer = createDOMObserver({
            target: {} as Element,
            onMutation: vi.fn(),
        });

        observer.disconnect();

        const instance = MockMutationObserver.instances[0]!;
        expect(instance.disconnect).toHaveBeenCalled();
    });

    it('uses custom MutationObserver options when provided', () => {
        createDOMObserver({
            target: {} as Element,
            onMutation: vi.fn(),
            observerOptions: {
                attributes: true,
                attributeFilter: ['class', 'style'],
            },
        });

        const instance = MockMutationObserver.instances[0]!;
        expect(instance.observe).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                attributes: true,
                attributeFilter: ['class', 'style'],
            }),
        );
    });
});
