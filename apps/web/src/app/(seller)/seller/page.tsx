import type { Metadata } from "next";
import Link from "next/link";
import { Countdown } from "@/components/domain/Countdown";
import { ActionForm } from "@/components/ui/ActionForm";
import { buttonClasses } from "@/components/ui/buttonStyles";
import { requireUser } from "@/lib/requireUser";
import { applyAsSellerAction } from "@/lib/sellerActions";
import { getMySeller, listBiddingGroups } from "@/lib/sellers";

export const metadata: Metadata = { title: "Seller portal" };
export const dynamic = "force-dynamic";

const field = "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm";
const labelClass = "mb-1 block text-xs font-semibold text-ink-500";

export default async function SellerPage() {
  const { user } = await requireUser();
  const seller = await getMySeller(user.id);

  if (!seller || seller.status === "rejected") {
    return (
      <div className="max-w-xl space-y-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Become a seller</h1>
        {seller ? (
          <p role="alert" className="text-sm text-danger-600">
            Your last application was rejected. You can correct the details and apply again.
          </p>
        ) : null}
        <ActionForm
          action={applyAsSellerAction}
          className="space-y-3 rounded-2xl border border-line bg-card p-6 shadow-card"
        >
          <div>
            <label htmlFor="businessName" className={labelClass}>
              Business name
            </label>
            <input id="businessName" name="businessName" required className={field} />
          </div>
          <div>
            <label htmlFor="gstin" className={labelClass}>
              GSTIN (optional, 15 characters)
            </label>
            <input id="gstin" name="gstin" maxLength={15} className={field} />
          </div>
          <div>
            <label htmlFor="city" className={labelClass}>
              City
            </label>
            <input id="city" name="city" defaultValue="Chennai" required className={field} />
          </div>
          <div>
            <label htmlFor="phone" className={labelClass}>
              Phone
            </label>
            <input id="phone" name="phone" required className={field} />
          </div>
          <button type="submit" className={buttonClasses("primary")}>
            Apply
          </button>
        </ActionForm>
      </div>
    );
  }

  if (seller.status !== "verified") {
    return (
      <div className="max-w-xl space-y-3">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {seller.business_name}
        </h1>
        <p className="text-ink-500">
          {seller.status === "pending"
            ? "Your application is under review. You can bid once an admin verifies you."
            : "Your seller account is suspended. Contact support."}
        </p>
      </div>
    );
  }

  const groups = await listBiddingGroups();
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {seller.business_name}
        </h1>
        <p className="mt-1 text-ink-500">
          Groups open for bidding. Sellers see member counts only, never buyer identities.
        </p>
      </header>
      {groups.length === 0 ? (
        <p className="text-ink-500">No groups are in the bidding stage right now.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <li key={g.id}>
              <Link
                href={`/seller/groups/${g.id}`}
                className="block h-full rounded-2xl border border-line bg-card p-6 shadow-card hover:border-accent-500"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                  {g.variant.product.brand} · {g.region.name}
                </p>
                <h2 className="mt-1 font-semibold">{g.variant.product.name}</h2>
                <p className="text-sm text-ink-500">{g.variant.label}</p>
                <p className="mt-3 text-sm">
                  <span className="font-semibold">{g.member_count}</span> buyers · bidding closes in{" "}
                  <Countdown target={g.bidding_deadline_at} />
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
