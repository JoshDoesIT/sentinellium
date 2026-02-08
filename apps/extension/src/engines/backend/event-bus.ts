/**
 * @module Event Bus
 * @description Typed publish/subscribe event bus with channel isolation,
 * dead-letter collection, and event replay support.
 */

/* ── Types ── */

type EventHandler = (data: unknown) => void;

interface DeadLetter {
  channel: string;
  data: unknown;
  timestamp: number;
}

interface EventRecord {
  channel: string;
  data: unknown;
  timestamp: number;
}

/* ── Bus ── */

/**
 * Pub/sub event bus with dead-letter and replay support.
 */
export class EventBus {
  private readonly subscribers = new Map<string, Set<EventHandler>>();
  private readonly deadLetters: DeadLetter[] = [];
  private readonly eventHistory: EventRecord[] = [];
  private readonly knownChannels = new Set<string>();

  /**
   * Subscribe to a channel.
   *
   * @param channel - Channel name
   * @param handler - Event handler
   */
  subscribe(channel: string, handler: EventHandler): void {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }
    this.subscribers.get(channel)!.add(handler);
    this.knownChannels.add(channel);
  }

  /**
   * Unsubscribe a handler from a channel.
   *
   * @param channel - Channel name
   * @param handler - Handler to remove
   */
  unsubscribe(channel: string, handler: EventHandler): void {
    this.subscribers.get(channel)?.delete(handler);
  }

  /**
   * Publish an event to a channel.
   * Events with no subscribers go to dead-letter.
   *
   * @param channel - Channel name
   * @param data - Event payload
   */
  publish(channel: string, data: unknown): void {
    this.knownChannels.add(channel);
    const record: EventRecord = { channel, data, timestamp: Date.now() };
    this.eventHistory.push(record);

    const handlers = this.subscribers.get(channel);
    if (!handlers || handlers.size === 0) {
      this.deadLetters.push({
        channel,
        data,
        timestamp: Date.now(),
      });
      return;
    }

    for (const handler of handlers) {
      handler(data);
    }
  }

  /**
   * Replay all historical events for a channel to current subscribers.
   *
   * @param channel - Channel to replay
   */
  replay(channel: string): void {
    const handlers = this.subscribers.get(channel);
    if (!handlers) return;

    const events = this.eventHistory.filter((e) => e.channel === channel);
    for (const event of events) {
      for (const handler of handlers) {
        handler(event.data);
      }
    }
  }

  /** Get all dead-letter events. */
  getDeadLetters(): DeadLetter[] {
    return [...this.deadLetters];
  }

  /** List all known channels. */
  listChannels(): string[] {
    return [...this.knownChannels];
  }
}
