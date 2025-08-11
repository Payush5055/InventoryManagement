// src/services/auditService.js
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const auditCol = collection(db, "auditLogs");

// action examples: "add", "editSpecs", "updateQty", "remove"
export async function logAction(user, action, itemId, itemName, details = {}) {
  const payload = {
    actorUid: user?.uid || null,
    actorEmail: user?.email || null,
    action: String(action || ""),
    itemId: itemId || null,
    itemName: itemName || null,
    details: details || {},
    timestamp: serverTimestamp(),
  };
  await addDoc(auditCol, payload);
}
