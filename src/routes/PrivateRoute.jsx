import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function PrivateRoute() {
  const { currentUser, authLoading } = useAuth();
  if (authLoading) return <div style={{ padding: 16 }}>Loading...</div>;
  return currentUser ? <Outlet /> : <Navigate to="/login" />;
}
