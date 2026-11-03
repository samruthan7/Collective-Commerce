import type { Metadata } from "next";
import { AreaPlaceholder } from "@/components/domain/AreaPlaceholder";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin console" };
export const dynamic = "force-dynamic";

export default async function AdminConsolePage() {
  // Phase 3 adds multi-factor authentication on top of the admin role.
  await requireAdmin("/admin");

  return (
    <AreaPlaceholder
      title="Admin console"
      description="The seller verification queue, category manager, group monitor and audit log will appear here."
      availableIn="Phase 3 and Phase 5"
    />
  );
}
