// src/App.js
import React from "react";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import PrivateRoute from "./routes/PrivateRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Audit from "./pages/Audit";
import Account from "./pages/Account";
import Users from "./pages/Users"; // NEW
import { useAuth } from "./hooks/useAuth";
import { usePermissions } from "./hooks/usePermissions";
import InventoryLogo from "./components/InventoryLogo";
import "./App.css";

function Nav() {
  const { logout } = useAuth();
  const { pathname } = useLocation();
  const { role, loading } = usePermissions() || { role: "user", loading: true };

  return (
    <div className="navbar">
      <div className="navbar-inner">
        <div className="brand" style={{ display: "flex", alignItems: "center" }}>
          <InventoryLogo size={22} style={{ marginRight: 8 }} />
          Inventory Management
        </div>
        <div className="nav-links">
          <Link className={`nav-link ${pathname === "/" ? "active" : ""}`} to="/">Dashboard</Link>
          <Link className={`nav-link ${pathname.startsWith("/inventory") ? "active" : ""}`} to="/inventory">Inventory</Link>
          <Link className={`nav-link ${pathname.startsWith("/account") ? "active" : ""}`} to="/account">Account</Link>
          {!loading && role === "admin" && (
            <>
              <Link className={`nav-link ${pathname.startsWith("/users") ? "active" : ""}`} to="/users">Users</Link>
              <Link className={`nav-link ${pathname.startsWith("/audit") ? "active" : ""}`} to="/audit">Audit</Link>
            </>
          )}
        </div>
        <div className="nav-right">
          <button className="btn secondary" onClick={logout}>Logout</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { currentUser } = useAuth();

  return (
    <div>
      {currentUser && <Nav />}
      <Routes>
        <Route path="/login" element={currentUser ? <Navigate to="/" /> : <Login />} />
        <Route path="/signup" element={currentUser ? <Navigate to="/" /> : <Signup />} />
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/account" element={<Account />} />
          <Route path="/audit" element={<Audit />} />
          <Route path="/users" element={<Users />} /> {/* NEW admin page */}
        </Route>
        <Route path="*" element={<Navigate to={currentUser ? "/" : "/login"} />} />
      </Routes>
    </div>
  );
}
