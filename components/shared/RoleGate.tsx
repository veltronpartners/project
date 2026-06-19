import type { ReactNode } from "react";
import type { Role } from "@/types";
import { meetsLevel, type Module, type AccessLevel } from "@/lib/permissions";

export function RoleGate({
  role,
  module,
  minLevel = "read",
  children,
  fallback = null,
}: {
  role: Role;
  module: Module;
  minLevel?: AccessLevel;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  if (!meetsLevel(role, module, minLevel)) return <>{fallback}</>;
  return <>{children}</>;
}
