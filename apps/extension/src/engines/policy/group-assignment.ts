/**
 * @module Group Assignment
 * @description Maps instance groups to policies.
 * Supports group CRUD, member management, and policy resolution.
 */

/* ── Types ── */

/** A policy group. */
export interface PolicyGroup {
  id: string;
  name: string;
  policyId: string | null;
  members: Set<string>;
}

/* ── Assignment ── */

/**
 * Manages group-based policy assignment.
 */
export class GroupAssignment {
  private readonly groups = new Map<string, PolicyGroup>();

  /**
   * Create a new group.
   *
   * @param id - Group ID
   * @param name - Display name
   */
  createGroup(id: string, name: string): void {
    this.groups.set(id, { id, name, policyId: null, members: new Set() });
  }

  /**
   * Assign a policy to a group.
   *
   * @param groupId - Group ID
   * @param policyId - Policy ID
   */
  assignPolicy(groupId: string, policyId: string): void {
    const group = this.groups.get(groupId);
    if (group) group.policyId = policyId;
  }

  /**
   * Add a member (instance ID) to a group.
   *
   * @param groupId - Group ID
   * @param instanceId - Instance ID
   */
  addMember(groupId: string, instanceId: string): void {
    this.groups.get(groupId)?.members.add(instanceId);
  }

  /**
   * Remove a member from a group.
   *
   * @param groupId - Group ID
   * @param instanceId - Instance ID
   */
  removeMember(groupId: string, instanceId: string): void {
    this.groups.get(groupId)?.members.delete(instanceId);
  }

  /** Get members of a group. */
  getMembers(groupId: string): string[] {
    return [...(this.groups.get(groupId)?.members ?? [])];
  }

  /** Get a group by ID. */
  getGroup(groupId: string): PolicyGroup | undefined {
    return this.groups.get(groupId);
  }

  /** List all groups. */
  listGroups(): PolicyGroup[] {
    return [...this.groups.values()];
  }

  /**
   * Resolve the policy for an instance.
   * Finds the first group containing the instance and returns its policy.
   *
   * @param instanceId - Instance ID
   * @returns Policy ID or null
   */
  resolvePolicyFor(instanceId: string): string | null {
    for (const group of this.groups.values()) {
      if (group.members.has(instanceId)) {
        return group.policyId;
      }
    }
    return null;
  }
}
