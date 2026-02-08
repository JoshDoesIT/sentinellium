/**
 * @module Event Bus Tests
 * @description TDD tests for pub/sub event bus with typed channels.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { EventBus } from "./event-bus";

describe("EventBus", () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
  });

  describe("subscribe / publish", () => {
    it("delivers events to subscribers", () => {
      const received: unknown[] = [];
      bus.subscribe("alerts", (data: unknown) => received.push(data));

      bus.publish("alerts", { type: "phishing", score: 0.95 });
      expect(received).toHaveLength(1);
      expect(received[0]).toEqual({ type: "phishing", score: 0.95 });
    });

    it("supports multiple subscribers on same channel", () => {
      let count = 0;
      bus.subscribe("alerts", () => count++);
      bus.subscribe("alerts", () => count++);

      bus.publish("alerts", { test: true });
      expect(count).toBe(2);
    });

    it("does not deliver to unrelated channels", () => {
      const received: unknown[] = [];
      bus.subscribe("alerts", (data: unknown) => received.push(data));

      bus.publish("policies", { name: "new policy" });
      expect(received).toHaveLength(0);
    });
  });

  describe("unsubscribe", () => {
    it("removes a subscriber", () => {
      let count = 0;
      const handler = () => count++;
      bus.subscribe("alerts", handler);
      bus.unsubscribe("alerts", handler);

      bus.publish("alerts", {});
      expect(count).toBe(0);
    });
  });

  describe("dead-letter", () => {
    it("collects events with no subscribers", () => {
      bus.publish("orphan-channel", { data: "lost" });

      const deadLetters = bus.getDeadLetters();
      expect(deadLetters).toHaveLength(1);
      expect(deadLetters[0]!.channel).toBe("orphan-channel");
    });

    it("does not dead-letter events that have subscribers", () => {
      bus.subscribe("alerts", () => {});
      bus.publish("alerts", { data: "handled" });

      expect(bus.getDeadLetters()).toHaveLength(0);
    });
  });

  describe("replay", () => {
    it("replays event history for a channel", () => {
      bus.publish("alerts", { id: 1 });
      bus.publish("alerts", { id: 2 });

      // Subscribe after events published
      const received: unknown[] = [];
      bus.subscribe("alerts", (data: unknown) => received.push(data));

      bus.replay("alerts");
      expect(received).toHaveLength(2);
    });
  });

  describe("listChannels", () => {
    it("returns all channels that have been used", () => {
      bus.subscribe("alerts", () => {});
      bus.publish("policies", {});

      const channels = bus.listChannels();
      expect(channels).toContain("alerts");
      expect(channels).toContain("policies");
    });
  });
});
