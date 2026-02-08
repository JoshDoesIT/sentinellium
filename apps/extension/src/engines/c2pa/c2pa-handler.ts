/**
 * @module C2PA Handler
 * @description Orchestrates the C2PA/deepfake defense pipeline.
 * Chains media-scanner → high-stakes-detector → unverified-flagger
 * to produce flagging decisions for media on the current page.
 *
 * Manifest validation (fetching blobs + C2PA SDK) is async and
 * runs in the background service worker. This synchronous handler
 * covers context classification, media discovery, and flagging
 * decisions — the first pass before async validation.
 */
import {
  MediaScanner,
  type RawMediaElement,
  type MediaElement,
} from "./media-scanner";
import {
  HighStakesDetector,
  ContextLevel,
  type PageContext,
} from "./high-stakes-detector";
import { UnverifiedFlagger, type FlagConfig } from "./unverified-flagger";

/* ── Types ── */

/** Input for the C2PA scan pipeline. */
export interface C2paScanRequest {
  domain: string;
  pageTitle: string;
  pageText: string;
  url: string;
  mediaElements: RawMediaElement[];
}

/** Per-media verdict from the pipeline. */
export interface C2paMediaVerdict {
  url: string;
  type: string;
  shouldFlag: boolean;
  flagReason: string;
}

/** Full result of the C2PA scan. */
export interface C2paScanResult {
  domain: string;
  contextLevel: ContextLevel;
  contextSignals: string[];
  mediaResults: C2paMediaVerdict[];
}

/* ── Shared Instances ── */

const mediaScanner = new MediaScanner();
const contextDetector = new HighStakesDetector();
const flagger = new UnverifiedFlagger();

/* ── Handler ── */

/**
 * Process a C2PA scan request through the deepfake defense pipeline.
 *
 * @param request - Page context and media elements from the content script
 * @returns Scan result with context classification and per-media verdicts
 */
export function handleC2paScan(request: C2paScanRequest): C2paScanResult {
  const { domain, pageTitle, pageText, url, mediaElements } = request;

  // 1. Classify page context (news, financial, legal, normal)
  const pageContext: PageContext = { domain, pageTitle, pageText, url };
  const contextResult = contextDetector.classify(pageContext);

  // 2. Scan DOM for qualifying media (filter tracking pixels, dedup)
  const discovered: MediaElement[] = mediaScanner.scanElements(mediaElements);

  // 3. For each discovered media, decide whether to flag
  const isHighStakes = contextResult.level === ContextLevel.HIGH_STAKES;
  const isElevated = contextResult.level === ContextLevel.ELEVATED;

  const mediaResults: C2paMediaVerdict[] = discovered.map((media) => {
    // Build flag config
    const flagConfig: FlagConfig = {
      domain,
      contextKeywords: contextResult.signals,
      isHighStakes: isHighStakes || isElevated,
    };

    const flagResult = flagger.shouldFlag(flagConfig);

    return {
      url: media.url,
      type: media.type,
      shouldFlag: flagResult.shouldFlag,
      flagReason: flagResult.reason,
    };
  });

  return {
    domain,
    contextLevel: contextResult.level,
    contextSignals: contextResult.signals,
    mediaResults,
  };
}
