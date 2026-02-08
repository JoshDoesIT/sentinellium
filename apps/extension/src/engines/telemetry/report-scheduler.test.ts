/**
 * @module Report Scheduler Tests
 * @description TDD tests for periodic report scheduling and lifecycle
 * management. Supports daily/weekly schedules and on-demand generation.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
    ReportScheduler,
    ScheduleFrequency,
    ReportStatus,
    type ScheduledReport,
} from "./report-scheduler";

describe("ReportScheduler", () => {
    let scheduler: ReportScheduler;

    beforeEach(() => {
        scheduler = new ReportScheduler();
    });

    /* ── Schedule Management ── */

    describe("addSchedule", () => {
        it("creates a daily report schedule", () => {
            const id = scheduler.addSchedule({
                name: "Daily Digest",
                frequency: ScheduleFrequency.DAILY,
            });

            expect(id).toBeTruthy();
            const schedules = scheduler.listSchedules();
            expect(schedules).toHaveLength(1);
            expect(schedules[0].name).toBe("Daily Digest");
            expect(schedules[0].frequency).toBe(ScheduleFrequency.DAILY);
        });

        it("creates a weekly report schedule", () => {
            const id = scheduler.addSchedule({
                name: "Weekly Summary",
                frequency: ScheduleFrequency.WEEKLY,
            });

            const schedule = scheduler.getSchedule(id);
            expect(schedule?.frequency).toBe(ScheduleFrequency.WEEKLY);
        });

        it("assigns unique IDs to each schedule", () => {
            const id1 = scheduler.addSchedule({
                name: "Report A",
                frequency: ScheduleFrequency.DAILY,
            });
            const id2 = scheduler.addSchedule({
                name: "Report B",
                frequency: ScheduleFrequency.DAILY,
            });

            expect(id1).not.toBe(id2);
        });
    });

    describe("removeSchedule", () => {
        it("removes an existing schedule", () => {
            const id = scheduler.addSchedule({
                name: "Temp Report",
                frequency: ScheduleFrequency.DAILY,
            });

            scheduler.removeSchedule(id);
            expect(scheduler.listSchedules()).toHaveLength(0);
        });

        it("returns false for non-existent schedule", () => {
            const result = scheduler.removeSchedule("nonexistent");
            expect(result).toBe(false);
        });
    });

    /* ── Report Generation ── */

    describe("generateReport", () => {
        it("generates a report with PENDING status initially", () => {
            const id = scheduler.addSchedule({
                name: "Test Report",
                frequency: ScheduleFrequency.DAILY,
            });

            const reportId = scheduler.generateReport(id);
            const report = scheduler.getReport(reportId);

            expect(report?.status).toBe(ReportStatus.PENDING);
            expect(report?.scheduleId).toBe(id);
        });

        it("transitions report to COMPLETE after processing", () => {
            const id = scheduler.addSchedule({
                name: "Test Report",
                frequency: ScheduleFrequency.DAILY,
            });

            const reportId = scheduler.generateReport(id);
            scheduler.completeReport(reportId, "Report content here");

            const report = scheduler.getReport(reportId);
            expect(report?.status).toBe(ReportStatus.COMPLETE);
            expect(report?.content).toBe("Report content here");
        });

        it("transitions report to FAILED on error", () => {
            const id = scheduler.addSchedule({
                name: "Test Report",
                frequency: ScheduleFrequency.DAILY,
            });

            const reportId = scheduler.generateReport(id);
            scheduler.failReport(reportId, "Generation error");

            const report = scheduler.getReport(reportId);
            expect(report?.status).toBe(ReportStatus.FAILED);
            expect(report?.error).toBe("Generation error");
        });
    });

    /* ── Due Schedules ── */

    describe("getDueSchedules", () => {
        it("returns schedules that are due based on last run time", () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date("2026-02-07T10:00:00Z"));

            const id = scheduler.addSchedule({
                name: "Daily Digest",
                frequency: ScheduleFrequency.DAILY,
            });

            // Mark as last run 25 hours ago
            scheduler.markLastRun(id, Date.now() - 25 * 60 * 60 * 1000);

            const due = scheduler.getDueSchedules();
            expect(due).toHaveLength(1);
            expect(due[0].name).toBe("Daily Digest");

            vi.useRealTimers();
        });

        it("excludes schedules that ran recently", () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date("2026-02-07T10:00:00Z"));

            const id = scheduler.addSchedule({
                name: "Daily Digest",
                frequency: ScheduleFrequency.DAILY,
            });

            // Mark as last run 1 hour ago
            scheduler.markLastRun(id, Date.now() - 60 * 60 * 1000);

            const due = scheduler.getDueSchedules();
            expect(due).toHaveLength(0);

            vi.useRealTimers();
        });

        it("includes never-run schedules as due", () => {
            scheduler.addSchedule({
                name: "New Schedule",
                frequency: ScheduleFrequency.DAILY,
            });

            const due = scheduler.getDueSchedules();
            expect(due).toHaveLength(1);
        });
    });
});
