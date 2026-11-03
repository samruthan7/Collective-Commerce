import type { ReactNode } from "react";
import { AreaShell } from "@/components/layout/AreaShell";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin("/admin");
  return <AreaShell areaLabel="Admin">{children}</AreaShell>;
}
