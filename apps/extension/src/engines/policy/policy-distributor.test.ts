/**
 * @module Policy Distributor Tests
 * @description TDD tests for the policy distribution pipeline.
 * Pushes validated policies from server to extension instances.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PolicyDistributor, DistributionStatus } from "./policy-distributor";
import { type PolicyDocument } from "./policy-schema-validator";

describe("Policy Distributor", () => {
  let distributor: PolicyDistributor;
  let mockFetch: ReturnType<typeof vi.fn>;

  const testPolicy: PolicyDocument = {
    id: "pol-001",
    name: "Default",
    version: 1,
    rules: { phishing: { enabled: true, sensitivity: "high" } },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    mockFetch = vi.fn().mockResolvedValue({ ok: true });
    distributor = new PolicyDistributor({
      endpoints: [
        "https://ext-001.sentinellium.io/policy",
        "https://ext-002.sentinellium.io/policy",
      ],
      fetchFn: mockFetch,
    });
  });

  /* ── Initialization ── */

  describe("initialization", () => {
    it("creates an instance", () => {
      expect(distributor).toBeInstanceOf(PolicyDistributor);
    });
  });

  /* ── Distribution ── */

  describe("distribution", () => {
    it("distributes to all endpoints", async () => {
      const result = await distributor.distribute(testPolicy);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.successful).toBe(2);
    });

    it("handles partial failures", async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true })
        .mockRejectedValueOnce(new Error("Network error"));

      const result = await distributor.distribute(testPolicy);
      expect(result.successful).toBe(1);
      expect(result.failed).toBe(1);
    });

    it("reports full failure", async () => {
      mockFetch.mockRejectedValue(new Error("Down"));

      const result = await distributor.distribute(testPolicy);
      expect(result.successful).toBe(0);
      expect(result.status).toBe(DistributionStatus.FAILED);
    });
  });

  /* ── Status Tracking ── */

  describe("status tracking", () => {
    it("returns SUCCESS on full distribution", async () => {
      const result = await distributor.distribute(testPolicy);
      expect(result.status).toBe(DistributionStatus.SUCCESS);
    });

    it("returns PARTIAL on mixed results", async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true })
        .mockRejectedValueOnce(new Error("Fail"));

      const result = await distributor.distribute(testPolicy);
      expect(result.status).toBe(DistributionStatus.PARTIAL);
    });
  });

  /* ── Payload ── */

  describe("payload", () => {
    it("sends policy as JSON body", async () => {
      await distributor.distribute(testPolicy);

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call?.[1]?.body as string);
      expect(body.id).toBe("pol-001");
    });
  });
});
