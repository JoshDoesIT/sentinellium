/**
 * @module Content Script
 * @description WXT content script entrypoint. Injects into all pages
 * and monitors DOM mutations for security analysis by the three engines.
 *
 * Communicates with the service worker via the message passing system.
 * Supports SPA navigation via MutationObserver.
 *
 * Wires:
 * - Phishing: Sends DOM heuristics with SCAN_REQUEST, shows WarningOverlay on SCAN_RESULT
 * - DLP: Intercepts input/paste events on LLM domains, shows InterventionUi modal
 * - C2PA: Scans page media and flags unverified images in high-stakes contexts
 */
import { createDOMObserver } from "@/src/content/dom-observer";
import { sendMessage, onMessage, MessageType } from "@/src/messaging/messages";
import {
  WarningOverlay,
  OverlaySeverity,
} from "@/src/engines/phishing/warning-overlay";
import { handleDlpScan } from "@/src/engines/dlp/dlp-handler";
import { InterventionUi } from "@/src/engines/dlp/intervention-ui";
import { handleC2paScan } from "@/src/engines/c2pa/c2pa-handler";
import { UnverifiedFlagger } from "@/src/engines/c2pa/unverified-flagger";
import type { ScanVerdict } from "@/src/engines/phishing/scan-handler";
import type { RawMediaElement } from "@/src/engines/c2pa/media-scanner";
import { ThreatLevel } from "@/src/engines/phishing/threat-scorer";

