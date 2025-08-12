// src/services/auditService.js
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

// Minimal, safe audit writer
export async function logAction(user, action, itemId, itemName, details = {}) {
  try {
    const docPayload = {
      action,
      itemId: itemId || "",
      itemName: itemName || "",
      timestamp: serverTimestamp(),
      // identity fallbacks (in case caller forgot to pass identity in details)
      userId: details.userId ?? user?.uid ?? "",
      userEmail: details.userEmail ?? user?.email ?? "",
      userName: details.userName ?? user?.displayName ?? user?.email ?? "Unknown",
      // merge the rest of details last so no fields are lost
      ...details,
    };
    await addDoc(collection(db, "auditLogs"), docPayload);
    // Optional: console.debug("AUDIT wrote:", action, itemId, itemName);
  } catch (err) {
    console.error("AUDIT write failed:", action, itemId, err);
    throw err;
  }
}
