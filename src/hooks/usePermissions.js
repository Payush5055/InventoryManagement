// src/hooks/usePermissions.js
import { useContext, createContext, useEffect, useState } from "react";
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { useAuth } from "./useAuth";

const PermsContext = createContext(null);

export function PermissionsProvider({ children }) {
  const { currentUser } = useAuth();
  const [state, setState] = useState({
    role: null,
    permissions: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!currentUser) {
      setState({ role: null, permissions: null, loading: false, error: null });
      return;
    }

    const ref = doc(db, "users", currentUser.uid);

    let unsub = () => {};
    (async () => {
      try {
        // Ensure user doc exists (first-time Google login)
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          await setDoc(ref, {
            email: currentUser.email || "",
            role: "user",
            permissions: {
              addItem: false,
              editSpecs: false,
              updateQty: false,
              deleteItem: false,
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        // Live subscribe to role/permissions
        unsub = onSnapshot(
          ref,
          (docSnap) => {
            const data = docSnap.data() || {};
            setState({
              role: data.role ?? "user",
              permissions: data.permissions ?? {},
              loading: false,
              error: null,
            });
          },
          (err) => {
            setState((prev) => ({ ...prev, loading: false, error: err?.message || String(err) }));
          }
        );
      } catch (e) {
        setState({ role: "user", permissions: {}, loading: false, error: e?.message || String(e) });
      }
    })();

    return () => unsub();
  }, [currentUser]);

  return <PermsContext.Provider value={state}>{children}</PermsContext.Provider>;
}

export function usePermissions() {
  const ctx = useContext(PermsContext);
  // Always return a safe, non-null object
  if (!ctx) {
    return { role: "user", permissions: {}, loading: true, error: null };
    }
  return ctx;
}
