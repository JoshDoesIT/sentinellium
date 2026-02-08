/**
 * @module Notification Service Client
 * @description Async notification delivery via webhooks, email, and Slack.
 * Supports fan-out to multiple channels and delivery tracking.
 */

/* ── Types ── */

export const NotificationChannel = {
  WEBHOOK: "WEBHOOK",
  EMAIL: "EMAIL",
  SLACK: "SLACK",
} as const;

export type NotificationChannel =
  (typeof NotificationChannel)[keyof typeof NotificationChannel];

export interface NotificationInput {
  channel: NotificationChannel;
  recipient: string;
  subject: string;
  body: string;
  tenantId: string;
}

export interface QueuedNotification extends NotificationInput {
  deliveryId: string;
  queuedAt: number;
}

export interface DeliveredNotification extends QueuedNotification {
  deliveredAt: number;
}

/* ── Client ── */

export class NotificationServiceClient {
  private pending: QueuedNotification[] = [];
  private readonly delivered: DeliveredNotification[] = [];
  private nextId = 1;

  /**
   * Queue a notification for delivery.
   *
   * @param input - Notification data
   */
  send(input: NotificationInput): void {
    this.pending.push({
      ...input,
      deliveryId: `notif-${String(this.nextId++).padStart(4, "0")}`,
      queuedAt: Date.now(),
    });
  }

  /** Get all pending notifications. */
  getPending(): QueuedNotification[] {
    return [...this.pending];
  }

  /**
   * Deliver all pending notifications.
   *
   * @returns Array of delivered notifications
   */
  deliver(): DeliveredNotification[] {
    const now = Date.now();
    const results: DeliveredNotification[] = this.pending.map((n) => ({
      ...n,
      deliveredAt: now,
    }));
    this.delivered.push(...results);
    this.pending = [];
    return results;
  }

  /** Get all delivered notifications. */
  getDelivered(): DeliveredNotification[] {
    return [...this.delivered];
  }
}
