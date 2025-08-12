// src/pages/Dashboard.jsx
import InventoryLogo from "../components/InventoryLogo";
import React, { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { db } from "../firebase/firebaseConfig";
import { usePermissions } from "../hooks/usePermissions"; // NEW

Chart.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const CATEGORIES = ["Transformer", "Line"];

export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState("");
  const { permissions, loading } = usePermissions(); // NEW

  useEffect(() => {
    const q = query(collection(db, "items"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setItems(data);
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    if (!category) return items;
    return items.filter((i) => i.category === category);
  }, [items, category]);

  const byItemNames = filtered.map((i) => i.name || i.id.slice(0, 6));
  const quantities = filtered.map((i) => Number(i.quantity || 0));

  // Price-sensitive values
  const values = filtered.map((i) => {
    const qty = Number(i.quantity || 0);
    const price = Number(i.price || 0);
    return typeof i.totalValue === "number" ? Number(i.totalValue) : qty * price;
  });

  const lowCount = filtered.filter(
    (i) => Number(i.quantity) < Number(i.minThreshold || 0)
  ).length;
  const okCount = Math.max(filtered.length - lowCount, 0);

  const totalsByCategory = useMemo(() => {
    const sums = { Transformer: 0, Line: 0 };
    for (const it of items) {
      const cat = it.category;
      if (cat === "Transformer" || cat === "Line") {
        const qty = Number(it.quantity || 0);
        const price = Number(it.price || 0);
        const val =
          typeof it.totalValue === "number" ? Number(it.totalValue) : qty * price;
        sums[cat] += Number.isFinite(val) ? val : 0;
      }
    }
    return sums;
  }, [items]);

  const axisColor = "#9fb3c8";
  const gridColor = "rgba(159,179,200,0.2)";
  const titleColor = "#e6eef7";

  const canViewReports =
    !loading && Boolean(permissions && permissions.viewReports);

  return (
    <div className="page">
      <div className="section-header">
        <h2>Dashboard</h2>
        <div className="row" style={{ gap: 8 }}>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              backgroundColor: "#1f2733",
              color: "#e6eef7",
              border: "1px solid #3a4558",
              borderRadius: 6,
              padding: "8px 10px",
              minHeight: 36,
            }}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="row wrap" style={{ gap: 16 }}>
        {/* Price-sensitive: only if viewReports is true */}
        {canViewReports && (
          <Card title="Total Inventory Amount by Category">
            <Bar
              data={{
                labels: CATEGORIES,
                datasets: [
                  {
                    label: "Total Amount",
                    data: CATEGORIES.map((c) => Number(totalsByCategory[c] || 0)),
                    backgroundColor: ["#6aa1ff", "#59a14f"],
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { labels: { color: titleColor } },
                  tooltip: {
                    mode: "index",
                    intersect: false,
                    callbacks: {
                      label: (ctx) =>
                        ` ${ctx.dataset.label}: ${Number(ctx.raw || 0).toFixed(2)}`,
                    },
                  },
                },
                scales: {
                  x: { ticks: { color: axisColor }, grid: { color: gridColor } },
                  y: { ticks: { color: axisColor }, grid: { color: gridColor } },
                },
              }}
            />
          </Card>
        )}

        {/* Stock by Item (quantity) — visible to all */}
        <Card title="Stock by Item">
          <Bar
            data={{
              labels: byItemNames,
              datasets: [
                {
                  label: "Quantity",
                  data: quantities,
                  backgroundColor: "#4e79a7",
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { labels: { color: titleColor } },
                tooltip: { mode: "index", intersect: false },
              },
              scales: {
                x: { ticks: { color: axisColor }, grid: { color: gridColor } },
                y: { ticks: { color: axisColor }, grid: { color: gridColor } },
              },
            }}
          />
        </Card>

        {/* Price-sensitive: Value by Item chart */}
        {canViewReports && (
          <Card title="Value by Item">
            <Bar
              data={{
                labels: byItemNames,
                datasets: [
                  {
                    label: "Total Value",
                    data: values,
                    backgroundColor: "#59a14f",
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { labels: { color: titleColor } },
                  tooltip: {
                    mode: "index",
                    intersect: false,
                    callbacks: {
                      label: (ctx) =>
                        ` ${ctx.dataset.label}: ${Number(ctx.raw || 0).toFixed(2)}`,
                    },
                  },
                },
                scales: {
                  x: { ticks: { color: axisColor }, grid: { color: gridColor } },
                  y: { ticks: { color: axisColor }, grid: { color: gridColor } },
                },
              }}
            />
          </Card>
        )}

        {/* Stock Status — visible to all */}
        <Card title="Stock Status">
          <Doughnut
            data={{
              labels: ["OK", "Low"],
              datasets: [
                {
                  data: [okCount, lowCount],
                  backgroundColor: ["#76b7b2", "#e15759"],
                },
              ],
            }}
            options={{
              plugins: {
                legend: { labels: { color: titleColor } },
              },
            }}
          />
          <div className="muted small" style={{ marginTop: 8 }}>
            Total items: {filtered.length} • Low: {lowCount} • OK: {okCount}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="card" style={{ flex: "1 1 480px", minWidth: 320 }}>
      <div className="row between" style={{ marginBottom: 8 }}>
        <div className="title">{title}</div>
      </div>
      <div style={{ width: "100%", minHeight: 280 }}>{children}</div>
    </div>
  );
}
