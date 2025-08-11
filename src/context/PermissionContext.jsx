// src/context/PermissionContext.jsx
import React, { createContext, useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { useAuth } from "../hooks/useAuth";

export const PermissionContext = createContext(null);

const DEFAULT_PERMISSIONS = {
  addItem: false,
  updateQty: false,
  deleteItem: false,
  viewReports: true,
  editSpecs: false,
};

export function PermissionProvider({ children }) {
  const { currentUser } = useAuth();
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS);
  const [role, setRole] = useState("user");
  const [permLoading, setPermLoading] = useState(false);

  useEffect(() => {
    async function load() {
      if (!currentUser) {
        setPermissions(DEFAULT_PERMISSIONS);
        setRole("user");
        return;
      }
      setPermLoading(true);
      try {
        const snap = await getDoc(doc(db, "users", currentUser.uid));
        if (snap.exists()) {
          const data = snap.data();
          setPermissions({ ...DEFAULT_PERMISSIONS, ...(data.permissions || {}) });
          setRole(data.role || "user");
        } else {
          setPermissions(DEFAULT_PERMISSIONS);
          setRole("user");
        }
      } finally {
        setPermLoading(false);
      }
    }
    load();
  }, [currentUser]);

  return (
    <PermissionContext.Provider value={{ permissions, role, permLoading }}>
      {children}
    </PermissionContext.Provider>
  );
}
