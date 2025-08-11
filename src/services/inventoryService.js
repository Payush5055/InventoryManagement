// src/services/inventoryService.js
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { logAction } from "./auditService";

const itemsCol = collection(db, "items");

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
    await logAction(user, "add", ref.id, payload.name, {
      quantity: payload.quantity,
      price: payload.price,
      unit: payload.unit,
      dealer: payload.dealer,
      minThreshold: payload.minThreshold,
      category: payload.category,
    });
  } catch (e) {
    // optional: console.error("audit add failed", e);
  }
}

export async function updateQuantity(id, name, prevQty, newQty, user) {
  await updateDoc(doc(db, "items", id), {
    quantity: Number(newQty),
    updatedAt: serverTimestamp(),
  });
  try {
    await logAction(user, "updateQty", id, name, {
      prevQty: Number(prevQty),
      newQty: Number(newQty),
    });
  } catch (e) {
    // optional: console.error("audit updateQty failed", e);
  }
}

export async function updateItemSpecs(id, updates, user, oldData) {
  const next = { ...updates, updatedAt: serverTimestamp() };
  if ("price" in updates || "quantity" in updates) {
    const q = "quantity" in updates ? Number(updates.quantity) : Number(oldData?.quantity || 0);
    const p = "price" in updates ? Number(updates.price) : Number(oldData?.price || 0);
    next.totalValue = q * p;
  }
  await updateDoc(doc(db, "items", id), next);
  try {
    await logAction(user, "editSpecs", id, updates.name || oldData?.name || "", {
      updates,
    });
  } catch (e) {
    // optional: console.error("audit editSpecs failed", e);
  }
}

export async function deleteItem(id, name, prevQty, user) {
  await deleteDoc(doc(db, "items", id));
  try {
    await logAction(user, "remove", id, name, {
      prevQty: Number(prevQty),
    });
  } catch (e) {
    // optional: console.error("audit remove failed", e);
  }
}
