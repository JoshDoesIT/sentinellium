/**
 * @module Notification Dispatcher
 * @description Routes alerts to notification channels (email, Slack, webhook).
 * Filters by severity threshold per channel.
 */
import { AlertSeverity } from "./alert-aggregator";

/* ── Types ── */

/** Notification channel type. */
export enum NotificationChannel {
  EMAIL = "EMAIL",
  SLACK = "SLACK",
  WEBHOOK = "WEBHOOK",
}

/** Channel configuration. */
export interface ChannelConfig {
  type: NotificationChannel;
  url: string;
  minSeverity: AlertSeverity;
}

/** Notification payload input. */
export interface NotificationInput {
  severity: AlertSeverity;
  title: string;
  domain: string;
}

/** Dispatcher configuration. */
interface DispatcherConfig {
  channels: ChannelConfig[];
  fetchFn: typeof fetch;
}

/* ── Constants ── */

const SEVERITY_ORDER: Record<AlertSeverity, number> = {
  [AlertSeverity.CRITICAL]: 0,
  [AlertSeverity.HIGH]: 1,
  [AlertSeverity.MEDIUM]: 2,
  [AlertSeverity.LOW]: 3,
  [AlertSeverity.INFO]: 4,
};

/* ── Dispatcher ── */

/**
 * Routes alerts to configured notification channels.
 */
export class NotificationDispatcher {
  private readonly config: DispatcherConfig;

  constructor(config: DispatcherConfig) {
    this.config = config;
  }

  /**
   * Get channels eligible for a given severity.
   *
   * @param severity - Alert severity
   * @returns Channels whose threshold is at or below severity
   */
  getEligibleChannels(severity: AlertSeverity): ChannelConfig[] {
    const order = SEVERITY_ORDER[severity];
    return this.config.channels.filter(
      (ch) => SEVERITY_ORDER[ch.minSeverity] >= order,
    );
  }

  /**
   * Dispatch a notification to all eligible channels.
   *
   * @param input - Alert notification data
   */
  async dispatch(input: NotificationInput): Promise<void> {
    const channels = this.getEligibleChannels(input.severity);
    await Promise.allSettled(
      channels.map((ch) =>
        this.config.fetchFn(ch.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: this.buildPayload(ch.type, input),
        }),
      ),
    );
  }

  /**
   * Build the JSON payload for a channel.
   *
   * @param channel - Channel type
   * @param input - Notification data
   * @returns JSON string
   */
  buildPayload(channel: NotificationChannel, input: NotificationInput): string {
    if (channel === NotificationChannel.SLACK) {
      return JSON.stringify({
        text: `🚨 *${input.severity}* — ${input.title}\nDomain: ${input.domain}`,
      });
    }

    // Default webhook / email payload
    return JSON.stringify({
      severity: input.severity,
      title: input.title,
      domain: input.domain,
      timestamp: new Date().toISOString(),
    });
  }
}
