/**
 * @module Badge State Tests
 * @description TDD tests for the extension badge and icon state management.
 * The badge communicates extension status at a glance via the toolbar icon.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadgeState, setBadgeState, getBadgeConfig } from './badge';

function createMockChromeAction() {
    return {
        action: {
            setBadgeText: vi.fn().mockResolvedValue(undefined),
            setBadgeBackgroundColor: vi.fn().mockResolvedValue(undefined),
            setTitle: vi.fn().mockResolvedValue(undefined),
        },
    };
}

describe('BadgeState', () => {
    it('defines all expected states', () => {
        expect(BadgeState.IDLE).toBe('IDLE');
        expect(BadgeState.SCANNING).toBe('SCANNING');
        expect(BadgeState.THREAT_DETECTED).toBe('THREAT_DETECTED');
        expect(BadgeState.PROTECTED).toBe('PROTECTED');
        expect(BadgeState.DISABLED).toBe('DISABLED');
        expect(BadgeState.ERROR).toBe('ERROR');
    });
});

describe('getBadgeConfig', () => {
    it('returns empty badge text for IDLE state', () => {
        const config = getBadgeConfig(BadgeState.IDLE);
        expect(config.text).toBe('');
        expect(config.title).toBe('Sentinellium: Idle');
    });

    it('returns scanning indicator for SCANNING state', () => {
        const config = getBadgeConfig(BadgeState.SCANNING);
        expect(config.text).toBe('...');
        expect(config.color).toBeDefined();
        expect(config.title).toBe('Sentinellium: Scanning');
    });

    it('returns alert indicator for THREAT_DETECTED state', () => {
        const config = getBadgeConfig(BadgeState.THREAT_DETECTED);
        expect(config.text).toBe('!');
        expect(config.title).toBe('Sentinellium: Threat Detected');
    });

    it('returns checkmark for PROTECTED state', () => {
        const config = getBadgeConfig(BadgeState.PROTECTED);
        expect(config.text).toBe('✓');
        expect(config.title).toBe('Sentinellium: Protected');
    });

    it('returns off indicator for DISABLED state', () => {
        const config = getBadgeConfig(BadgeState.DISABLED);
        expect(config.text).toBe('OFF');
        expect(config.title).toBe('Sentinellium: Disabled');
    });

    it('returns error indicator for ERROR state', () => {
        const config = getBadgeConfig(BadgeState.ERROR);
        expect(config.text).toBe('ERR');
        expect(config.title).toBe('Sentinellium: Error');
    });

    it('optionally includes a threat count for THREAT_DETECTED', () => {
        const config = getBadgeConfig(BadgeState.THREAT_DETECTED, 3);
        expect(config.text).toBe('3');
    });
});

describe('setBadgeState', () => {
    let mockChrome: ReturnType<typeof createMockChromeAction>;

    beforeEach(() => {
        mockChrome = createMockChromeAction();
        vi.stubGlobal('chrome', mockChrome);
    });

    it('sets badge text and color via chrome.action API', async () => {
        await setBadgeState(BadgeState.SCANNING);

        expect(mockChrome.action.setBadgeText).toHaveBeenCalledWith({
            text: '...',
        });
        expect(mockChrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith({
            color: expect.any(String),
        });
        expect(mockChrome.action.setTitle).toHaveBeenCalledWith({
            title: 'Sentinellium: Scanning',
        });
    });

    it('clears badge for IDLE state', async () => {
        await setBadgeState(BadgeState.IDLE);

        expect(mockChrome.action.setBadgeText).toHaveBeenCalledWith({
            text: '',
        });
    });

    it('passes threat count to THREAT_DETECTED state', async () => {
        await setBadgeState(BadgeState.THREAT_DETECTED, 5);

        expect(mockChrome.action.setBadgeText).toHaveBeenCalledWith({
            text: '5',
        });
    });
});
