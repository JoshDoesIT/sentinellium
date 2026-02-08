/**
 * @module Group Assignment Tests
 * @description TDD tests for group-based policy assignment.
 * Maps instance groups to policies.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { GroupAssignment } from "./group-assignment";

describe("Group Assignment", () => {
  let groups: GroupAssignment;

  beforeEach(() => {
    groups = new GroupAssignment();
  });

  /* ── Initialization ── */

  describe("initialization", () => {
    it("creates an instance", () => {
      expect(groups).toBeInstanceOf(GroupAssignment);
    });
  });

  /* ── Group CRUD ── */

  describe("group CRUD", () => {
    it("creates a group", () => {
      groups.createGroup("engineering", "Engineering Team");
      expect(groups.listGroups()).toHaveLength(1);
    });

    it("assigns a policy to a group", () => {
      groups.createGroup("engineering", "Engineering Team");
      groups.assignPolicy("engineering", "pol-001");

      const group = groups.getGroup("engineering");
      expect(group?.policyId).toBe("pol-001");
    });

    it("adds members to a group", () => {
      groups.createGroup("engineering", "Engineering Team");
      groups.addMember("engineering", "ext-001");
      groups.addMember("engineering", "ext-002");

      expect(groups.getMembers("engineering")).toHaveLength(2);
    });

    it("removes members from a group", () => {
      groups.createGroup("engineering", "Engineering Team");
      groups.addMember("engineering", "ext-001");
      groups.removeMember("engineering", "ext-001");

      expect(groups.getMembers("engineering")).toHaveLength(0);
    });
  });

  /* ── Policy Resolution ── */

  describe("policy resolution", () => {
    it("resolves policy for an instance", () => {
      groups.createGroup("engineering", "Engineering Team");
      groups.assignPolicy("engineering", "pol-001");
      groups.addMember("engineering", "ext-001");

      expect(groups.resolvePolicyFor("ext-001")).toBe("pol-001");
    });

    it("returns null for unassigned instances", () => {
      expect(groups.resolvePolicyFor("ext-999")).toBeNull();
    });
  });

  /* ── Dedup ── */

  describe("dedup", () => {
    it("prevents duplicate members", () => {
      groups.createGroup("engineering", "Engineering Team");
      groups.addMember("engineering", "ext-001");
      groups.addMember("engineering", "ext-001");

      expect(groups.getMembers("engineering")).toHaveLength(1);
    });
  });
});
