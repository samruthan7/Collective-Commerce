import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Countdown } from "@/components/domain/Countdown";
import { ActionForm } from "@/components/ui/ActionForm";
import { buttonClasses } from "@/components/ui/buttonStyles";
import { getGroup } from "@/lib/groups";
import { formatPaiseAsINR } from "@/lib/money";
import { requireUser } from "@/lib/requireUser";
import { submitQuotationAction, withdrawQuotationAction } from "@/lib/sellerActions";
import { getMyQuotation, getMySeller } from "@/lib/sellers";

export const metadata: Metadata = { title: "Submit quotation" };
export const dynamic = "force-dynamic";

const field = "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm";
const labelClass = "mb-1 block text-xs font-semibold text-ink-500";

export default async function SellerGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await requireUser();
  const seller = await getMySeller(user.id);
  if (!seller || seller.status !== "verified") notFound();

  const group = await getGroup(id);
  if (!group) notFound();
  const mine = await getMyQuotation(id, user.id);
  const active = mine?.status === "submitted" ? mine : null;
  const tierAt = (i: number) => active?.quotation_tiers[i];

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/seller" className="text-sm font-semibold text-accent-600">
        ← Seller portal
      </Link>
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
          {group.variant.product.brand} · {group.region.name}
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
          {group.variant.product.name}
        </h1>
        <p className="text-ink-500">{group.variant.label}</p>
        <p className="mt-3 text-sm">
          <span className="font-semibold">{group.member_count}</span> buyers (minimum{" "}
          {group.min_members}) · bidding closes in <Countdown target={group.bidding_deadline_at} />
        </p>
      </header>

      {group.status !== "bidding" ? (
        <p className="text-ink-500">Bidding is not open for this group.</p>
      ) : (
        <>
          <ActionForm
            action={submitQuotationAction}
            className="space-y-4 rounded-2xl border border-line bg-card p-6 shadow-card"
          >
            <input type="hidden" name="groupId" value={group.id} />
            <p className="text-sm text-ink-500">
              Set price tiers: more buyers, lower price. The first tier must start at or below{" "}
              {group.min_members} members. Prices are per unit in rupees.
            </p>
            {[1, 2, 3].map((i) => (
              <div key={i} className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor={`t${i}Min`} className={labelClass}>
                    Tier {i}: from members
                  </label>
                  <input
                    id={`t${i}Min`}
                    name={`t${i}Min`}
                    type="number"
                    min={1}
                    defaultValue={tierAt(i - 1)?.min_members}
                    required={i === 1}
                    className={field}
                  />
                </div>
                <div>
                  <label htmlFor={`t${i}Price`} className={labelClass}>
                    Tier {i}: price per unit (₹)
                  </label>
                  <input
                    id={`t${i}Price`}
                    name={`t${i}Price`}
                    type="number"
                    min={1}
                    step="0.01"
                    defaultValue={
                      tierAt(i - 1) ? Number(tierAt(i - 1)!.unit_price_paise) / 100 : undefined
                    }
                    required={i === 1}
                    className={field}
                  />
                </div>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="deliveryDays" className={labelClass}>
                  Delivery (days)
                </label>
                <input
                  id="deliveryDays"
                  name="deliveryDays"
                  type="number"
                  min={1}
                  max={90}
                  required
                  defaultValue={active?.delivery_days}
                  className={field}
                />
              </div>
              <div>
                <label htmlFor="warrantyMonths" className={labelClass}>
                  Warranty (months)
                </label>
                <input
                  id="warrantyMonths"
                  name="warrantyMonths"
                  type="number"
                  min={0}
                  max={120}
                  required
                  defaultValue={active?.warranty_months ?? 12}
                  className={field}
                />
              </div>
            </div>
            <div>
              <label htmlFor="notes" className={labelClass}>
                Notes for buyers (optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                maxLength={500}
                rows={3}
                defaultValue={active?.notes ?? ""}
                className={field}
              />
            </div>
            <button type="submit" className={buttonClasses("primary")}>
              {active ? "Update quotation" : "Submit quotation"}
            </button>
          </ActionForm>

          {active ? (
            <ActionForm action={withdrawQuotationAction}>
              <input type="hidden" name="groupId" value={group.id} />
              <p className="mb-2 text-sm text-ink-500">
                Current:{" "}
                {active.quotation_tiers
                  .map(
                    (t) => `${t.min_members}+ at ${formatPaiseAsINR(Number(t.unit_price_paise))}`,
                  )
                  .join(" · ")}
              </p>
              <button type="submit" className={buttonClasses("secondary")}>
                Withdraw quotation
              </button>
            </ActionForm>
          ) : null}
        </>
      )}
    </div>
  );
}
