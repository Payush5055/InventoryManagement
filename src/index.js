// src/index.js
// Ensures both <AuthProvider> and <PermissionsProvider> wrap the application
// so useAuth() and usePermissions() are available everywhere, including Login and Account.

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { PermissionsProvider } from "./hooks/usePermissions";
import App from "./App";
import "./index.css"; // global styles (optional)

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    {/* Auth context available to every route, including /login */}
    <AuthProvider>
      {/* Permissions context provides live role/permissions from Firestore */}
      <PermissionsProvider>
        {/* Router wraps App so routes work everywhere */}
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </PermissionsProvider>
    </AuthProvider>
  </React.StrictMode>
);
