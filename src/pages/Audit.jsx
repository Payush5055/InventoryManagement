// src/pages/Audit.jsx
import React, { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

function formatWhen(ts) {
  if (!ts) return "-";
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString(); // you can localize further if needed
}

function who(log) {
  return log.userName || log.userEmail || (log.userId ? `${String(log.userId).slice(0, 6)}…` : "Unknown");
}

// Turn raw log into a readable sentence
function describe(log) {
  const name = log.itemName || log.itemId || "item";
  const a = (log.action || "").toLowerCase();

  // Common actions your services likely write:
  // addItem, deleteItem, updateQuantity, updateItemSpecs
  if (a === "additem") {
    return `added ${name}`;
  }
  if (a === "deleteitem") {
    return `deleted ${name}`;
  }
  if (a === "updatequantity") {
    const prev = Number(log.prevQty ?? log.previousQuantity ?? NaN);
    const next = Number(log.newQty ?? log.newQuantity ?? NaN);
    if (!Number.isNaN(prev) && !Number.isNaN(next)) {
      const diff = next - prev;
      const dir = diff > 0 ? "increased" : diff < 0 ? "decreased" : "updated";
      return `${dir} quantity of ${name} from ${prev} to ${next}`;
    }
    return `updated quantity of ${name}`;
  }
  if (a === "updateitemspecs") {
    // If you store a changes object like {price: {from, to}, unit: {...}}
    const keys = log.changedFields || (log.changes ? Object.keys(log.changes) : null);
    if (Array.isArray(keys) && keys.length) {
      return `updated ${keys.join(", ")} for ${name}`;
    }
    return `updated details for ${name}`;
  }

  // Fallback: show action and item
  if (a) return `${a} • ${name}`;
  return `updated ${name}`;
}

function detailLine(log) {
  // Optional compact details line shown under the main sentence.
  // Avoid printing raw JSON; show only meaningful diffs if available.
  const a = (log.action || "").toLowerCase();

  if (a === "updatequantity") {
    const prev = Number(log.prevQty ?? log.previousQuantity ?? NaN);
    const next = Number(log.newQty ?? log.newQuantity ?? NaN);
    if (!Number.isNaN(prev) && !Number.isNaN(next)) {
      const delta = next - prev;
      const sign = delta > 0 ? "+" : "";
      return `Qty change: ${prev} → ${next} (${sign}${delta})`;
    }
    return null;
  }

  if (a === "updateitemspecs" && log.changes && typeof log.changes === "object") {
    const parts = Object.entries(log.changes).slice(0, 4).map(([k, v]) => {
      if (v && typeof v === "object" && "from" in v && "to" in v) {
        return `${k}: ${v.from} → ${v.to}`;
      }
      return `${k} updated`;
    });
    return parts.length ? parts.join(" • ") : null;
  }

  // For add/delete, no extra details by default
  return null;
}

export default function Audit() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "auditLogs"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setLogs(data);
    });
    return () => unsub();
  }, []);

  const items = useMemo(() => logs, [logs]);

  return (
    <div className="page">
      <div className="section-header">
        <h2>Audit</h2>
      </div>

      <div className="list" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
        {items.map((log) => {
          const sentence = describe(log);
          const details = detailLine(log);
          const actor = who(log);
          const when = formatWhen(log.timestamp);

          return (
            <div key={log.id} className="card" style={{ padding: 12 }}>
              <div className="row between" style={{ alignItems: "baseline", gap: 8 }}>
                <div className="title" style={{ fontWeight: 700 }}>
                  {sentence}
                </div>
                <div className="muted small">{when}</div>
              </div>

              {details && (
                <div className="muted small" style={{ marginTop: 6 }}>
                  {details}
                </div>
              )}

              <div className="muted small" style={{ marginTop: 6 }}>
                By: {actor}
              </div>

              {/* Developer meta (kept hidden to avoid raw JSON clutter).
                  If you need to quickly inspect raw payloads while debugging, temporarily uncomment. */}
              {/* <pre className="muted small" style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
                {JSON.stringify(log, null, 2)}
              </pre> */}
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="muted" style={{ padding: 16 }}>
            No audit entries yet.
          </div>
        )}
      </div>
    </div>
  );
}
