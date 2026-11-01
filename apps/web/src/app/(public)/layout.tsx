import type { ReactNode } from "react";
import { AreaShell } from "@/components/layout/AreaShell";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <AreaShell
      links={[
        { href: "/dashboard", label: "Buyer area" },
        { href: "/seller", label: "Sell" },
      ]}
    >
      {children}
    </AreaShell>
  );
}