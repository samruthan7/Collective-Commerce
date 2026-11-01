import type { ReactNode } from "react";
import { AreaShell } from "@/components/layout/AreaShell";

// Phase 2 adds the real auth guard here (admin role plus MFA required).
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AreaShell
      areaLabel="Admin"
      links={[
        { href: "/", label: "Home" },
        { href: "/admin", label: "Admin console" },
      ]}
    >
      {children}
    </AreaShell>
  );
}
