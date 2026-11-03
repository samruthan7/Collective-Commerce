import type { Metadata } from "next";
import Link from "next/link";
import { formatPaiseAsINR } from "@/lib/money";
import { listSellerOrders } from "@/lib/orders";

export const metadata: Metadata = { title: "Orders" };
export const dynamic = "force-dynamic";

export default async function SellerOrdersPage() {
  const orders = await listSellerOrders();

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <Link href="/seller" className="text-sm font-semibold text-accent-600">
          ← Seller portal
        </Link>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Orders</h1>
        <p className="mt-2 text-ink-500">
          Buyers who chose your offer. Contact details appear after the selection period ends.
          Collect payment directly from the buyer.
        </p>
      </header>
      {orders.length === 0 ? (
        <p className="text-ink-500">No orders yet.</p>
      ) : (
        <ul className="space-y-4">
          {orders.map((o, i) => (
            <li
              key={`${o.group_id}-${i}`}
              className="rounded-2xl border border-line bg-card p-6 shadow-card"
            >
              <p className="font-semibold">
                {o.product_name} · {o.variant_label}
              </p>
              <p className="mt-2 text-sm">
                Buyer: <span className="font-semibold">{o.buyer_name}</span> · {o.buyer_email}
              </p>
              <p className="mt-1 text-sm">
                Price:{" "}
                <span className="font-semibold">
                  {o.unit_price_paise !== null ? formatPaiseAsINR(o.unit_price_paise) : "n/a"}
                </span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
