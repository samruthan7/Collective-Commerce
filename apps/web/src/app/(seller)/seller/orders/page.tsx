import type { Metadata } from "next";
import Link from "next/link";
import { FulfilmentTrack } from "@/components/domain/FulfilmentTrack";
import { ActionForm } from "@/components/ui/ActionForm";
import { buttonClasses } from "@/components/ui/buttonStyles";
import { formatPaiseAsINR } from "@/lib/money";
import { listSellerOrders } from "@/lib/orderTracking";
import { markShippedAction } from "@/lib/orderTrackingActions";

export const metadata: Metadata = { title: "Sales" };
export const dynamic = "force-dynamic";

export default async function SellerOrdersPage() {
  const orders = await listSellerOrders();

  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Sales</h1>
        <p className="mt-3 text-ink-500">
          Buyers who chose your offer appear here after the group&apos;s selection window closes.
          Buyers pay you directly. Mark each order as shipped so the buyer can confirm delivery.
        </p>
      </header>

      {orders.length === 0 ? (
        <div className="max-w-2xl rounded-2xl border border-line bg-card p-6 shadow-card">
          <p className="font-semibold">No sales yet</p>
          <p className="mt-1 text-sm text-ink-500">
            Bid on groups that are open for quotations. Orders show up here when buyers choose you.
          </p>
          <Link href="/seller" className={`${buttonClasses("primary")} mt-4 inline-block`}>
            Seller dashboard
          </Link>
        </div>
      ) : (
        <ul className="max-w-2xl space-y-4">
          {orders.map((o) => (
            <li
              key={`${o.groupId}-${o.buyerId}`}
              className="rounded-2xl border border-line bg-card p-5 shadow-card"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{o.productName}</p>
                  <p className="text-sm text-ink-500">{o.variantLabel}</p>
                </div>
                <p className="text-right text-lg font-semibold">
                  {o.unitPricePaise === null ? "Price pending" : formatPaiseAsINR(o.unitPricePaise)}
                </p>
              </div>

              <div className="mt-4">
                <FulfilmentTrack status={o.fulfilment} />
              </div>

              <p className="mt-4 text-sm">
                <span className="font-medium">{o.buyerName}</span>
                <span className="text-ink-500"> · {o.buyerEmail}</span>
              </p>

              {o.fulfilment === "confirmed" ? (
                <ActionForm action={markShippedAction} className="mt-4">
                  <input type="hidden" name="groupId" value={o.groupId} />
                  <input type="hidden" name="buyerId" value={o.buyerId} />
                  <button type="submit" className={buttonClasses("primary")}>
                    Mark as shipped
                  </button>
                </ActionForm>
              ) : null}
              {o.fulfilment === "shipped" ? (
                <p className="mt-4 text-sm text-ink-500">
                  Shipped. Waiting for the buyer to confirm.
                </p>
              ) : null}
              {o.fulfilment === "delivered" ? (
                <p className="mt-4 text-sm font-medium text-success-600">Delivered ✓</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
