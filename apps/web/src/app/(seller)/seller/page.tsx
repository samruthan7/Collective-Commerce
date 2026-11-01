import type { Metadata } from "next";
import { AreaPlaceholder } from "@/components/domain/AreaPlaceholder";

export const metadata: Metadata = { title: "Seller dashboard" };

export default function SellerDashboardPage() {
  return (
    <AreaPlaceholder
      title="Seller dashboard"
      description="Registration, verification, your catalogue and matching groups will appear here."
      availableIn="Phase 5"
    />
  );
}
