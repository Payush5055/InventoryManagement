// src/components/InventoryLogo.jsx
import React from "react";

export default function InventoryLogo({ size = 24, style = {}, ariaLabel = "Inventory logo" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-label={ariaLabel}
      style={style}
    >
      <path d="M3 7l9 5 9-5" stroke="#6aa1ff" strokeWidth="1.6" fill="none" />
      <path d="M3 7v10l9 5 9-5V7" stroke="#9fb3c8" strokeWidth="1.2" fill="none" />
      <path d="M12 12v10" stroke="#9fb3c8" strokeWidth="1.2" />
      <path d="M7 9h10" stroke="#6aa1ff" strokeWidth="1.2" />
    </svg>
  );
}
