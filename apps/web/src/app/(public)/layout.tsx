import type { ReactNode } from "react";
import { AreaShell } from "@/components/layout/AreaShell";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <AreaShell
      links={[
        { href: "/my/groups", label: "My groups" },
        { href: "/notifications", label: "Alerts" },
        { href: "/my/orders", label: "My orders" },
        { href: "/catalog", label: "Catalog" },
        { href: "/groups", label: "Groups" },
        { href: "/dashboard", label: "Buyer area" },
        { href: "/seller", label: "Sell" },
      ]}
    >
      {children}
    </AreaShell>
  );
}
