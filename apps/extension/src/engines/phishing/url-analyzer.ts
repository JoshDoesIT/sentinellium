/**
 * @module URL Analyzer
 * @description Detects suspicious URL patterns without ML inference.
 * Analyzes homoglyphs, typosquatting, suspicious TLDs, subdomain abuse,
 * IP-based URLs, and dangerous URI schemes to produce a risk score.
 */

/* ── Types ── */

/** Risk level classification for a URL. */
export enum UrlRiskLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

/** Result of analyzing a single URL. */
export interface UrlAnalysisResult {
  url: string;
  score: number;
  riskLevel: UrlRiskLevel;
  signals: string[];
}

/** Sub-analysis result from an individual detector. */
interface DetectionResult {
  detected: boolean;
  score: number;
}

/** Typosquat detection result with matched brand info. */
interface TyposquatResult extends DetectionResult {
  matchedBrand?: string;
}

/* ── Constants ── */

/**
 * Cyrillic characters that visually resemble Latin characters.
 * Maps Cyrillic code point to the Latin character it mimics.
 */
const CYRILLIC_LOOKALIKES: Map<string, string> = new Map([
  ["\u0430", "a"], // а → a
  ["\u0435", "e"], // е → e
  ["\u043E", "o"], // о → o
  ["\u0440", "p"], // р → p
  ["\u0441", "c"], // с → c
  ["\u0443", "y"], // у → y
  ["\u0445", "x"], // х → x
  ["\u043D", "h"], // н → h (less common)
  ["\u0456", "i"], // і → i (Ukrainian)
  ["\u0458", "j"], // ј → j (Serbian)
  ["\u0455", "s"], // ѕ → s (Macedonian)
  ["\u0501", "d"], // ԁ → d
]);

/** Top domains for typosquatting comparison. */
const TARGET_BRANDS: string[] = [
  "google.com",
  "facebook.com",
  "microsoft.com",
  "apple.com",
  "amazon.com",
  "netflix.com",
  "paypal.com",
  "instagram.com",
  "twitter.com",
  "linkedin.com",
  "github.com",
  "dropbox.com",
  "chase.com",
  "bankofamerica.com",
  "wellsfargo.com",
  "outlook.com",
  "yahoo.com",
  "icloud.com",
];

/** TLDs commonly abused in phishing. Higher score = more suspicious. */
const SUSPICIOUS_TLDS: Record<string, number> = {
  tk: 25,
  ml: 25,
  ga: 25,
  cf: 25,
  gq: 25,
  top: 20,
  xyz: 15,
  buzz: 15,
  club: 15,
  work: 15,
  icu: 15,
  online: 10,
  site: 10,
  info: 10,
  biz: 10,
  click: 10,
  link: 10,
  live: 5,
  store: 5,
  space: 5,
};

/** Well-known safe TLDs (score: 0). */
const SAFE_TLDS = new Set([
  "com",
  "org",
  "net",
  "edu",
  "gov",
  "mil",
  "int",
  "co",
  "io",
  "dev",
  "app",
]);

/** Brand subdomains that attackers commonly impersonate. */
const BRAND_KEYWORDS = new Set([
  "login",
  "signin",
  "account",
  "secure",
  "verify",
  "update",
  "confirm",
  "microsoft",
  "google",
  "apple",
  "amazon",
  "paypal",
  "bank",
  "chase",
  "netflix",
]);

/* ── Detectors ── */

/**
 * Detect Cyrillic/Latin homoglyph attacks in a domain.
 * Mixed-script domains (some Latin + some Cyrillic) are flagged.
 * Fully consistent-script domains (all Cyrillic IDN) are allowed.
 */
export function detectHomoglyphs(domain: string): DetectionResult {
  let hasLatin = false;
  let hasCyrillic = false;
  let cyrillicCount = 0;
  let latinCount = 0;

  for (const char of domain) {
    if (char === "." || char === "-") continue;

    if (CYRILLIC_LOOKALIKES.has(char) || isCyrillicRange(char)) {
      hasCyrillic = true;
      cyrillicCount++;
    } else if (/[a-zA-Z]/.test(char)) {
      hasLatin = true;
      latinCount++;
    }
  }

  // Mixed script = homoglyph attack
  if (hasLatin && hasCyrillic) {
    return { detected: true, score: 40 };
  }

  // Pure Cyrillic with lookalikes and targeting a known Latin domain
  if (hasCyrillic && !hasLatin && cyrillicCount > 0 && latinCount === 0) {
    // Check if the domain normalizes to a known brand
    const normalized = normalizeDomain(domain);
    const matchesBrand = TARGET_BRANDS.some((brand) => {
      const brandBase = brand.split(".")[0] ?? "";
      return normalized === brandBase;
    });
    if (matchesBrand) {
      return { detected: true, score: 35 };
    }
  }

  return { detected: false, score: 0 };
}

