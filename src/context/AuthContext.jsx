// src/context/AuthContext.jsx
import React, { createContext, useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";

export const AuthContext = createContext(null);

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const idleTimer = useRef(null);

  const logout = () => signOut(auth);

  const resetIdleTimer = () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (currentUser) {
      idleTimer.current = setTimeout(() => {
        // Optional: show a toast that session expired
        logout();
      }, IDLE_TIMEOUT_MS);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user || null);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Start/stop idle timer based on auth state
  useEffect(() => {
    if (!currentUser) {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      return;
    }
    resetIdleTimer();

    const events = ["mousemove", "keydown", "scroll", "click", "touchstart"];
    const handler = () => resetIdleTimer();
    events.forEach((e) => window.addEventListener(e, handler));

    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      events.forEach((e) => window.removeEventListener(e, handler));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  return (
    <AuthContext.Provider value={{ currentUser, authLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
