// src/pages/Users.jsx
// Admin-only page to view and update users' role and permission flags.
// Fixed: Hooks (useEffect, useMemo) are now called unconditionally at the top.

import React, { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, orderBy, query, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { usePermissions } from "../hooks/usePermissions";

const PERM_KEYS = [
  "addItem",
  "editSpecs",
  "updateQty",
  "deleteItem",
  "viewReports",
];

export default function Users() {
  const { role, loading } = usePermissions();
  const [users, setUsers] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  // Always subscribe; if not admin, we’ll render Access Denied, but hook order remains stable.
  useEffect(() => {
    const qUsers = query(collection(db, "users"), orderBy("email", "asc"));
    const unsub = onSnapshot(
      qUsers,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setUsers(rows);
      },
      (err) => setError(err?.message || String(err))
    );
    return () => unsub();
  }, []);

  const rows = useMemo(() => users, [users]);

  const onTogglePerm = async (u, key) => {
    if (loading || role !== "admin") return;
    setBusyId(u.id);
    setError("");
    try {
      const next = { ...(u.permissions || {}) };
      next[key] = !Boolean(next[key]);
      await updateDoc(doc(db, "users", u.id), {
        permissions: next,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      setError(e?.message || "Failed to update permission");
    } finally {
      setBusyId(null);
    }
  };

  const onChangeRole = async (u, nextRole) => {
    if (loading || role !== "admin") return;
    setBusyId(u.id);
    setError("");
    try {
      await updateDoc(doc(db, "users", u.id), {
        role: nextRole,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      setError(e?.message || "Failed to update role");
    } finally {
      setBusyId(null);
    }
  };

  // Now safely branch in JSX after hooks have run
  if (!loading && role !== "admin") {
    return (
      <div className="page">
        <div className="section-header">
          <h2>Users</h2>
        </div>
        <div className="card">Access denied. Admins only.</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="section-header">
        <h2>Users</h2>
      </div>

      {error && (
        <div className="card" style={{ borderColor: "#5b4040", color: "#ffd3d3" }}>
          {error}
        </div>
      )}

      <div className="card" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left" }}>
              <th style={{ padding: "10px 8px" }}>Email</th>
              <th style={{ padding: "10px 8px" }}>Role</th>
              <th style={{ padding: "10px 8px" }}>Permissions</th>
              <th style={{ padding: "10px 8px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => {
              const perms = u.permissions || {};
              return (
                <tr key={u.id} style={{ borderTop: "1px solid #2c3647" }}>
                  <td style={{ padding: "10px 8px" }}>{u.email || u.id}</td>
                  <td style={{ padding: "10px 8px" }}>
                    <select
                      value={u.role || "user"}
                      onChange={(e) => onChangeRole(u, e.target.value)}
                      disabled={busyId === u.id || loading}
                      style={{
                        backgroundColor: "#1f2733",
                        color: "#e6eef7",
                        border: "1px solid #3a4558",
                        borderRadius: 6,
                        padding: "6px 8px",
                        minHeight: 32,
                      }}
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td style={{ padding: "10px 8px" }}>
                    <div className="row wrap" style={{ gap: 8 }}>
                      {PERM_KEYS.map((k) => (
                        <label
                          key={k}
                          className="chip"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            background: perms[k] ? "#1f3a2b" : "#232a36",
                            border: "1px solid " + (perms[k] ? "#2e5b41" : "#394356"),
                            color: perms[k] ? "#cfeede" : "#c6d6ea",
                            borderRadius: 999,
                            padding: "6px 10px",
                            cursor: busyId === u.id ? "not-allowed" : "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(perms[k])}
                            disabled={busyId === u.id || loading}
                            onChange={() => onTogglePerm(u, k)}
                          />
                          <span>{k}</span>
                        </label>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: "10px 8px" }}>
                    <span className="muted small">
                      {busyId === u.id ? "Saving..." : "—"}
                    </span>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: 12 }} className="muted">
                  {loading ? "Loading..." : "No users found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
