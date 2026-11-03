import type { Metadata } from "next";
import { formatPaiseAsINR } from "@/lib/money";
import { listMyOrders } from "@/lib/orders";

export const metadata: Metadata = { title: "My orders" };
export const dynamic = "force-dynamic";

export default async function MyOrdersPage() {
  const orders = await listMyOrders();

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight">My orders</h1>
        <p className="mt-2 text-ink-500">
          Once selection closes, you see the seller you chose. Contact them directly. Payment is
          between you and the seller.
        </p>
      </header>
      {orders.length === 0 ? (
        <p className="text-ink-500">
          No finished orders yet. They appear after the selection period ends.
        </p>
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => (
            <li key={o.group_id} className="rounded-2xl border border-line bg-card p-6 shadow-card">
              <p className="font-semibold">{o.product_name}</p>
              <p className="text-sm text-ink-500">{o.variant_label}</p>
              <p className="mt-3 text-sm">
                Price:{" "}
                <span className="font-semibold">
                  {o.unit_price_paise !== null ? formatPaiseAsINR(o.unit_price_paise) : "n/a"}
                </span>
                {" · "}Delivery in {o.delivery_days} days
              </p>
              <p className="mt-1 text-sm">
                Seller: <span className="font-semibold">{o.seller_name}</span>, {o.seller_city}.
                Phone: {o.seller_phone}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
