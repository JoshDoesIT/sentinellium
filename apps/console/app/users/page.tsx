"use client";

import { useState, useEffect } from "react";
import styles from "./users.module.css";
import { relativeTime, type ConsoleUser } from "../lib/api";

/**
 * @module Users Page
 * @description User management with RBAC — Admin/Analyst/Viewer roles,
 * MFA status, invite modal, and permission matrix.
 *
 * Fetches real user data from the Sentinellium API.
 */

const API_BASE = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000";

const PERMISSIONS = [
  { feature: "View Dashboard", admin: true, analyst: true, viewer: true },
  { feature: "View Alerts", admin: true, analyst: true, viewer: true },
  { feature: "Dismiss Alerts", admin: true, analyst: true, viewer: false },
  { feature: "View Fleet", admin: true, analyst: true, viewer: true },
  { feature: "Manage Fleet", admin: true, analyst: false, viewer: false },
  { feature: "View Audit Log", admin: true, analyst: true, viewer: false },
  { feature: "Export Reports", admin: true, analyst: true, viewer: false },
  { feature: "Manage Users", admin: true, analyst: false, viewer: false },
  { feature: "Change Settings", admin: true, analyst: false, viewer: false },
  {
    feature: "Configure Integrations",
    admin: true,
    analyst: false,
    viewer: false,
  },
];

export default function UsersPage() {
  const [users, setUsers] = useState<ConsoleUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/users`, {
      headers: { "Content-Type": "application/json" },
    })
      .then((r) => r.json())
      .then((json) => {
        setUsers(json.data ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={styles["users-page"]}>
        <header className="page-header">
          <h1 className="page-header__title">User Management</h1>
          <p className="page-header__subtitle">Loading users…</p>
        </header>
      </div>
    );
  }

  return (
    <div className={styles["users-page"]}>
      <header className="page-header">
        <h1 className="page-header__title">User Management</h1>
        <p className="page-header__subtitle">
          Manage roles, access controls, and MFA enrollment
        </p>
      </header>

      <div className={styles["users-toolbar"]}>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--smoke)" }}>
          {users.length} users
        </span>
        <button
          className="btn btn--primary"
          onClick={() => setShowInvite(true)}
        >
          + Invite User
        </button>
      </div>

      {/* ── User Table ── */}
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>MFA</th>
            <th>Status</th>
            <th>Last Login</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td className="col-mono">{user.email}</td>
              <td>
                <span
                  className={`${styles["role-badge"]} ${styles[`role-badge--${user.role.toLowerCase()}`]}`}
                >
                  {user.role}
                </span>
              </td>
              <td>
                <span
                  className={`${styles["mfa-status"]} ${
                    user.mfaEnabled
                      ? styles["mfa-status--enabled"]
                      : styles["mfa-status--disabled"]
                  }`}
                >
                  {user.mfaEnabled ? "✓ Enabled" : "✗ Disabled"}
                </span>
              </td>
              <td>
                <span
                  className={`status-dot ${
                    user.status === "Active"
                      ? "status-dot--active"
                      : "status-dot--inactive"
                  }`}
                />{" "}
                {user.status}
              </td>
              <td className="col-mono">{relativeTime(user.lastLogin)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── Permission Matrix ── */}
      <div className={`card ${styles["perm-section"]}`}>
        <h2 className={styles["perm-section__title"]}>Permission Matrix</h2>
        <table className={styles["perm-table"]}>
          <thead>
            <tr>
              <th>Feature</th>
              <th>Admin</th>
              <th>Analyst</th>
              <th>Viewer</th>
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map((perm) => (
              <tr key={perm.feature}>
                <td>{perm.feature}</td>
                <td>
                  <span
                    className={
                      perm.admin ? styles["perm-check"] : styles["perm-cross"]
                    }
                  >
                    {perm.admin ? "✓" : "—"}
                  </span>
                </td>
                <td>
                  <span
                    className={
                      perm.analyst ? styles["perm-check"] : styles["perm-cross"]
                    }
                  >
                    {perm.analyst ? "✓" : "—"}
                  </span>
                </td>
                <td>
                  <span
                    className={
                      perm.viewer ? styles["perm-check"] : styles["perm-cross"]
                    }
                  >
                    {perm.viewer ? "✓" : "—"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Invite Modal ── */}
      {showInvite && (
        <div
          className={styles["modal-overlay"]}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowInvite(false);
          }}
          role="dialog"
          aria-label="Invite user"
        >
          <div className={`card card--modal ${styles.modal}`}>
            <h2 className={styles.modal__title}>Invite User</h2>

            <div className={styles["form-field"]}>
              <label className={styles["form-field__label"]}>Email</label>
              <input
                type="email"
                className="input"
                placeholder="user@company.com"
              />
            </div>

            <div className={styles["form-field"]}>
              <label className={styles["form-field__label"]}>Role</label>
              <select className="input">
                <option value="Viewer">Viewer</option>
                <option value="Analyst">Analyst</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <div className={styles.modal__actions}>
              <button
                className="btn btn--secondary"
                onClick={() => setShowInvite(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn--primary"
                onClick={() => setShowInvite(false)}
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
