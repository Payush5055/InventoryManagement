import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

export async function setUserPermissions(uid, permissions, role) {
  return updateDoc(doc(db, "users", uid), { permissions, role });
}
