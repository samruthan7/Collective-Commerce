import type { Metadata } from "next";
import { AreaPlaceholder } from "@/components/domain/AreaPlaceholder";

export const metadata: Metadata = { title: "Admin console" };

export default function AdminConsolePage() {
  return (
    <AreaPlaceholder
      title="Admin console"
      description="The seller verification queue, category manager, group monitor and audit log will appear here."
      availableIn="Phase 3 and Phase 5"
    />
  );
}