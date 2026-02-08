/**
 * @module Report Scheduler
 * @description Schedules periodic report generation with lifecycle management.
 * Supports daily and weekly frequencies. Tracks report status through
 * pending, complete, and failed states.
 */

/* ── Types ── */

/** Report schedule frequency. */
export enum ScheduleFrequency {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
}

/** Report generation status. */
export enum ReportStatus {
  PENDING = "PENDING",
  COMPLETE = "COMPLETE",
  FAILED = "FAILED",
}

/** Input for creating a schedule. */
export interface ScheduleInput {
  name: string;
  frequency: ScheduleFrequency;
}

/** A configured report schedule. */
export interface ReportScheduleEntry {
  id: string;
  name: string;
  frequency: ScheduleFrequency;
  lastRunAt: number | null;
}

/** A generated report instance. */
export interface ScheduledReport {
  id: string;
  scheduleId: string;
  status: ReportStatus;
  createdAt: number;
  content?: string;
  error?: string;
}

/* ── Constants ── */

const MS_PER_DAY = 86_400_000;
const MS_PER_WEEK = 7 * MS_PER_DAY;

/* ── Scheduler ── */

/**
 * Manages periodic report schedules and report lifecycle.
 */
export class ReportScheduler {
  private schedules = new Map<string, ReportScheduleEntry>();
  private reports = new Map<string, ScheduledReport>();
  private nextId = 1;

  /** Generate a unique ID. */
  private generateId(): string {
    return `rpt_${this.nextId++}`;
  }

  /**
   * Add a new report schedule.
   *
   * @param input - Schedule configuration
   * @returns The new schedule's ID
   */
  addSchedule(input: ScheduleInput): string {
    const id = this.generateId();
    this.schedules.set(id, {
      id,
      name: input.name,
      frequency: input.frequency,
      lastRunAt: null,
    });
    return id;
  }

  /**
   * Remove a schedule by ID.
   *
   * @param id - Schedule ID to remove
   * @returns True if found and removed
   */
  removeSchedule(id: string): boolean {
    return this.schedules.delete(id);
  }

  /**
   * Get a schedule by ID.
   *
   * @param id - Schedule ID
   * @returns The schedule entry or undefined
   */
  getSchedule(id: string): ReportScheduleEntry | undefined {
    return this.schedules.get(id);
  }

  /** List all configured schedules. */
  listSchedules(): ReportScheduleEntry[] {
    return [...this.schedules.values()];
  }

  /**
   * Mark the last run time for a schedule.
   *
   * @param id - Schedule ID
   * @param timestamp - Time of last run
   */
  markLastRun(id: string, timestamp: number): void {
    const schedule = this.schedules.get(id);
    if (schedule) {
      schedule.lastRunAt = timestamp;
    }
  }

  /**
   * Get schedules that are due for execution.
   * A schedule is due if it has never run or if enough time
   * has elapsed since its last run based on frequency.
   *
   * @returns Array of due schedule entries
   */
  getDueSchedules(): ReportScheduleEntry[] {
    const now = Date.now();

    return [...this.schedules.values()].filter((s) => {
      if (s.lastRunAt === null) return true;

      const interval =
        s.frequency === ScheduleFrequency.DAILY ? MS_PER_DAY : MS_PER_WEEK;
      return now - s.lastRunAt >= interval;
    });
  }

  /**
   * Generate a report for a schedule.
   * Creates a pending report instance.
   *
   * @param scheduleId - Schedule to generate for
   * @returns The new report's ID
   */
  generateReport(scheduleId: string): string {
    const id = this.generateId();
    this.reports.set(id, {
      id,
      scheduleId,
      status: ReportStatus.PENDING,
      createdAt: Date.now(),
    });
    return id;
  }

  /**
   * Get a report by ID.
   *
   * @param id - Report ID
   * @returns The report or undefined
   */
  getReport(id: string): ScheduledReport | undefined {
    return this.reports.get(id);
  }

  /**
   * Mark a report as complete with content.
   *
   * @param id - Report ID
   * @param content - Generated report content
   */
  completeReport(id: string, content: string): void {
    const report = this.reports.get(id);
    if (report) {
      report.status = ReportStatus.COMPLETE;
      report.content = content;
    }
  }

  /**
   * Mark a report as failed with an error message.
   *
   * @param id - Report ID
   * @param error - Error description
   */
  failReport(id: string, error: string): void {
    const report = this.reports.get(id);
    if (report) {
      report.status = ReportStatus.FAILED;
      report.error = error;
    }
  }
}
