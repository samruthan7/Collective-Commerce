import type { ReactNode } from "react";
import { AreaShell } from "@/components/layout/AreaShell";

// Phase 2 adds the real auth guard here (buyer role required).
export default function BuyerLayout({ children }: { children: ReactNode }) {
  return (
    <AreaShell
      links={[
        { href: "/", label: "Home" },
        { href: "/dashboard", label: "Dashboard" },
      ]}
    >
      {children}
    </AreaShell>
  );
}