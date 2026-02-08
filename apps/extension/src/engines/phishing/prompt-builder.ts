/**
 * @module Prompt Builder
 * @description Constructs structured prompts from extracted page
 * features and URL analysis results. Builds system + user prompt
 * pairs for the phishing classification model with token budgeting.
 */
import type { PageContent, FormData as ExtractedForm } from "./dom-extractor";
import type { UrlAnalysisResult } from "./url-analyzer";

/* ── Types ── */

/** A structured prompt ready for model inference. */
export interface PromptPair {
  /** System instructions for the classification model. */
  system: string;
  /** User message containing the page analysis data. */
  user: string;
}

/* ── Constants ── */

/**
 * Approximate chars-per-token ratio for English text.
 * Conservative estimate (actual depends on tokenizer).
 */
const CHARS_PER_TOKEN = 4;

/** Default max token budget for the user message. */
const DEFAULT_TOKEN_BUDGET = 1500;

/* ── System Prompt ── */

/**
 * Build the system prompt with classification instructions.
 * This is static and reused across all inference calls.
 */
export function buildSystemPrompt(): string {
  return `You are a phishing detection classifier. Analyze the provided web page features and determine whether the page is a phishing attempt.

Your classification must be one of:
- SAFE: Legitimate page with no suspicious indicators
- SUSPICIOUS: Some concerning signals but not conclusive
- LIKELY_PHISHING: Multiple strong indicators of phishing
- CONFIRMED_PHISHING: Clear phishing attempt with high confidence

Respond with a JSON object containing:
- "classification": one of the above labels
- "confidence": a number between 0 and 1
- "reasoning": a brief explanation of your decision

Focus on these key phishing indicators:
1. Brand impersonation (title/content claims to be a known brand but domain doesn't match)
2. Credential harvesting (login forms submitting to suspicious domains)
3. URL manipulation (homoglyphs, typosquatting, suspicious TLDs)
4. Urgency tactics (threats of account closure, time pressure)
5. Link deception (displayed URLs differ from actual destinations)`;
}

/* ── Feature Formatting ── */

/**
 * Format extracted page content into a structured text block.
 * Includes title, URL, form analysis, link data, and brand signals.
 */
export function formatPageFeatures(page: PageContent): string {
  const sections: string[] = [];

  // Header
  sections.push(`## Page Analysis`);
  sections.push(`- URL: ${page.url}`);
  sections.push(`- Title: ${page.title}`);

  // Text content (truncated)
  if (page.text.length > 0) {
    const truncatedText =
      page.text.length > 500 ? page.text.slice(0, 500) + "..." : page.text;
    sections.push(`\n### Page Content\n${truncatedText}`);
  }

  // Forms
  if (page.forms.length > 0) {
    sections.push(`\n### Forms Found: ${page.forms.length}`);
    for (const form of page.forms) {
      sections.push(formatForm(form));
    }
  }

  // Links with mismatches
  const mismatchedLinks = page.links.filter((l) => l.mismatch);
  if (mismatchedLinks.length > 0) {
    sections.push(`\n### Suspicious Links (href/text mismatch)`);
    for (const link of mismatchedLinks) {
      sections.push(`- Displays: "${link.text}" → Actually: ${link.href}`);
    }
  }

  // Brand signals
  if (page.brandSignals.detectedBrands.length > 0) {
    sections.push(
      `\n### Brand Signals\n- Detected brands: ${page.brandSignals.detectedBrands.join(", ")}`,
    );
    if (page.brandSignals.brandDomainMismatch) {
      sections.push(
        `- ⚠ Brand/domain mismatch: page references brand but domain does not match`,
      );
    }
  }

  return sections.join("\n");
}

/**
 * Format URL analysis results into a structured text block.
 */
export function formatUrlSignals(analysis: UrlAnalysisResult): string {
  const sections: string[] = [];

  sections.push(`## URL Analysis`);
  sections.push(`- Risk Level: ${analysis.riskLevel}`);
  sections.push(`- Risk Score: ${analysis.score}`);

  if (analysis.signals.length > 0) {
    sections.push(`- Triggered Signals: ${analysis.signals.join(", ")}`);
  } else {
    sections.push(`- Triggered Signals: none`);
  }

  return sections.join("\n");
}

/* ── Token Budget ── */

/**
 * Truncate text to approximate a token budget.
 * Uses a conservative chars-per-token estimate.
 *
 * @param text - The text to truncate
 * @param maxTokens - Maximum number of tokens allowed
 * @returns Truncated text with [TRUNCATED] marker if shortened
 */
export function truncateToTokenBudget(text: string, maxTokens: number): string {
  const maxChars = maxTokens * CHARS_PER_TOKEN;

  if (text.length <= maxChars) {
    return text;
  }

  const marker = "\n\n[TRUNCATED]";
  return text.slice(0, maxChars - marker.length) + marker;
}

/* ── Orchestrator ── */

/**
 * Build a complete prompt pair from page content and URL analysis.
 * Main entry point for the inference pipeline.
 *
 * @param page - Extracted page content from dom-extractor
 * @param urlAnalysis - URL analysis results from url-analyzer
 * @param tokenBudget - Maximum tokens for user message (default: 1500)
 * @returns A PromptPair with system and user messages
 */
export function buildPrompt(
  page: PageContent,
  urlAnalysis: UrlAnalysisResult,
  tokenBudget: number = DEFAULT_TOKEN_BUDGET,
): PromptPair {
  const system = buildSystemPrompt();

  const pageFeatures = formatPageFeatures(page);
  const urlSignals = formatUrlSignals(urlAnalysis);
  const rawUser = `${pageFeatures}\n\n${urlSignals}`;
  const user = truncateToTokenBudget(rawUser, tokenBudget);

  return { system, user };
}

/* ── Helpers ── */

/** Format a single form for prompt display. */
function formatForm(form: ExtractedForm): string {
  const parts: string[] = [];
  parts.push(`- Action: ${form.action || "(none)"}`);
  parts.push(`  Method: ${form.method}`);
  parts.push(`  Inputs: ${form.inputCount}`);

  if (form.hasPasswordField) {
    parts.push(`  ⚠ Contains password field`);
  }
  if (form.hasCreditCardField) {
    parts.push(`  ⚠ Contains credit card field`);
  }

  return parts.join("\n");
}
