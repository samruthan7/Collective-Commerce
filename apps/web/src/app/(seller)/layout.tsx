import type { ReactNode } from "react";
import { AreaShell } from "@/components/layout/AreaShell";

// Phase 2 adds the real auth guard here (seller membership required).
export default function SellerLayout({ children }: { children: ReactNode }) {
  return (
    <AreaShell
      areaLabel="Seller"
      links={[
        { href: "/", label: "Home" },
        { href: "/seller/orders", label: "Orders" },
        { href: "/seller", label: "Seller dashboard" },
        { href: "/seller/quotes", label: "My quotations" },
      ]}
    >
      {children}
    </AreaShell>
  );
}
