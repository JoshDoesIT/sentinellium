/**
 * @module State Module Tests
 * @description Unit tests for the API state management helpers:
 * addUser, addAuditEntry, ingestAlert, getAllAlerts.
 */

import { describe, it, expect } from "vitest";
import { AlertSource, AlertSeverity } from "@sentinellium/engines";
import {
  users,
  auditLog,
  addUser,
  addAuditEntry,
  ingestAlert,
  getAllAlerts,
  dashboard,
} from "../state";

describe("addUser", () => {
  it("should create a user with auto-generated ID", () => {
    const user = addUser({
      name: "Test User",
      email: "test@unit.io",
      role: "Viewer",
      mfaEnabled: false,
      status: "Active",
      lastLogin: new Date().toISOString(),
    });

    expect(user.id).toMatch(/^usr-/);
    expect(user.name).toBe("Test User");
    expect(user.email).toBe("test@unit.io");
    expect(user.role).toBe("Viewer");
  });

  it("should push the user into the users array", () => {
    const before = users.length;
    addUser({
      name: "Another User",
      email: "another@unit.io",
      role: "Analyst",
      mfaEnabled: true,
      status: "Active",
      lastLogin: new Date().toISOString(),
    });
    expect(users.length).toBe(before + 1);
  });

  it("should generate unique IDs", () => {
    const u1 = addUser({
      name: "U1",
      email: "u1@unit.io",
      role: "Admin",
      mfaEnabled: true,
      status: "Active",
      lastLogin: new Date().toISOString(),
    });
    const u2 = addUser({
      name: "U2",
      email: "u2@unit.io",
      role: "Viewer",
      mfaEnabled: false,
      status: "Active",
      lastLogin: new Date().toISOString(),
    });

    expect(u1.id).not.toBe(u2.id);
  });
});

describe("addAuditEntry", () => {
  it("should create an audit entry with auto-generated ID", () => {
    const entry = addAuditEntry({
      timestamp: new Date().toISOString(),
      actor: "test-actor",
      action: "TEST_ACTION",
      target: "test-target",
      ipAddress: "127.0.0.1",
    });

    expect(entry.id).toMatch(/^aud-/);
    expect(entry.actor).toBe("test-actor");
    expect(entry.action).toBe("TEST_ACTION");
  });

  it("should push the entry into the auditLog array", () => {
    const before = auditLog.length;
    addAuditEntry({
      timestamp: new Date().toISOString(),
      actor: "system",
      action: "PUSH_CHECK",
      target: "array",
      ipAddress: "10.0.0.1",
    });
    expect(auditLog.length).toBe(before + 1);
  });

  it("should generate unique IDs", () => {
    const e1 = addAuditEntry({
      timestamp: new Date().toISOString(),
      actor: "a",
      action: "ACT",
      target: "t",
      ipAddress: "1.1.1.1",
    });
    const e2 = addAuditEntry({
      timestamp: new Date().toISOString(),
      actor: "b",
      action: "ACT",
      target: "t",
      ipAddress: "2.2.2.2",
    });
    expect(e1.id).not.toBe(e2.id);
  });
});

describe("ingestAlert", () => {
  it("should add an alert to the aggregator", () => {
    const before = getAllAlerts().length;
    ingestAlert({
      source: AlertSource.PHISHING,
      severity: AlertSeverity.MEDIUM,
      title: "Test ingest",
      domain: "test.com",
      url: "https://test.com/ingest-unit",
    });
    expect(getAllAlerts().length).toBe(before + 1);
  });

  it("should record a block for CRITICAL severity", () => {
    const beforeBlocks = dashboard.getSnapshot().threatsBlocked;
    ingestAlert({
      source: AlertSource.DLP,
      severity: AlertSeverity.CRITICAL,
      title: "Critical test",
      domain: "critical.com",
      url: "https://critical.com/block-unit",
    });
    expect(dashboard.getSnapshot().threatsBlocked).toBe(beforeBlocks + 1);
  });

  it("should record a block for HIGH severity", () => {
    const beforeBlocks = dashboard.getSnapshot().threatsBlocked;
    ingestAlert({
      source: AlertSource.C2PA,
      severity: AlertSeverity.HIGH,
      title: "High test",
      domain: "high.com",
      url: "https://high.com/block-unit",
    });
    expect(dashboard.getSnapshot().threatsBlocked).toBe(beforeBlocks + 1);
  });

  it("should NOT record a block for LOW severity", () => {
    const beforeBlocks = dashboard.getSnapshot().threatsBlocked;
    ingestAlert({
      source: AlertSource.PHISHING,
      severity: AlertSeverity.LOW,
      title: "Low test",
      domain: "low.com",
      url: "https://low.com/no-block-unit",
    });
    expect(dashboard.getSnapshot().threatsBlocked).toBe(beforeBlocks);
  });
});

describe("getAllAlerts", () => {
  it("should return an array", () => {
    const alerts = getAllAlerts();
    expect(Array.isArray(alerts)).toBe(true);
  });

  it("should include previously ingested alerts", () => {
    ingestAlert({
      source: AlertSource.DLP,
      severity: AlertSeverity.INFO,
      title: "Verify retrieval",
      domain: "retrieve.com",
      url: "https://retrieve.com/verify-unit",
    });
    const alerts = getAllAlerts();
    const found = alerts.find((a) => a.title === "Verify retrieval");
    expect(found).toBeDefined();
  });
});
