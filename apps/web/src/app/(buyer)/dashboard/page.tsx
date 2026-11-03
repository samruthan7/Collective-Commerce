import type { Metadata } from "next";
import { AreaPlaceholder } from "@/components/domain/AreaPlaceholder";
import { getProfile, requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Buyer dashboard" };
export const dynamic = "force-dynamic";

export default async function BuyerDashboardPage() {
  const user = await requireUser("/dashboard");
  const profile = await getProfile(user.id);
  const name = profile?.full_name ?? user.email ?? "there";

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-line bg-card p-6 shadow-card">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Welcome, {name}</h1>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-ink-500">Email</dt>
            <dd className="mt-0.5 font-medium">{user.email}</dd>
          </div>
          <div>
            <dt className="text-ink-500">Account type</dt>
            <dd className="mt-0.5 font-medium capitalize">{profile?.role ?? "buyer"}</dd>
          </div>
        </dl>
      </section>

      <AreaPlaceholder
        title="Your groups and offers"
        description="Your groups, offers to review and orders will appear here."
        availableIn="Phase 4 (groups) and Phase 9 (orders)"
      />
    </div>
  );
}
