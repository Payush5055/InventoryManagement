// src/pages/Audit.jsx
import React, { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { usePermissions } from "../hooks/usePermissions";

export default function Audit() {
  const { role } = usePermissions();
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (role !== "admin") return;
    const q = query(
      collection(db, "auditLogs"),
      orderBy("timestamp", "desc"),
      limit(1000) // latest 1000 logs
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setLogs(data);
    });
    return () => unsub();
  }, [role]);

  if (role !== "admin") {
    return (
      <div className="page">
        <div className="section-header">
          <h2>Audit Logs</h2>
        </div>
        <div className="card muted">Only admins can view audit logs.</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="section-header">
        <h2>Audit Logs</h2>
        <div className="muted">Showing latest {Math.min(logs.length, 1000)} entries</div>
      </div>

      <div className="list">
        {logs.map((log) => {
          const when =
            log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : "-";
          const who = log.actorEmail || log.actorUid || "-";
          const item = log.itemName || log.itemId || "-";
          return (
            <div key={log.id} className="card">
              <div className="row between">
                <div>
                  <div className="title">
                    {log.action || "-"} • {item}
                  </div>
                  <div className="muted small">
                    By: {who}
                  </div>
                </div>
                <div className="muted small">{when}</div>
              </div>
              {log.details && (
                <pre
                  style={{
                    marginTop: 8,
                    background: "rgba(255,255,255,0.04)",
                    padding: 8,
                    borderRadius: 6,
                    overflowX: "auto",
                    fontSize: 12,
                  }}
                >
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              )}
            </div>
          );
        })}

        {logs.length === 0 && (
          <div className="muted" style={{ padding: 16 }}>
            No logs
          </div>
        )}
      </div>
    </div>
  );
}
