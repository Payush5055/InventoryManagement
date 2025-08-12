// src/services/inventoryService.js
// Ensures totalValue is recalculated when quantity is updated (even if user lacks editSpecs),
// and keeps audit logs with actor identity and clear action names.

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { logAction } from "./auditService";

const itemsCol = collection(db, "items");

// Helper to build a consistent actor object for audit logs
function actorFromUser(user) {
  return {
    userId: user?.uid || "",
    userEmail: user?.email || "",
    userName: user?.displayName || user?.email || "Unknown",
  };
}

export function listenItems(callback) {
  const q = query(itemsCol, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(data);
  });
}

export async function addItem(item, user) {
  const payload = {
    name: item.name,
    unit: item.unit || "pcs",
    quantity: Number(item.quantity) || 0,
    price: Number(item.price) || 0,
    dealer: item.dealer || "",
    minThreshold: Number(item.minThreshold) || 0,
    category: item.category || "Uncategorized",
    totalValue: (Number(item.quantity) || 0) * (Number(item.price) || 0),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(itemsCol, payload);

  try {
    await logAction(user, "addItem", ref.id, payload.name, {
      quantity: payload.quantity,
      price: payload.price,
      unit: payload.unit,
      dealer: payload.dealer,
      minThreshold: payload.minThreshold,
      category: payload.category,
      ...actorFromUser(user),
    });
  } catch {
    // optional debug
  }
}

export async function updateQuantity(id, name, prevQty, newQty, user) {
  const itemRef = doc(db, "items", id);

  // 1) Update quantity
  await updateDoc(itemRef, {
    quantity: Number(newQty),
    updatedAt: serverTimestamp(),
  });

  // 2) Recompute totalValue using the latest price in Firestore
  try {
    const snap = await getDoc(itemRef);
    const data = snap.data() || {};
    const price = Number(data.price || 0);
    const qty = Number(newQty) || 0;
    const totalValue = qty * price;

    await updateDoc(itemRef, {
      totalValue,
      updatedAt: serverTimestamp(),
    });
  } catch {
    // optional debug
  }

  // 3) Audit log
  try {
    await logAction(user, "updateQuantity", id, name, {
      prevQty: Number(prevQty),
      newQty: Number(newQty),
      ...actorFromUser(user),
    });
  } catch {
    // optional debug
  }
}

export async function updateItemSpecs(id, updates, user, oldData) {
  const next = { ...updates, updatedAt: serverTimestamp() };

  // Maintain totalValue if price or quantity is changed in specs
  if ("price" in updates || "quantity" in updates) {
    const q = "quantity" in updates ? Number(updates.quantity) : Number(oldData?.quantity || 0);
    const p = "price" in updates ? Number(updates.price) : Number(oldData?.price || 0);
    next.totalValue = q * p;
  }

  await updateDoc(doc(db, "items", id), next);

  // Optional: build human-friendly changes map for audit readability
  const changes = {};
  if (oldData) {
    Object.keys(updates).forEach((k) => {
      const fromVal = oldData[k];
      const toVal = updates[k];
      if (String(fromVal) !== String(toVal)) {
        changes[k] = { from: fromVal, to: toVal };
      }
    });
  }

  try {
    await logAction(user, "updateItemSpecs", id, updates.name || oldData?.name || "", {
      updates,
      changes,
      changedFields: Object.keys(changes),
      ...actorFromUser(user),
    });
  } catch {
    // optional debug
  }
}

export async function deleteItem(id, name, prevQty, user) {
  await deleteDoc(doc(db, "items", id));
  try {
    await logAction(user, "deleteItem", id, name, {
      prevQty: Number(prevQty),
      ...actorFromUser(user),
    });
  } catch {
    // optional debug
  }
}