/**
 * Detect typosquatting by comparing the domain against known brands
 * using Levenshtein distance.
 */
export function detectTyposquat(domain: string): TyposquatResult {
  const domainBase = domain.toLowerCase();

  // Too short to meaningfully compare
  if (domainBase.length < 4) {
    return { detected: false, score: 0 };
  }

  for (const brand of TARGET_BRANDS) {
    if (domainBase === brand) continue; // Exact match = not a typosquat

    const brandBase = brand.split(".")[0] ?? "";
    const domainName = domainBase.split(".")[0] ?? "";

    // Skip if lengths differ by more than 2
    if (Math.abs(brandBase.length - domainName.length) > 2) continue;

    const distance = levenshtein(domainName, brandBase);

    // Close match: 1-2 edits away from a known brand
    if (distance > 0 && distance <= 2) {
      return {
        detected: true,
        score: distance === 1 ? 30 : 20,
        matchedBrand: brand,
      };
    }
  }

  return { detected: false, score: 0 };
}

/**
 * Score a TLD based on phishing abuse frequency.
 * Returns 0 for known-safe TLDs, higher scores for suspicious ones.
 */
export function scoreTld(tld: string): number {
  const normalized = tld.toLowerCase();
  if (SAFE_TLDS.has(normalized)) return 0;
  return SUSPICIOUS_TLDS[normalized] ?? 5; // Unknown TLDs get a baseline score
}

/**
 * Detect subdomain abuse patterns:
 * - Brand names used as subdomains of unrelated domains
 * - Excessive subdomain depth (>3 levels)
 */
export function detectSubdomainAbuse(hostname: string): DetectionResult {
  const parts = hostname.split(".");

  // Excessive depth: more than 4 parts (e.g. a.b.c.d.example.com = 6)
  if (parts.length > 4) {
    return { detected: true, score: 15 };
  }

  // Check if brand keywords appear in subdomains but NOT in the registered domain
  if (parts.length >= 3) {
    // Registered domain is the last 2 parts (e.g. "example.com")
    const subdomains = parts.slice(0, -2);
    const registeredDomain = parts.slice(-2).join(".");

    const hasBrandSubdomain = subdomains.some((sub) =>
      BRAND_KEYWORDS.has(sub.toLowerCase()),
    );
    const isActualBrand = TARGET_BRANDS.some(
      (brand) => registeredDomain === brand || hostname.endsWith(`.${brand}`),
    );

    if (hasBrandSubdomain && !isActualBrand) {
      return { detected: true, score: 25 };
    }
  }

  return { detected: false, score: 0 };
}

/**
 * Detect IP-based URLs (IPv4, IPv6, decimal-encoded).
 */
export function detectIpUrl(hostname: string): DetectionResult {
  // IPv4: 192.168.1.1
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
    return { detected: true, score: 20 };
  }

  // IPv6: [::1] or [2001:db8::1]
  if (/^\[.*\]$/.test(hostname)) {
    return { detected: true, score: 20 };
  }

  // Decimal-encoded IP: single large number
  if (/^\d{7,10}$/.test(hostname)) {
    const num = parseInt(hostname, 10);
    if (num > 0 && num <= 4294967295) {
      return { detected: true, score: 25 };
    }
  }

  return { detected: false, score: 0 };
}

/**
 * Detect dangerous URI schemes (javascript:, vbscript:, data:).
 */
export function detectDangerousScheme(url: string): DetectionResult {
  const lower = url.toLowerCase().trim();

  if (lower.startsWith("javascript:")) {
    return { detected: true, score: 50 };
  }

  if (lower.startsWith("vbscript:")) {
    return { detected: true, score: 50 };
  }

  if (lower.startsWith("data:")) {
    return { detected: true, score: 40 };
  }

  return { detected: false, score: 0 };
}

/* ── Orchestrator ── */

/**
 * Analyze a URL for phishing indicators.
 * Combines all sub-detectors into a single risk assessment.
 *
 * @param rawUrl - The URL to analyze
 * @returns Aggregated analysis result with score, risk level, and triggered signals
 */
