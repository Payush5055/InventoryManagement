import React, { useState } from "react";
import { signup } from "../services/authService";
import { Link, useNavigate } from "react-router-dom";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await signup(email, password);
      navigate("/");
    } catch (e) {
      setErr(e.message || "Signup failed");
    }
  };

  return (
    <div className="centered">
      <form className="card" onSubmit={onSubmit} style={{ width: 360 }}>
        <h2>Sign Up</h2>
        {err && <div className="error">{err}</div>}
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="btn" type="submit">Create account</button>
        <div style={{ marginTop: 8 }}>
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </form>
    </div>
  );
}
