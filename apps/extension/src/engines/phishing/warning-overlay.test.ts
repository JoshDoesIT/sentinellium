/**
 * @module Warning Overlay Tests
 * @description TDD tests for the content-script warning overlay.
 * Tests the overlay builder logic, severity rendering, actions,
 * and sanitization. The actual DOM rendering uses Shadow DOM
 * but is tested via JSDOM-compatible abstractions.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  WarningOverlay,
  OverlaySeverity,
  type OverlayConfig,
} from "./warning-overlay";

/* ── Test Helpers ── */

function createTestConfig(
  overrides: Partial<OverlayConfig> = {},
): OverlayConfig {
  return {
    severity: OverlaySeverity.SUSPICIOUS,
    domain: "login-paypal.tk",
    score: 65,
    signals: ["url:homoglyph", "dom:password_form"],
    onDismiss: vi.fn(),
    onReport: vi.fn(),
    onProceed: vi.fn(),
    ...overrides,
  };
}

describe("Warning Overlay", () => {
  let overlay: WarningOverlay;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  /* ── Initialization ── */

  describe("initialization", () => {
    it("creates an overlay instance", () => {
      overlay = new WarningOverlay(createTestConfig());
      expect(overlay).toBeInstanceOf(WarningOverlay);
    });

    it("stores the configuration", () => {
      const config = createTestConfig();
      overlay = new WarningOverlay(config);
      expect(overlay.config).toEqual(config);
    });
  });

  /* ── Severity Rendering ── */

  describe("severity rendering", () => {
    it("returns warning theme for SUSPICIOUS", () => {
      overlay = new WarningOverlay(
        createTestConfig({ severity: OverlaySeverity.SUSPICIOUS }),
      );
      const theme = overlay.getTheme();
      expect(theme.accentColor).toContain("amber");
      expect(theme.icon).toBe("⚠️");
    });

    it("returns danger theme for CONFIRMED_PHISHING", () => {
      overlay = new WarningOverlay(
        createTestConfig({ severity: OverlaySeverity.CONFIRMED_PHISHING }),
      );
      const theme = overlay.getTheme();
      expect(theme.accentColor).toContain("red");
      expect(theme.icon).toBe("🛑");
    });

    it("returns caution theme for LIKELY_PHISHING", () => {
      overlay = new WarningOverlay(
        createTestConfig({ severity: OverlaySeverity.LIKELY_PHISHING }),
      );
      const theme = overlay.getTheme();
      expect(theme.accentColor).toContain("orange");
      expect(theme.icon).toBe("🚨");
    });
  });

  /* ── HTML Generation ── */

  describe("HTML generation", () => {
    it("generates valid HTML string", () => {
      overlay = new WarningOverlay(createTestConfig());
      const html = overlay.buildHtml();
      expect(html).toContain("sentinellium");
      expect(html).toContain("login-paypal.tk");
    });

    it("includes the score in the output", () => {
      overlay = new WarningOverlay(createTestConfig({ score: 87 }));
      const html = overlay.buildHtml();
      expect(html).toContain("87");
    });

    it("includes triggered signals", () => {
      overlay = new WarningOverlay(
        createTestConfig({
          signals: ["url:homoglyph", "dom:password_form"],
        }),
      );
      const html = overlay.buildHtml();
      expect(html).toContain("homoglyph");
      expect(html).toContain("password_form");
    });

    it("includes action buttons", () => {
      overlay = new WarningOverlay(createTestConfig());
      const html = overlay.buildHtml();
      expect(html).toContain("Dismiss");
      expect(html).toContain("Report");
    });
  });

  /* ── Action Mapping ── */

  describe("action mapping", () => {
    it("returns all available actions", () => {
      const config = createTestConfig();
      overlay = new WarningOverlay(config);
      const actions = overlay.getActions();

      expect(actions).toHaveLength(3);
      expect(actions.map((a) => a.id)).toContain("dismiss");
      expect(actions.map((a) => a.id)).toContain("report");
      expect(actions.map((a) => a.id)).toContain("proceed");
    });

    it("maps dismiss action to callback", () => {
      const config = createTestConfig();
      overlay = new WarningOverlay(config);
      const actions = overlay.getActions();

      const dismiss = actions.find((a) => a.id === "dismiss");
      dismiss?.handler();
      expect(config.onDismiss).toHaveBeenCalled();
    });

    it("maps report action to callback", () => {
      const config = createTestConfig();
      overlay = new WarningOverlay(config);
      const actions = overlay.getActions();

      const report = actions.find((a) => a.id === "report");
      report?.handler();
      expect(config.onReport).toHaveBeenCalled();
    });
  });

  /* ── Accessibility ── */

  describe("accessibility", () => {
    it("includes ARIA labels in HTML output", () => {
      overlay = new WarningOverlay(createTestConfig());
      const html = overlay.buildHtml();
      expect(html).toContain('role="alert"');
      expect(html).toContain("aria-label");
    });
  });
});
