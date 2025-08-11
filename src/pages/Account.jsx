// src/pages/Account.jsx
import React from "react";
import { useAuth } from "../hooks/useAuth";
import { usePermissions } from "../hooks/usePermissions";

export default function Account() {
  const { currentUser, logout } = useAuth();
  const { role, permissions } = usePermissions();

  if (!currentUser) {
    return (
      <div className="page account-page">
        <h2 className="account-title">Account</h2>
        <div className="card account-card">
          <div className="muted">You are not logged in.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page account-page">
      <div className="section-header">
        <h2 className="account-title">Account</h2>
        <button className="btn secondary big-btn" onClick={logout}>
          Sign out
        </button>
      </div>

      <div className="card account-card">
        <div className="section-head">Profile</div>
        <div className="pill-row">
          <span className="pill">Email: {currentUser.email || "(no email)"}</span>
          <span className="pill">UID: {currentUser.uid?.slice(0, 8)}…</span>
          <span className="pill pill-role">Role: {role || "user"}</span>
        </div>

        <div className="divider" />

        <div className="section-head">Permissions</div>
        <div className="pill-row">
          {permissions && Object.keys(permissions).length > 0 ? (
            Object.entries(permissions).map(([k, v]) => (
              <span key={k} className={`pill ${v ? "on" : "off"}`}>
                {k}: {v ? "on" : "off"}
              </span>
            ))
          ) : (
            <span className="muted">No permissions assigned</span>
          )}
        </div>
      </div>
    </div>
  );
}
