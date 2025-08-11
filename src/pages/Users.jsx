// src/pages/Users.jsx
import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { usePermissions } from "../hooks/usePermissions";

const PERMISSION_KEYS = ["addItem", "updateQty", "deleteItem", "viewReports", "editSpecs"];
const DEFAULT_PERMS = {
  addItem: false,
  updateQty: false,
  deleteItem: false,
  viewReports: true,
  editSpecs: false,
};

export default function Users() {
  const { role } = usePermissions();
  const [users, setUsers] = useState([]);
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    async function load() {
      const q = query(collection(db, "users"), orderBy("email"));
      const snap = await getDocs(q);
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }
    load();
  }, []);

  if (role !== "admin") {
    return (
      <div className="page">
        <h2>Users</h2>
        <div className="card muted">Only admins can view this page.</div>
      </div>
    );
  }

  const updateUser = async (u, updates) => {
    setBusyId(u.id);
    try {
      await updateDoc(doc(db, "users", u.id), updates);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, ...updates } : x)));
    } finally {
      setBusyId("");
    }
  };

  const togglePerm = (u, key) => {
    const next = { ...(u.permissions || DEFAULT_PERMS), [key]: !u?.permissions?.[key] };
    updateUser(u, { permissions: next });
  };

  const setRole = (u, nextRole) => {
    updateUser(u, { role: nextRole });
  };

  return (
    <div className="page">
      <div className="section-header">
        <h2>User Management</h2>
      </div>

      <div className="card">
        <div
          className="row"
          style={{ fontWeight: 600, paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div style={{ flex: 2 }}>Email</div>
          <div style={{ flex: 1, textAlign: "right" }}>Role</div>
          <div style={{ flex: 3, textAlign: "right" }}>Permissions</div>
        </div>

        {users.map((u) => (
          <div key={u.id} className="row tr" style={{ alignItems: "center" }}>
            <div style={{ flex: 2, overflow: "hidden", textOverflow: "ellipsis" }}>
              {u.email || u.id}
            </div>

            <div style={{ flex: 1, textAlign: "right" }}>
              <select
                value={u.role || "user"}
                onChange={(e) => setRole(u, e.target.value)}
                disabled={busyId === u.id}
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </div>

            <div style={{ flex: 3, textAlign: "right" }} className="row wrap">
              {PERMISSION_KEYS.map((k) => (
                <label key={k} className="chip" style={{ cursor: "pointer", userSelect: "none" }}>
                  <input
                    type="checkbox"
                    checked={!!u?.permissions?.[k]}
                    onChange={() => togglePerm(u, k)}
                    disabled={busyId === u.id}
                    style={{ marginRight: 6 }}
                  />
                  {k}
                </label>
              ))}
            </div>
          </div>
        ))}

        {users.length === 0 && <div className="muted" style={{ paddingTop: 12 }}>No users found.</div>}
      </div>
    </div>
  );
}
