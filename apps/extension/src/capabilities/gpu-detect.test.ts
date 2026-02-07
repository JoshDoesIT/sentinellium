/**
 * @module GPU Capability Detection Tests
 * @description TDD tests for WebGPU/WebNN hardware capability detection.
 * Determines whether the browser supports local AI inference.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    detectWebGPU,
    detectWebNN,
    getCapabilityReport,
    SupportLevel,
} from './gpu-detect';
import type { CapabilityReport } from './gpu-detect';

describe('detectWebGPU', () => {
    beforeEach(() => {
        vi.unstubAllGlobals();
    });

    it('returns FULL when navigator.gpu is available and adapter exists', async () => {
        const mockAdapter = {
            requestAdapterInfo: vi.fn().mockResolvedValue({
                vendor: 'apple',
                architecture: 'common-3',
            }),
            limits: {
                maxBufferSize: 268435456,
                maxComputeWorkgroupsPerDimension: 65535,
            },
        };

        vi.stubGlobal('navigator', {
            gpu: {
                requestAdapter: vi.fn().mockResolvedValue(mockAdapter),
            },
        });

        const result = await detectWebGPU();

        expect(result.level).toBe(SupportLevel.FULL);
        expect(result.adapter).toBeDefined();
        expect(result.adapter?.vendor).toBe('apple');
    });

    it('returns PARTIAL when navigator.gpu exists but no adapter', async () => {
        vi.stubGlobal('navigator', {
            gpu: {
                requestAdapter: vi.fn().mockResolvedValue(null),
            },
        });

        const result = await detectWebGPU();

        expect(result.level).toBe(SupportLevel.PARTIAL);
        expect(result.adapter).toBeUndefined();
    });

    it('returns NONE when navigator.gpu is undefined', async () => {
        vi.stubGlobal('navigator', {});

        const result = await detectWebGPU();

        expect(result.level).toBe(SupportLevel.NONE);
    });

    it('returns NONE when requestAdapter throws', async () => {
        vi.stubGlobal('navigator', {
            gpu: {
                requestAdapter: vi.fn().mockRejectedValue(new Error('GPU lost')),
            },
        });

        const result = await detectWebGPU();

        expect(result.level).toBe(SupportLevel.NONE);
        expect(result.error).toBe('GPU lost');
    });
});

describe('detectWebNN', () => {
    beforeEach(() => {
        vi.unstubAllGlobals();
    });

    it('returns FULL when navigator.ml exists', async () => {
        vi.stubGlobal('navigator', {
            ml: {
                createContext: vi.fn().mockResolvedValue({}),
            },
        });

        const result = await detectWebNN();

        expect(result.level).toBe(SupportLevel.FULL);
    });

    it('returns NONE when navigator.ml is undefined', async () => {
        vi.stubGlobal('navigator', {});

        const result = await detectWebNN();

        expect(result.level).toBe(SupportLevel.NONE);
    });

    it('returns NONE when createContext throws', async () => {
        vi.stubGlobal('navigator', {
            ml: {
                createContext: vi
                    .fn()
                    .mockRejectedValue(new Error('WebNN not supported')),
            },
        });

        const result = await detectWebNN();

        expect(result.level).toBe(SupportLevel.NONE);
        expect(result.error).toBe('WebNN not supported');
    });
});

describe('getCapabilityReport', () => {
    beforeEach(() => {
        vi.unstubAllGlobals();
    });

    it('returns a combined report with both WebGPU and WebNN results', async () => {
        const mockAdapter = {
            requestAdapterInfo: vi.fn().mockResolvedValue({
                vendor: 'nvidia',
                architecture: 'turing',
            }),
            limits: {
                maxBufferSize: 1073741824,
                maxComputeWorkgroupsPerDimension: 65535,
            },
        };

        vi.stubGlobal('navigator', {
            gpu: {
                requestAdapter: vi.fn().mockResolvedValue(mockAdapter),
            },
            ml: {
                createContext: vi.fn().mockResolvedValue({}),
            },
        });

        const report: CapabilityReport = await getCapabilityReport();

        expect(report.webgpu.level).toBe(SupportLevel.FULL);
        expect(report.webnn.level).toBe(SupportLevel.FULL);
        expect(report.canRunInference).toBe(true);
        expect(report.timestamp).toBeDefined();
    });

    it('reports canRunInference false when WebGPU is NONE', async () => {
        vi.stubGlobal('navigator', {});

        const report = await getCapabilityReport();

        expect(report.canRunInference).toBe(false);
    });

    it('reports canRunInference true when WebGPU is FULL even without WebNN', async () => {
        const mockAdapter = {
            requestAdapterInfo: vi.fn().mockResolvedValue({
                vendor: 'intel',
                architecture: 'gen12',
            }),
            limits: {
                maxBufferSize: 536870912,
                maxComputeWorkgroupsPerDimension: 65535,
            },
        };

        vi.stubGlobal('navigator', {
            gpu: {
                requestAdapter: vi.fn().mockResolvedValue(mockAdapter),
            },
        });

        const report = await getCapabilityReport();

        expect(report.canRunInference).toBe(true);
        expect(report.webnn.level).toBe(SupportLevel.NONE);
    });
});
