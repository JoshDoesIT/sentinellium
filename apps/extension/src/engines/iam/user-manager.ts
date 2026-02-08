/**
 * @module User Manager
 * @description Tenant-scoped user CRUD operations.
 * Tracks profiles, role assignments, invitation state, and activity timestamps.
 * Supports bulk operations for enterprise onboarding.
 */

/* ── Types ── */

/** User lifecycle states. */
export const UserStatus = {
  INVITED: "INVITED",
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

/** Input for creating a new user. */
export interface CreateUserInput {
  email: string;
  name: string;
  role: string;
  tenantId: string;
}

/** Updatable user fields. */
export interface UpdateUserInput {
  name?: string;
  role?: string;
  status?: UserStatus;
}

/** A user profile within a tenant. */
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  status: UserStatus;
  createdAt: number;
  lastActiveAt?: number;
}

/* ── Manager ── */

/**
 * Manages user profiles scoped to tenants.
 * Enforces unique email per tenant and tracks activity.
 */
export class UserManager {
  private readonly users = new Map<string, UserProfile>();
  private nextId = 1;

  /**
   * Create a new user. Sets status to INVITED.
   *
   * @param input - User creation fields
   * @returns Created user profile
   * @throws Error if email already exists in the same tenant
   */
  createUser(input: CreateUserInput): UserProfile {
    const duplicate = [...this.users.values()].find(
      (u) => u.email === input.email && u.tenantId === input.tenantId,
    );
    if (duplicate) {
      throw new Error(
        `User '${input.email}' already exists in tenant '${input.tenantId}'`,
      );
    }

    const user: UserProfile = {
      id: `usr-${String(this.nextId++).padStart(4, "0")}`,
      email: input.email,
      name: input.name,
      role: input.role,
      tenantId: input.tenantId,
      status: UserStatus.INVITED,
      createdAt: Date.now(),
    };

    this.users.set(user.id, user);
    return { ...user };
  }

  /**
   * Get a user by ID.
   *
   * @param id - User ID
   * @returns User profile or undefined
   */
  getUser(id: string): UserProfile | undefined {
    const user = this.users.get(id);
    return user ? { ...user } : undefined;
  }

  /**
   * Update a user's mutable fields.
   *
   * @param id - User ID
   * @param updates - Partial fields to update
   * @throws Error if user not found
   */
  updateUser(id: string, updates: UpdateUserInput): void {
    const user = this.users.get(id);
    if (!user) {
      throw new Error(`User '${id}' not found`);
    }
    if (updates.name !== undefined) user.name = updates.name;
    if (updates.role !== undefined) user.role = updates.role;
    if (updates.status !== undefined) user.status = updates.status;
  }

  /**
   * Delete a user by ID.
   *
   * @param id - User ID
   */
  deleteUser(id: string): void {
    this.users.delete(id);
  }

  /**
   * List all users belonging to a tenant.
   *
   * @param tenantId - Tenant ID to filter by
   * @returns Array of user profiles
   */
  listByTenant(tenantId: string): UserProfile[] {
    return [...this.users.values()]
      .filter((u) => u.tenantId === tenantId)
      .map((u) => ({ ...u }));
  }

  /**
   * Record user activity by updating lastActiveAt.
   *
   * @param id - User ID
   */
  recordActivity(id: string): void {
    const user = this.users.get(id);
    if (user) {
      user.lastActiveAt = Date.now();
    }
  }
}
