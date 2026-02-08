/**
 * @module DOM Extractor
 * @description Extracts phishing-relevant content from page DOM.
 * Designed to run in the content script context and produce a
 * structured PageContent object for the inference pipeline.
 */

/* ── Types ── */

/** Complete extraction result for a single page. */
export interface PageContent {
  url: string;
  title: string;
  text: string;
  forms: FormData[];
  links: LinkData[];
  brandSignals: BrandSignals;
}

/** Extracted form metadata. */
export interface FormData {
  action: string;
  method: string;
  hasPasswordField: boolean;
  hasCreditCardField: boolean;
  inputCount: number;
}

/** Extracted link metadata. */
export interface LinkData {
  href: string;
  text: string;
  mismatch: boolean;
}

/** Brand impersonation signals. */
export interface BrandSignals {
  detectedBrands: string[];
  brandDomainMismatch: boolean;
}

/* ── Constants ── */

const MAX_TEXT_LENGTH = 10000;

/** Brands to scan for in page content. */
const BRAND_NAMES = [
  "google",
  "microsoft",
  "apple",
  "amazon",
  "facebook",
  "netflix",
  "paypal",
  "instagram",
  "twitter",
  "linkedin",
  "github",
  "dropbox",
  "chase",
  "wellsfargo",
  "bankofamerica",
  "outlook",
  "yahoo",
  "icloud",
] as const;

/** Keywords indicating a credit card input. */
const CC_INDICATORS = [
  "cc-number",
  "card-number",
  "cardnumber",
  "cc-num",
  "credit-card",
  "creditcard",
  "card_number",
  "ccnumber",
];

/* ── Extractors ── */

/**
 * Extract visible text content from a DOM element.
 * Truncates to MAX_TEXT_LENGTH to prevent oversized payloads.
 */
export function extractTextContent(root: Element): string {
  const text = (root.textContent ?? "").trim();
  if (text.length === 0) return "";
  return text.slice(0, MAX_TEXT_LENGTH);
}

/**
 * Extract form metadata from the DOM.
 * Identifies password fields, credit card fields, and form targets.
 */
export function extractForms(root: Element): FormData[] {
  const forms = root.querySelectorAll("form");
  const results: FormData[] = [];

  for (let i = 0; i < forms.length; i++) {
    const form = forms[i];
    if (!form) continue;

    const inputs = form.querySelectorAll("input");
    let hasPassword = false;
    let hasCreditCard = false;
    let inputCount = 0;

    for (let j = 0; j < inputs.length; j++) {
      const input = inputs[j];
      if (!input) continue;
      inputCount++;

      const type = (input.getAttribute("type") ?? "").toLowerCase();
      const name = (input.getAttribute("name") ?? "").toLowerCase();
      const autocomplete = (
        input.getAttribute("autocomplete") ?? ""
      ).toLowerCase();

      if (type === "password") {
        hasPassword = true;
      }

      if (
        CC_INDICATORS.some(
          (indicator) =>
            name.includes(indicator) || autocomplete.includes(indicator),
        )
      ) {
        hasCreditCard = true;
      }
    }

    results.push({
      action: form.getAttribute("action") ?? "",
      method: (form.getAttribute("method") ?? "GET").toUpperCase(),
      hasPasswordField: hasPassword,
      hasCreditCardField: hasCreditCard,
      inputCount,
    });
  }

  return results;
}

/**
 * Extract link metadata from the DOM.
 * Flags links where the displayed text looks like a URL
 * but doesn't match the actual href domain.
 */
export function extractLinks(root: Element): LinkData[] {
  const anchors = root.querySelectorAll("a");
  const results: LinkData[] = [];

  for (let i = 0; i < anchors.length; i++) {
    const anchor = anchors[i];
    if (!anchor) continue;

    const href = anchor.getAttribute("href") ?? "";
    const text = (anchor.textContent ?? "").trim();

    // Check for href/text domain mismatch
    const mismatch = detectLinkMismatch(href, text);

    results.push({ href, text, mismatch });
  }

  return results;
}

/**
 * Detect brand impersonation signals from page title and URL.
 * - Which brands are mentioned in the title
 * - Whether title brands match the actual domain
 */
export function extractBrandSignals(title: string, url: string): BrandSignals {
  const titleLower = title.toLowerCase();
  const urlLower = url.toLowerCase();

  // Find brands mentioned in the title
  const detectedBrands = BRAND_NAMES.filter((brand) =>
    titleLower.includes(brand),
  );

  // Check if any detected brand matches the URL domain
  let brandDomainMismatch = false;
  if (detectedBrands.length > 0) {
    const anyMatch = detectedBrands.some((brand) => urlLower.includes(brand));
    brandDomainMismatch = !anyMatch;
  }

  return {
    detectedBrands: [...detectedBrands],
    brandDomainMismatch,
  };
}

/* ── Orchestrator ── */

/**
 * Extract all phishing-relevant content from a page.
 * Main entry point called by the content script.
 *
 * @param root - The root DOM element (usually document.body)
 * @param title - The page title (document.title)
 * @param url - The page URL (location.href)
 */
export function extractPageContent(
  root: Element,
  title: string,
  url: string,
): PageContent {
  return {
    url,
    title,
    text: extractTextContent(root),
    forms: extractForms(root),
    links: extractLinks(root),
    brandSignals: extractBrandSignals(title, url),
  };
}

/* ── Helpers ── */

/**
 * Detect if a link's displayed text looks like a URL
 * but points to a different domain than displayed.
 */
function detectLinkMismatch(href: string, text: string): boolean {
  // Only check if the text looks like a URL
  if (
    !text.startsWith("http://") &&
    !text.startsWith("https://") &&
    !text.startsWith("www.")
  ) {
    return false;
  }

  try {
    const textUrl = text.startsWith("www.") ? `https://${text}` : text;
    const hrefDomain = new URL(href).hostname.replace(/^www\./, "");
    const textDomain = new URL(textUrl).hostname.replace(/^www\./, "");
    return hrefDomain !== textDomain;
  } catch {
    return false;
  }
}
