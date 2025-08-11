// src/services/authService.js
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";

export async function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signup(email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, "users", cred.user.uid), {
    email,
    role: "user",
    permissions: {
      addItem: false,
      updateQty: true,
      deleteItem: false,
      viewReports: true,
      editSpecs: false,
    },
    createdAt: serverTimestamp(),
  });
  return cred;
}
