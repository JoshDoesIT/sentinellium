/**
 * @module Policy Sync Tests
 * @description TDD tests for enterprise DLP policy synchronization.
 * Fetches sensitivity rules from the enterprise console.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PolicySync } from "./policy-sync";

describe("Policy Sync", () => {
  let sync: PolicySync;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          version: 2,
          rules: {
            blockedPiiTypes: ["SSN", "CREDIT_CARD", "API_KEY"],
            monitoredDomains: ["internal-llm.corp.com"],
            customPatterns: [{ name: "EMPLOYEE_ID", pattern: "EMP-\\d{6}" }],
          },
        }),
    });
    sync = new PolicySync({
      consoleUrl: "https://console.sentinellium.io/api/dlp-policy",
      fetchFn: mockFetch,
    });
  });

  /* ── Initialization ── */

  describe("initialization", () => {
    it("creates an instance", () => {
      expect(sync).toBeInstanceOf(PolicySync);
    });
  });

  /* ── Fetching Policies ── */

  describe("fetching policies", () => {
    it("fetches policy from console API", async () => {
      const policy = await sync.fetch();

      expect(mockFetch).toHaveBeenCalledOnce();
      expect(policy).toBeDefined();
      expect(policy?.version).toBe(2);
    });

    it("returns null on fetch failure", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const policy = await sync.fetch();
      expect(policy).toBeNull();
    });

    it("returns null on non-200 response", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });

      const policy = await sync.fetch();
      expect(policy).toBeNull();
    });
  });

  /* ── Policy Parsing ── */

  describe("policy parsing", () => {
    it("parses blocked PII types", async () => {
      const policy = await sync.fetch();
      expect(policy?.rules.blockedPiiTypes).toContain("SSN");
    });

    it("parses monitored domains", async () => {
      const policy = await sync.fetch();
      expect(policy?.rules.monitoredDomains).toContain("internal-llm.corp.com");
    });

    it("parses custom patterns", async () => {
      const policy = await sync.fetch();
      expect(policy?.rules.customPatterns).toHaveLength(1);
      expect(policy?.rules.customPatterns[0]?.name).toBe("EMPLOYEE_ID");
    });
  });

  /* ── Caching ── */

  describe("caching", () => {
    it("caches the last successful policy", async () => {
      await sync.fetch();

      const cached = sync.getCached();
      expect(cached).toBeDefined();
      expect(cached?.version).toBe(2);
    });

    it("retains cached policy on fetch failure", async () => {
      await sync.fetch(); // success
      mockFetch.mockRejectedValueOnce(new Error("Network error"));
      await sync.fetch(); // failure

      const cached = sync.getCached();
      expect(cached).toBeDefined();
    });
  });
});
