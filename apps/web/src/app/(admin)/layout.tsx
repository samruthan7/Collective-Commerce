import type { ReactNode } from "react";
import { AreaShell } from "@/components/layout/AreaShell";
import { requireAdmin } from "@/lib/requireAdmin";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  return (
    <AreaShell
      areaLabel="Admin"
      links={[
        { href: "/", label: "Home" },
        { href: "/admin", label: "Admin console" },
        { href: "/admin/catalog", label: "Catalog" },
        { href: "/admin/sellers", label: "Sellers" },
      ]}
    >
      {children}
    </AreaShell>
  );
}