export function analyzeUrl(rawUrl: string): UrlAnalysisResult {
  const signals: string[] = [];
  let totalScore = 0;

  // Check dangerous schemes first (javascript:, vbscript:, data:)
  const schemeResult = detectDangerousScheme(rawUrl);
  if (schemeResult.detected) {
    signals.push("dangerous_scheme");
    totalScore += schemeResult.score;
  }

  // Parse the URL
  let hostname: string;
  let rawHostname: string;
  let tld: string;

  try {
    // Extract raw hostname before URL() punycode-encodes Unicode chars
    rawHostname = extractRawHostname(rawUrl);
    const parsed = new URL(rawUrl);
    hostname = parsed.hostname;
    tld = hostname.split(".").pop() ?? "";
  } catch {
    // Malformed URL
    return {
      url: rawUrl,
      score: 30,
      riskLevel: UrlRiskLevel.MEDIUM,
      signals: ["malformed"],
    };
  }

  // Use raw (pre-punycode) hostname for homoglyph detection
  const homoglyphResult = detectHomoglyphs(rawHostname);
  if (homoglyphResult.detected) {
    signals.push("homoglyph");
    totalScore += homoglyphResult.score;
  }

  // Strip www. for typosquat comparison
  const domainForTyposquat = stripWww(rawHostname);
  const typosquatResult = detectTyposquat(domainForTyposquat);
  if (typosquatResult.detected) {
    signals.push("typosquat");
    totalScore += typosquatResult.score;
  }

  const tldScore = scoreTld(tld);
  if (tldScore > 0) {
    signals.push("suspicious_tld");
    totalScore += tldScore;
  }

  const subdomainResult = detectSubdomainAbuse(hostname);
  if (subdomainResult.detected) {
    signals.push("subdomain_abuse");
    totalScore += subdomainResult.score;
  }

  const ipResult = detectIpUrl(hostname);
  if (ipResult.detected) {
    signals.push("ip_url");
    totalScore += ipResult.score;
  }

  return {
    url: rawUrl,
    score: totalScore,
    riskLevel: scoreToRiskLevel(totalScore),
    signals,
  };
}

/* ── Helpers ── */

/** Convert a numeric score to a risk level. */
function scoreToRiskLevel(score: number): UrlRiskLevel {
  if (score >= 50) return UrlRiskLevel.CRITICAL;
  if (score >= 30) return UrlRiskLevel.HIGH;
  if (score >= 15) return UrlRiskLevel.MEDIUM;
  return UrlRiskLevel.LOW;
}

/** Check if a character is in the Cyrillic Unicode block. */
function isCyrillicRange(char: string): boolean {
  const code = char.charCodeAt(0);
  return (
    (code >= 0x0400 && code <= 0x04ff) || (code >= 0x0500 && code <= 0x052f)
  );
}

/** Normalize a domain by replacing Cyrillic lookalikes with Latin equivalents. */
function normalizeDomain(domain: string): string {
  let result = "";
  for (const char of domain) {
    if (char === "." || char === "-") continue;
    const latin = CYRILLIC_LOOKALIKES.get(char);
    result += latin ?? char;
  }
  return result;
}

/**
 * Extract the raw hostname from a URL string without punycode encoding.
 * `new URL()` converts Cyrillic chars to xn-- which defeats homoglyph detection.
 */
function extractRawHostname(rawUrl: string): string {
  // Strip protocol
  let host = rawUrl.replace(/^https?:\/\//, "");
  // Strip path, query, fragment
  host = host.split("/")[0] ?? host;
  host = host.split("?")[0] ?? host;
  host = host.split("#")[0] ?? host;
  // Strip port
  host = host.split(":")[0] ?? host;
  // Strip auth (user:pass@)
  if (host.includes("@")) {
    host = host.split("@").pop() ?? host;
  }
  return host;
}

/** Strip www. prefix from a hostname. */
function stripWww(hostname: string): string {
  return hostname.replace(/^www\./i, "");
}

/**
 * Compute Levenshtein distance between two strings.
 * Used for typosquat detection.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  // Optimization: early exit for identical strings
  if (a === b) return 0;
  if (m === 0) return n;
  if (n === 0) return m;

  // Single-row DP
  const row: number[] = Array.from({ length: n + 1 }, (_, i) => i);

  for (let i = 1; i <= m; i++) {
    let prev = i;
    for (let j = 1; j <= n; j++) {
      const cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
      const current = Math.min(
        (row[j] ?? 0) + 1, // deletion
        prev + 1, // insertion
        (row[j - 1] ?? 0) + cost, // substitution
      );
      row[j - 1] = prev;
      prev = current;
    }
    row[n] = prev;
  }

  return row[n] ?? 0;
}
