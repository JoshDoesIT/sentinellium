/**
 * @module LLM Domain Monitor
 * @description Detects when the user is on a public AI/LLM platform.
 * Maintains a configurable list of known LLM domains and classifies
 * each by risk level.
 */

/* ── Types ── */

/** Domain risk level for DLP purposes. */
export enum DomainRisk {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
  NONE = "NONE",
}

/** Classification result for a domain. */
export interface DomainClassification {
  isLlm: boolean;
  platform: string | null;
  risk: DomainRisk;
  domain: string;
}

/** A monitored domain entry. */
export interface MonitoredDomain {
  domain: string;
  platform: string;
  risk: DomainRisk;
}

/** Monitor configuration. */
export interface LlmMonitorConfig {
  additionalDomains?: MonitoredDomain[];
}

/* ── Known LLM Domains ── */

const KNOWN_LLM_DOMAINS: MonitoredDomain[] = [
  { domain: "chatgpt.com", platform: "ChatGPT", risk: DomainRisk.HIGH },
  { domain: "chat.openai.com", platform: "ChatGPT", risk: DomainRisk.HIGH },
  { domain: "openai.com", platform: "OpenAI", risk: DomainRisk.HIGH },
  { domain: "claude.ai", platform: "Claude", risk: DomainRisk.HIGH },
  { domain: "gemini.google.com", platform: "Gemini", risk: DomainRisk.HIGH },
  {
    domain: "aistudio.google.com",
    platform: "AI Studio",
    risk: DomainRisk.HIGH,
  },
  {
    domain: "copilot.microsoft.com",
    platform: "Copilot",
    risk: DomainRisk.HIGH,
  },
  { domain: "bing.com", platform: "Bing Chat", risk: DomainRisk.MEDIUM },
  { domain: "huggingface.co", platform: "Hugging Face", risk: DomainRisk.HIGH },
  { domain: "poe.com", platform: "Poe", risk: DomainRisk.HIGH },
  { domain: "perplexity.ai", platform: "Perplexity", risk: DomainRisk.HIGH },
  { domain: "you.com", platform: "You.com", risk: DomainRisk.MEDIUM },
  { domain: "groq.com", platform: "Groq", risk: DomainRisk.HIGH },
  { domain: "mistral.ai", platform: "Mistral", risk: DomainRisk.HIGH },
  { domain: "deepseek.com", platform: "DeepSeek", risk: DomainRisk.HIGH },
  { domain: "github.com", platform: "GitHub Copilot", risk: DomainRisk.MEDIUM },
  { domain: "replit.com", platform: "Replit AI", risk: DomainRisk.MEDIUM },
];

/* ── Monitor ── */

/**
 * Classifies domains as LLM platforms with risk levels.
 */
export class LlmDomainMonitor {
  private readonly domains: MonitoredDomain[];

  constructor(config?: LlmMonitorConfig) {
    this.domains = [...KNOWN_LLM_DOMAINS, ...(config?.additionalDomains ?? [])];
  }

  /**
   * Classify a domain for LLM risk.
   *
   * @param domain - The domain to classify
   * @returns Classification with platform name and risk level
   */
  classify(domain: string): DomainClassification {
    const domainLower = domain.toLowerCase();

    for (const entry of this.domains) {
      if (
        domainLower === entry.domain ||
        domainLower.endsWith(`.${entry.domain}`)
      ) {
        return {
          isLlm: true,
          platform: entry.platform,
          risk: entry.risk,
          domain: domainLower,
        };
      }
    }

    return {
      isLlm: false,
      platform: null,
      risk: DomainRisk.NONE,
      domain: domainLower,
    };
  }
}
