/**
 * @module Version Migrator
 * @description Version migration system for schema and data upgrades.
 * Runs migrations in order, tracks applied versions, and prevents re-runs.
 */

/* ── Types ── */

export interface MigrationResult {
  success: boolean;
}

export interface Migration {
  up: () => MigrationResult;
  description: string;
}

export interface MigrationReport {
  migrationsRun: number;
  fromVersion: string;
  toVersion: string;
}

/* ── Migrator ── */

/**
 * Version migrator with ordered migration execution.
 */
export class VersionMigrator {
  private currentVersion: string;
  private readonly migrations = new Map<string, Migration>();
  private readonly applied = new Set<string>();

  constructor(currentVersion: string) {
    this.currentVersion = currentVersion;
  }

  /**
   * Register a migration for a version.
   *
   * @param version - Target version
   * @param migration - Migration definition
   */
  registerMigration(version: string, migration: Migration): void {
    this.migrations.set(version, migration);
  }

  /** List all registered migration versions. */
  listMigrations(): string[] {
    return [...this.migrations.keys()];
  }

  /**
   * Run all pending migrations up to target version.
   *
   * @param targetVersion - Version to migrate to
   */
  migrate(targetVersion: string): MigrationReport {
    const fromVersion = this.currentVersion;
    let migrationsRun = 0;

    // Sort migrations by version string
    const sorted = [...this.migrations.entries()].sort(([a], [b]) =>
      a.localeCompare(b, undefined, { numeric: true }),
    );

    for (const [version, migration] of sorted) {
      if (this.applied.has(version)) continue;
      if (
        version.localeCompare(targetVersion, undefined, { numeric: true }) > 0
      )
        break;

      migration.up();
      this.applied.add(version);
      this.currentVersion = version;
      migrationsRun++;
    }

    return { migrationsRun, fromVersion, toVersion: this.currentVersion };
  }

  /** Get current version. */
  getCurrentVersion(): string {
    return this.currentVersion;
  }
}
