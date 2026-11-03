import { formatPaiseAsINR } from "@/lib/money";
import type { Offer } from "@/lib/offers";
import { effectiveTier, lowestIndex, nextTier } from "@/lib/tiers";

export function OfferComparison({ members, offers }: { members: number; offers: Offer[] }) {
  const prices = offers.map((o) => effectiveTier(o.tiers, members)?.unitPricePaise ?? null);
  const best = lowestIndex(prices);

  return (
    <section aria-labelledby="cmp-h" className="max-w-2xl">
      <h2 id="cmp-h" className="font-semibold">
        Compare offers
      </h2>
      <div className="mt-3 overflow-x-auto rounded-2xl border border-line bg-card shadow-card">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Offers compared at {members} buyers</caption>
          <thead>
            <tr className="border-b border-line text-ink-500">
              <th scope="col" className="px-4 py-3 font-medium">
                Seller
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Price now
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Delivery
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Warranty
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Next tier
              </th>
            </tr>
          </thead>
          <tbody>
            {offers.map((o, i) => {
              const upcoming = nextTier(o.tiers, members);
              return (
                <tr key={o.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-semibold">{o.sellerName}</td>
                  <td className="px-4 py-3">
                    {prices[i] !== null ? formatPaiseAsINR(prices[i] as number) : "Not unlocked"}
                    {i === best ? (
                      <span className="ml-2 rounded-full bg-accent-50 px-2 py-0.5 text-xs font-semibold text-accent-700">
                        Lowest
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{o.deliveryDays} days</td>
                  <td className="px-4 py-3">{o.warrantyMonths} months</td>
                  <td className="px-4 py-3 text-ink-500">
                    {upcoming
                      ? `${upcoming.minMembers}+ buyers: ${formatPaiseAsINR(upcoming.unitPricePaise)}`
                      : "None"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
