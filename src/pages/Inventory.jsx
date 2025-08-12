// src/pages/Inventory.jsx
// Adds highlighted item name styling (gradient underline and hover glow) in the Items list.
// Enhanced Edit modal with clear field labels and helper descriptions so users know what each field represents.
// Shows live total value (Qty × Price) while editing.

import React, { useEffect, useMemo, useState } from "react";
import {
  addItem,
  deleteItem,
  listenItems,
  updateItemSpecs,
  updateQuantity,
} from "../services/inventoryService";
import { useAuth } from "../hooks/useAuth";
import { usePermissions } from "../hooks/usePermissions";

// Restrict categories to only these two
const DEFAULT_CATEGORIES = ["Transformer", "Line"];
const UNITS = ["pcs", "box", "kg", "g", "litre", "pack"];

// Visible select styling used across page
const selectStyle = {
  backgroundColor: "#1f2733",
  color: "#e6eef7",
  border: "1px solid #3a4558",
  borderRadius: 6,
  padding: "8px 10px",
  minHeight: 36,
};

// Chip style helper for clearer item specs
function chipStyle(variant) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 500,
    background: "#1f2733",
    color: "#e6eef7",
    border: "1px solid #3a4558",
  };
  if (variant === "warn") {
    return { ...base, background: "#3a2a2a", borderColor: "#5b4040", color: "#f3d0d0" };
  }
  if (variant === "ok") {
    return { ...base, background: "#1f3a2b", borderColor: "#2e5b41", color: "#cfeede" };
  }
  if (variant === "accent") {
    return { ...base, background: "#243243", borderColor: "#3e5470", color: "#cfe3ff" };
  }
  if (variant === "subtle") {
    return { ...base, background: "#232a36", borderColor: "#394356", color: "#c6d6ea" };
  }
  return base;
}

// Name highlight styles
const nameStyle = {
  fontSize: 20,
  fontWeight: 800,
  letterSpacing: 0.2,
  color: "#eaf2ff",
  position: "relative",
  paddingBottom: 2,
  display: "inline-block",
};

const nameUnderline = {
  content: '""',
  position: "absolute",
  left: 0,
  right: 0,
  bottom: -2,
  height: 3,
  background: "linear-gradient(90deg, #6aa1ff 0%, #59a14f 100%)",
  borderRadius: 2,
  opacity: 0.9,
};

