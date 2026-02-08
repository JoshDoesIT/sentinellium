/**
 * @module Version Migrator Tests
 * @description TDD tests for version migration system.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { VersionMigrator } from "./version-migrator";

describe("VersionMigrator", () => {
  let migrator: VersionMigrator;

  beforeEach(() => {
    migrator = new VersionMigrator("1.0.0");
  });

  describe("registerMigration", () => {
    it("registers a migration for a version", () => {
      migrator.registerMigration("1.1.0", {
        up: () => ({ success: true }),
        description: "Add alert priorities",
      });

      expect(migrator.listMigrations()).toHaveLength(1);
    });
  });

  describe("migrate", () => {
    it("runs pending migrations in order", () => {
      const order: string[] = [];

      migrator.registerMigration("1.1.0", {
        up: () => {
          order.push("1.1.0");
          return { success: true };
        },
        description: "Migration 1",
      });
      migrator.registerMigration("1.2.0", {
        up: () => {
          order.push("1.2.0");
          return { success: true };
        },
        description: "Migration 2",
      });

      const result = migrator.migrate("1.2.0");
      expect(result.migrationsRun).toBe(2);
      expect(order).toEqual(["1.1.0", "1.2.0"]);
    });

    it("skips already-applied migrations", () => {
      migrator.registerMigration("1.1.0", {
        up: () => ({ success: true }),
        description: "Already applied",
      });

      migrator.migrate("1.1.0");
      const result = migrator.migrate("1.1.0");
      expect(result.migrationsRun).toBe(0);
    });
  });

  describe("getCurrentVersion", () => {
    it("returns current version after migration", () => {
      migrator.registerMigration("1.1.0", {
        up: () => ({ success: true }),
        description: "Upgrade",
      });

      migrator.migrate("1.1.0");
      expect(migrator.getCurrentVersion()).toBe("1.1.0");
    });
  });
});
