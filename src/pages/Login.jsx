// src/pages/Login.jsx
import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import InventoryLogo from "../components/InventoryLogo";
import "./Login.css";

export default function Login() {
  const { loginWithEmail, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await loginWithEmail(email, password);
    } catch (err) {
      setError(err?.message || "Failed to log in");
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    setError("");
    setBusy(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err?.message || "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="bg-layer gradient" />
      <ul className="floaters">
        <li className="floater box" />
        <li className="floater barcode" />
        <li className="floater pallet" />
        <li className="floater crate" />
        <li className="floater trolley" />
      </ul>

      <div className="auth-card">
        <div className="auth-brand">
          <InventoryLogo size={28} />
          <div className="brand-text">
            <div className="brand-title">Inventory Management</div>
            <div className="brand-sub">Sign in to continue</div>
          </div>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={submit} className="auth-form">
          <label className="auth-label" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="auth-input"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
            required
          />

          <label className="auth-label" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="auth-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
            required
          />

          <button type="submit" className="auth-btn primary" disabled={busy}>
            {busy ? "Signing in..." : "Sign In"}
          </button>

          <div className="or-row">
            <span className="line" />
            <span className="or">or</span>
            <span className="line" />
          </div>

          <button type="button" className="auth-btn google" onClick={onGoogle} disabled={busy}>
            <GoogleG /> Continue with Google
          </button>
        </form>

        <div className="auth-footer">
          By continuing, you agree to our Terms and acknowledge our Privacy Policy.
        </div>
      </div>
    </div>
  );
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.6 31.9 29.2 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 7.9 3.1l5.7-5.7C34.6 5 29.6 3 24 3 16.1 3 9.2 7.6 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 45c5 0 9.6-1.9 13-5.1l-6-4.9C29.1 36.3 26.7 37 24 37c-5.2 0-9.6-3.1-11.3-7.5l-6.6 5C9.2 40.4 16.1 45 24 45z"/>
      <path fill="#1976D2" d="M45 24c0-1.4-.1-2.8-.4-4h-20v8h11.3c-.9 4-4.4 7-8.9 7-2.7 0-5.1-.7-7.1-2l-6 5c3.3 3.2 7.9 5 13 5 11.7 0 21-9.3 21-21z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16.2 18.9 13 24 13c3.1 0 5.9 1.2 7.9 3.1l5.7-5.7C34.6 5 29.6 3 24 3 16.1 3 9.2 7.6 6.3 14.7z"/>
    </svg>
  );
}
