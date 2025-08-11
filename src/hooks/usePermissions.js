import { useContext } from "react";
import { PermissionContext } from "../context/PermissionContext";

export function usePermissions() {
  return useContext(PermissionContext);
}