// Small helper components/styles for labeled inputs in modals
function Field({ label, hint, children, style }) {
  return (
    <div style={{ flex: "1 1 32%", minWidth: 220, ...style }}>
      <label style={{ display: "block", fontSize: 13, color: "#9fb3c8", marginBottom: 4 }}>
        {label}
      </label>
      {children}
      {hint && (
        <div className="muted" style={{ fontSize: 12, marginTop: 4, opacity: 0.85 }}>
          {hint}
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  background: "#1f2733",
  color: "#e6eef7",
  border: "1px solid #3a4558",
  borderRadius: 8,
  padding: "10px 10px",
  fontSize: 14,
};

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const { currentUser } = useAuth();
  const { permissions } = usePermissions();

  useEffect(() => {
    const unsub = listenItems(setItems);
    return () => unsub();
  }, []);

  const visibleItems = useMemo(() => {
    return items.filter((i) => {
      const bySearch =
        i.name?.toLowerCase().includes((search || "").toLowerCase()) ||
        i.sku?.toLowerCase().includes((search || "").toLowerCase()) ||
        i.dealer?.toLowerCase().includes((search || "").toLowerCase());
      const byCat = !filterCat || i.category === filterCat;
      const isLow = Number(i.quantity) < Number(i.minThreshold || 0);
      const byStatus = !filterStatus || (filterStatus === "low" ? isLow : !isLow);
      return bySearch && byCat && byStatus;
    });
  }, [items, search, filterCat, filterStatus]);

  const onUpdateQty = async (i) => {
    if (!permissions.updateQty) return;
    const next = Number(i._newQty ?? i.quantity);
    if (Number.isNaN(next) || next < 0) return;
    setBusyId(i.id);
    try {
      await updateQuantity(i.id, i.name, i.quantity, next, currentUser);
    } finally {
      setBusyId(null);
      i._newQty = undefined;
    }
  };

  const onDelete = async (i) => {
    if (!permissions.deleteItem) return;
    if (!window.confirm(`Delete ${i.name}?`)) return;
    setBusyId(i.id);
    try {
      await deleteItem(i.id, i.name, i.quantity, currentUser);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="page">
      <div className="section-header">
        <h2>Inventory</h2>
        <div className="row">
          {permissions.addItem && (
            <button className="btn" onClick={() => setShowAdd(true)}>
              + Add Item
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card row wrap" style={{ gap: 8, alignItems: "center" }}>
        <input
          placeholder="Search by name, SKU or dealer…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: 260 }}
        />
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          style={selectStyle}
        >
          <option value="">All categories</option>
          {DEFAULT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All status</option>
          <option value="low">Low only</option>
          <option value="ok">OK only</option>
        </select>
      </div>

      {/* Headings */}
      <div className="card table-head row between">
        <div className="th name">Item</div>
        <div className="row">
          <div className="th qty">Qty</div>
          <div className="th min">Min</div>
          <div className="th cat">Category</div>
          <div className="th act">Actions</div>
        </div>
      </div>

      {/* Items - improved visual cards with highlighted name */}
      <div
        className="list"
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))", gap: 12 }}
      >
        {visibleItems.map((i) => {
          const isLow = Number(i.quantity) < Number(i.minThreshold || 0);
          return (
            <div
              key={i.id}
              className="card"
              style={{
                padding: 14,
                borderLeft: `4px solid ${isLow ? "#e15759" : "#59a14f"}`,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                minHeight: 140,
                transition: "box-shadow 0.2s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow =
                  "0 0 0 1px rgba(106,161,255,0.25), 0 8px 24px rgba(0,0,0,0.25)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
            >
              {/* Header: name + badges + qty */}
              <div className="row between" style={{ alignItems: "center", gap: 8 }}>
                <div className="row" style={{ alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  {/* Highlighted name */}
                  <div style={nameStyle}>
                    {i.name}
                    <span style={nameUnderline} />
                  </div>
                  {i.category && (
                    <span
                      className="chip"
                      style={{
                        background: "#243243",
                        border: "1px solid #3e5470",
                        color: "#cfe3ff",
                      }}
                    >
                      {i.category}
                    </span>
                  )}
                  {isLow && (
                    <span
                      className="chip"
                      style={{
                        background: "#3a2a2a",
                        border: "1px solid #5b4040",
                        color: "#ffb3b3",
                        fontWeight: 600,
                      }}
                    >
                      Low Stock
                    </span>
                  )}
                </div>

                <div
                  style={{
                    minWidth: 120,
                    textAlign: "right",
                    background: "#1f2733",
                    border: "1px solid #3a4558",
                    borderRadius: 8,
                    padding: "8px 10px",
                  }}
                >
                  <div className="muted" style={{ fontSize: 12 }}>
                    Quantity
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{Number(i.quantity)}</div>
                </div>
              </div>

              {/* Specs */}
              <div className="row wrap" style={{ gap: 8 }}>
                <span className="chip" title="Unit" style={chipStyle()}>
                  Unit: {i.unit || "pcs"}
                </span>
                <span className="chip" title="Price per unit" style={chipStyle()}>
                  Price: {Number(i.price || 0).toFixed(2)}
                </span>
                <span className="chip" title="Minimum threshold" style={chipStyle(isLow ? "warn" : "ok")}>
                  Min: {Number(i.minThreshold || 0)}
                </span>
                <span className="chip" title="Dealer" style={chipStyle()}>
                  Dealer: {i.dealer || "-"}
                </span>
                <span className="chip" title="SKU" style={chipStyle("subtle")}>
                  SKU: {i.sku || "-"}
                </span>
                {typeof i.totalValue === "number" && (
                  <span className="chip" title="Total value" style={chipStyle("accent")}>
                    Total: {Number(i.totalValue).toFixed(2)}
                  </span>
                )}
              </div>

              {/* Footer: meta + actions */}
              <div className="row between" style={{ alignItems: "flex-end", gap: 8 }}>
                <div className="muted small">ID: {String(i.id).slice(0, 6)}…</div>

                <div className="td act row" style={{ gap: 8, alignItems: "center" }}>
                  {permissions.updateQty && (
                    <div className="row" style={{ gap: 8, alignItems: "center" }}>
                      <input
                        className="qty-input"
                        type="number"
                        defaultValue={i.quantity}
                        onChange={(e) => (i._newQty = e.target.value)}
                        disabled={busyId === i.id}
                        aria-label="New quantity"
                        style={{
                          width: 110,
                          background: "#1f2733",
                          color: "#e6eef7",
                          border: "1px solid #3a4558",
                          borderRadius: 6,
                          padding: "6px 8px",
                        }}
                      />
                      <button
                        className="btn"
                        disabled={busyId === i.id}
                        onClick={() => onUpdateQty(i)}
                        title="Update quantity only"
                      >
                        {busyId === i.id ? "Saving..." : "Update Qty"}
                      </button>
                    </div>
                  )}
                  <button
                    className="btn secondary"
                    onClick={() => setEditItem(i)}
                    title="Edit specifications"
                  >
                    Edit
                  </button>
                  {permissions.deleteItem && (
                    <button
                      className="btn danger"
                      disabled={busyId === i.id}
                      onClick={() => onDelete(i)}
                      title="Delete item"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {visibleItems.length === 0 && (
          <div className="muted" style={{ padding: 16 }}>
            No items found.
          </div>
        )}
      </div>

      {showAdd && (
        <AddItemModal
          onClose={() => setShowAdd(false)}
          onSaved={async (payload) => {
            await addItem(payload, currentUser);
            setShowAdd(false);
          }}
        />
      )}

      {editItem && (
        <EditItemModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onSaved={async (updates) => {
            const clean = {};
            if (updates.name !== editItem.name) clean.name = updates.name;
            if (updates.sku !== editItem.sku) clean.sku = updates.sku;
            if (Number(updates.minThreshold) !== Number(editItem.minThreshold))
              clean.minThreshold = Number(updates.minThreshold);
            if (updates.unit !== editItem.unit) clean.unit = updates.unit;
            if (Number(updates.price) !== Number(editItem.price))
              clean.price = Number(updates.price);
            if (updates.category !== editItem.category) clean.category = updates.category;
            if ((updates.dealer || "") !== (editItem.dealer || ""))
              clean.dealer = updates.dealer || "";
            // Optional: allow changing quantity in Edit modal
            if (
              updates.quantity !== undefined &&
              Number(updates.quantity) !== Number(editItem.quantity)
            ) {
              clean.quantity = Number(updates.quantity);
            }
            if (Object.keys(clean).length === 0) return;
            await updateItemSpecs(editItem.id, clean, currentUser, editItem);
            setEditItem(null);
          }}
        />
      )}
    </div>
  );
}

function AddItemModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    name: "",
    unit: "",
    quantity: "",
    price: "",
    dealer: "",
    minThreshold: "",
    category: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const totalValue = (Number(form.quantity) || 0) * (Number(form.price) || 0);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) return setError("Name is required");
    if (!form.unit) return setError("Unit is required");
    if (Number.isNaN(Number(form.quantity)) || Number(form.quantity) < 0)
      return setError("Quantity must be a non-negative number");
    if (Number.isNaN(Number(form.price)) || Number(form.price) < 0)
      return setError("Price must be a non-negative number");
    if (Number.isNaN(Number(form.minThreshold)) || Number(form.minThreshold) < 0)
      return setError("Minimum quantity must be a non-negative number");
    if (!form.dealer.trim()) return setError("Dealer is required");
    if (!form.category) return setError("Category is required");

    setSaving(true);
    try {
      await onSaved({
        ...form,
        quantity: Number(form.quantity),
        price: Number(form.price),
        minThreshold: Number(form.minThreshold),
      });
    } catch (err) {
      setError(err?.message || "Failed to add item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Item</h3>
          <button className="btn ghost" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && <div className="error" style={{ marginBottom: 8 }}>{error}</div>}

        <form onSubmit={submit} className="row wrap" style={{ gap: 8 }}>
          {/* Name */}
          <Field label="Item name" hint="A short, unique name for the item (e.g., Transformer T-100)." style={{ flex: "1 1 60%" }}>
            <input
              required
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={inputStyle}
            />
          </Field>

          {/* Unit */}
          <Field label="Unit of measure" hint="How this item is measured (e.g., pcs, box, kg)." style={{ flex: "1 1 38%" }}>
            <select
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              style={{ ...inputStyle }}
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </Field>

          {/* Quantity */}
          <Field label="Quantity in stock" hint="Current available stock. Must be a non-negative number.">
            <input
              required
              type="number"
              placeholder="Quantity"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              style={inputStyle}
            />
          </Field>

          {/* Price */}
          <Field label="Price per unit" hint="Cost per single unit of this item (numeric).">
            <input
              required
              type="number"
              placeholder="Price (per unit)"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              style={inputStyle}
            />
          </Field>

          {/* Dealer */}
          <Field label="Dealer/Supplier" hint="Name of the supplier or dealer for reference.">
            <input
              required
              placeholder="Dealer"
              value={form.dealer}
              onChange={(e) => setForm({ ...form, dealer: e.target.value })}
              style={inputStyle}
            />
          </Field>

          {/* Minimum quantity */}
          <Field
            label="Minimum threshold"
            hint="Alert level: when stock goes below this number, the item is considered low."
          >
            <input
              required
              type="number"
              placeholder="Minimum quantity"
              value={form.minThreshold}
              onChange={(e) => setForm({ ...form, minThreshold: e.target.value })}
              style={inputStyle}
            />
          </Field>

          {/* Category restricted dropdown with visible styles */}
          <Field label="Category" hint='Choose one of the allowed categories: "Transformer" or "Line".'>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              style={{ ...inputStyle }}
              required
            >
              <option value="">Category</option>
              {DEFAULT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>

          {/* Total value */}
          <div className="card" style={{ flex: "1 1 100%" }}>
            <div className="row between">
              <div className="muted">Total item value (Qty × Price)</div>
              <div className="title">{isFinite(totalValue) ? totalValue.toFixed(2) : "0.00"}</div>
            </div>
          </div>

          <div className="modal-actions" style={{ marginTop: 8 }}>
            <button type="button" className="btn secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditItemModal({ item, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: item.name || "",
    sku: item.sku || "",
    quantity: item.quantity ?? 0, // allow quantity change via specs if needed
    minThreshold: item.minThreshold ?? 0,
    unit: item.unit || "pcs",
    price: item.price ?? 0,
    category: item.category || "",
    dealer: item.dealer || "",
  });
  const [saving, setSaving] = useState(false);

  // Live total value while editing
  const totalValueEdit = (Number(form.quantity) || 0) * (Number(form.price) || 0);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaved({
        ...form,
        quantity: Number(form.quantity),
        minThreshold: Number(form.minThreshold),
        price: Number(form.price),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Item</h3>
          <button className="btn ghost" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Fieldset with labels and hints to clarify each input */}
        <form onSubmit={submit} className="row wrap" style={{ gap: 12 }}>
          <Field
            label="Item name"
            hint="The display name of the item (e.g., Transformer T-100)."
            style={{ flex: "1 1 60%" }}
          >
            <input
              required
              placeholder="Item name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={inputStyle}
            />
          </Field>

          <Field
            label="SKU (optional)"
            hint="Internal stock-keeping unit or code used to identify the item."
            style={{ flex: "1 1 38%" }}
          >
            <input
              placeholder="SKU"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              style={inputStyle}
            />
          </Field>

          <Field label="Quantity in stock" hint="Current stock level. Must be a non-negative number.">
            <input
              required
              type="number"
              placeholder="Quantity"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              style={inputStyle}
            />
          </Field>

          <Field
            label="Minimum threshold"
            hint="Alert level: if stock falls below this, the item is flagged as Low."
          >
            <input
              required
              type="number"
              placeholder="Min threshold"
              value={form.minThreshold}
              onChange={(e) => setForm({ ...form, minThreshold: e.target.value })}
              style={inputStyle}
            />
          </Field>

          <Field label="Unit of measure" hint="How the item is measured (pcs, box, kg, etc.).">
            <select
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              style={{ ...inputStyle }}
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Price per unit" hint="Cost per single unit (numeric).">
            <input
              type="number"
              placeholder="Price"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              style={inputStyle}
            />
          </Field>

          <Field label="Category" hint='Choose one of "Transformer" or "Line".'>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              style={{ ...inputStyle }}
              required
            >
              <option value="">Category</option>
              {DEFAULT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Dealer/Supplier" hint="Who supplies this item. Useful for reorders.">
            <input
              placeholder="Dealer"
              value={form.dealer}
              onChange={(e) => setForm({ ...form, dealer: e.target.value })}
              style={inputStyle}
            />
          </Field>

          {/* Live total value while editing */}
          <div className="card" style={{ flex: "1 1 100%" }}>
            <div className="row between">
              <div className="muted">Total item value (Qty × Price)</div>
              <div className="title">
                {isFinite(totalValueEdit) ? Number(totalValueEdit).toFixed(2) : "0.00"}
              </div>
            </div>
          </div>

          <div className="modal-actions" style={{ marginTop: 4, width: "100%" }}>
            <button type="button" className="btn secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
