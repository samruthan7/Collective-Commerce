import type { Metadata } from "next";
import { AreaPlaceholder } from "@/components/domain/AreaPlaceholder";

export const metadata: Metadata = { title: "Buyer dashboard" };

export default function BuyerDashboardPage() {
  return (
    <AreaPlaceholder
      title="Your dashboard"
      description="Your groups, offers to review and orders will appear here."
      availableIn="Phase 4 (groups) and Phase 9 (orders)"
    />
  );
}