export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_idle",

  main() {
    const interventionUi = new InterventionUi();
    const unverifiedFlagger = new UnverifiedFlagger();

    /** Map ThreatLevel to OverlaySeverity. */
    function mapSeverity(level: ThreatLevel): OverlaySeverity {
      switch (level) {
        case ThreatLevel.CONFIRMED_PHISHING:
          return OverlaySeverity.CONFIRMED_PHISHING;
        case ThreatLevel.LIKELY_PHISHING:
          return OverlaySeverity.LIKELY_PHISHING;
        default:
          return OverlaySeverity.SUSPICIOUS;
      }
    }

    /* ── DOM Heuristic Extraction ── */

    /** Extract DOM signals for phishing detection. */
    function extractDomSignals() {
      const forms = document.querySelectorAll("form");
      let hasPasswordForm = false;
      let hasCreditCardForm = false;

      forms.forEach((form) => {
        const inputs = form.querySelectorAll("input");
        inputs.forEach((input) => {
          if (input.type === "password") hasPasswordForm = true;
          if (
            input.autocomplete?.includes("cc-number") ||
            input.name?.toLowerCase().includes("card")
          )
            hasCreditCardForm = true;
        });
      });

      // Check link mismatches (display text != href domain)
      const links = document.querySelectorAll("a[href]");
      let linkMismatchCount = 0;
      links.forEach((link) => {
        const href = link.getAttribute("href") ?? "";
        const text = link.textContent ?? "";
        if (
          text.includes("http") &&
          href.startsWith("http") &&
          !href.includes(text.replace(/https?:\/\//, "").split("/")[0])
        ) {
          linkMismatchCount++;
        }
      });

      // Check brand vs domain mismatch
      const title = document.title.toLowerCase();
      const domain = window.location.hostname.toLowerCase();
      const brands = [
        "paypal",
        "google",
        "microsoft",
        "apple",
        "amazon",
        "facebook",
        "netflix",
        "bank",
      ];
      const brandDomainMismatch = brands.some(
        (brand) => title.includes(brand) && !domain.includes(brand),
      );

      // Count urgency signals in visible text
      const bodyText = document.body?.innerText?.toLowerCase() ?? "";
      const urgencyPhrases = [
        "account suspended",
        "verify your identity",
        "act now",
        "limited time",
        "unusual activity",
        "confirm your account",
      ];
      const urgencySignals = urgencyPhrases.filter((p) =>
        bodyText.includes(p),
      ).length;

      return {
        hasPasswordForm,
        hasCreditCardForm,
        linkMismatchCount,
        brandDomainMismatch,
        urgencySignals,
      };
    }

    /* ── Phishing: DOM Observer + Overlay ── */

    function startObserving() {
      createDOMObserver({
        target: document.body,
        debounceMs: 250,
        onMutation: (records) => {
          const hasNewContent = records.some(
            (r) => r.type === "childList" && r.addedNodes.length > 0,
          );

          if (hasNewContent) {
            const domSignals = extractDomSignals();
            const bodyText = document.body?.innerText?.slice(0, 5000) ?? "";

            sendMessage(MessageType.SCAN_REQUEST, {
              url: window.location.href,
              title: document.title,
              timestamp: Date.now(),
              domSignals,
              pageText: bodyText,
            });
          }
        },
      });
    }

    // Listen for SCAN_RESULT from the service worker
    onMessage(MessageType.SCAN_RESULT, (payload: unknown) => {
      const verdict = payload as ScanVerdict;
      if (verdict.shouldWarn) {
        const host = document.createElement("sentinellium-warning");

        const overlay = new WarningOverlay({
          severity: mapSeverity(verdict.level as ThreatLevel),
          score: verdict.score,
          domain: verdict.domain,
          signals: verdict.triggeredSignals,
          onDismiss: () => host.remove(),
          onReport: () => console.log("Threat reported", verdict),
          onProceed: () => host.remove(),
        });

        // Inject via Shadow DOM for style isolation
        const shadow = host.attachShadow({ mode: "closed" });
        shadow.innerHTML = overlay.buildHtml();

        // Attach action handlers
        shadow.querySelectorAll("[data-action]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const action = btn.getAttribute("data-action");
            const actions = overlay.getActions();
            const matched = actions.find((a) => a.id === action);
            matched?.handler();
          });
        });

        document.documentElement.appendChild(host);
      }
    });

    /* ── DLP: Input Interception ── */

    function setupDlpInterception() {
      const domain = window.location.hostname;

      // Listen for paste events globally
      document.addEventListener("paste", (event) => {
        const text = event.clipboardData?.getData("text") ?? "";
        if (!text) return;

        const result = handleDlpScan({
          domain,
          text,
          elementType: (event.target as HTMLElement)?.tagName ?? "UNKNOWN",
          isPaste: true,
        });

        if (result.shouldIntervene) {
          event.preventDefault();

          const piiSummary = result.piiMatches.reduce(
            (acc: Record<string, number>, match: { type: string }) => {
              acc[match.type] = (acc[match.type] ?? 0) + 1;
              return acc;
            },
            {},
          );

          const modalHtml = interventionUi.buildModal({
            domain,
            platform: result.platform ?? "Unknown LLM",
            piiSummary: Object.entries(piiSummary).map(([type, count]) => ({
              type: type as Parameters<
                typeof interventionUi.buildModal
              >[0]["piiSummary"][0]["type"],
              count: count as number,
            })),
          });

          // Inject intervention modal via Shadow DOM
          const host = document.createElement("sentinellium-dlp-modal");
          const shadow = host.attachShadow({ mode: "closed" });
          shadow.innerHTML = modalHtml;
          document.documentElement.appendChild(host);

          // Handle button clicks
          shadow.addEventListener("click", (e) => {
            const target = e.target as HTMLElement;
            const action = target.getAttribute("data-action");
            if (action) {
              host.remove();
            }
          });
        }
      });
    }

    /* ── C2PA: Media Scanning ── */

    function scanMediaForProvenance() {
      const images = document.querySelectorAll("img, video");
      const mediaElements: RawMediaElement[] = [];

      images.forEach((el) => {
        const img = el as HTMLImageElement;
        mediaElements.push({
          tagName: el.tagName,
          src: img.src || img.currentSrc || "",
          width: img.naturalWidth || img.width || 0,
          height: img.naturalHeight || img.height || 0,
          alt: img.alt || "",
        });
      });

      if (mediaElements.length === 0) return;

      const result = handleC2paScan({
        domain: window.location.hostname,
        pageTitle: document.title,
        pageText: document.body?.innerText?.slice(0, 2000) ?? "",
        url: window.location.href,
        mediaElements,
      });

      // Flag unverified media in high-stakes contexts
      result.mediaResults.forEach((mediaVerdict) => {
        if (mediaVerdict.shouldFlag) {
          const filename = mediaVerdict.url.split("/").pop() ?? "unknown media";
          const indicatorHtml = unverifiedFlagger.buildIndicatorHtml(filename);

          // Find the matching image element and inject indicator
          const matchingImg = document.querySelector(
            `img[src="${mediaVerdict.url}"]`,
          );
          if (matchingImg) {
            const wrapper = document.createElement("sentinellium-c2pa-badge");
            wrapper.style.position = "relative";
            wrapper.style.display = "inline-block";
            const shadow = wrapper.attachShadow({ mode: "closed" });
            shadow.innerHTML = indicatorHtml;
            matchingImg.parentElement?.insertBefore(wrapper, matchingImg);
            wrapper.appendChild(matchingImg);
          }
        }
      });
    }

    /* ── Initialize ── */

    startObserving();
    setupDlpInterception();

    // Delay C2PA scanning to let images load
    setTimeout(scanMediaForProvenance, 2000);

    console.log("Sentinellium content script loaded", {
      url: window.location.href,
      engines: ["phishing", "dlp", "c2pa"],
    });
  },
});
