import { ActionForm } from "@/components/ui/ActionForm";
import { buttonClasses } from "@/components/ui/buttonStyles";
import { formatPaiseAsINR } from "@/lib/money";
import { selectOfferAction } from "@/lib/offerActions";
import type { Offer } from "@/lib/offers";
import { effectiveTier } from "@/lib/tiers";

interface OffersPanelProps {
  groupId: string;
  members: number;
  offers: Offer[];
  selectedId: string | null;
  canSelect: boolean;
}

export function OffersPanel({ groupId, members, offers, selectedId, canSelect }: OffersPanelProps) {
  return (
    <section aria-labelledby="offers-h" className="max-w-2xl space-y-4">
      <h2 id="offers-h" className="font-semibold">
        Offers ({members} buyers locked in)
      </h2>
      {offers.map((o) => {
        const unlocked = effectiveTier(o.tiers, members);
        return (
          <article key={o.id} className="rounded-2xl border border-line bg-card p-5 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{o.sellerName}</p>
                <p className="text-sm text-ink-500">
                  {o.sellerCity} · delivery in {o.deliveryDays} days · {o.warrantyMonths} months
                  warranty
                </p>
              </div>
              <p className="text-right text-lg font-semibold">
                {unlocked ? formatPaiseAsINR(unlocked.unitPricePaise) : "Not unlocked"}
              </p>
            </div>
            <ul className="mt-3 space-y-1 text-sm">
              {o.tiers.map((t) => (
                <li
                  key={t.minMembers}
                  className={
                    unlocked?.minMembers === t.minMembers
                      ? "font-semibold text-success-600"
                      : "text-ink-500"
                  }
                >
                  {t.minMembers}+ buyers: {formatPaiseAsINR(t.unitPricePaise)}
                  {unlocked?.minMembers === t.minMembers ? " (your group's price)" : ""}
                </li>
              ))}
            </ul>
            {o.notes ? <p className="mt-3 text-sm text-ink-500">{o.notes}</p> : null}
            {canSelect ? (
              <ActionForm action={selectOfferAction} className="mt-4">
                <input type="hidden" name="groupId" value={groupId} />
                <input type="hidden" name="quotationId" value={o.id} />
                <button
                  type="submit"
                  className={buttonClasses(selectedId === o.id ? "secondary" : "primary")}
                >
                  {selectedId === o.id ? "Chosen ✓" : "Choose this offer"}
                </button>
              </ActionForm>
            ) : null}
          </article>
        );
      })}
      <p className="text-sm text-ink-500">
        You pay the seller directly. The platform does not take payments. You can change your choice
        until selection closes.
      </p>
    </section>
  );
}
