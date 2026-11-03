import type { Metadata } from "next";
import Link from "next/link";
import { FulfilmentTrack } from "@/components/domain/FulfilmentTrack";
import { ActionForm } from "@/components/ui/ActionForm";
import { buttonClasses } from "@/components/ui/buttonStyles";
import { submitReportAction, submitReviewAction } from "@/lib/feedbackActions";
import { formatPaiseAsINR } from "@/lib/money";
import { listMyOrders } from "@/lib/orderTracking";
import { confirmDeliveryAction } from "@/lib/orderTrackingActions";
import { REPORT_REASONS } from "@/lib/reportReasons";
import { listMyReviewedGroupIds } from "@/lib/reviews";

export const metadata: Metadata = { title: "My orders" };
export const dynamic = "force-dynamic";

const fieldClasses =
  "w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent-500";

export default async function MyOrdersPage() {
  const [orders, reviewed] = await Promise.all([listMyOrders(), listMyReviewedGroupIds()]);

  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <h1 className="font-display text-3xl font-semibold tracking-tight">My orders</h1>
        <p className="mt-3 text-ink-500">
          Orders appear here once a group&apos;s selection window closes. You pay the seller
          directly, and the seller&apos;s contact details are shown below.
        </p>
      </header>

      {orders.length === 0 ? (
        <div className="max-w-2xl rounded-2xl border border-line bg-card p-6 shadow-card">
          <p className="font-semibold">No orders yet</p>
          <p className="mt-1 text-sm text-ink-500">
            Join a group, choose an offer, and your order will show up when the group closes.
          </p>
          <div className="mt-4 flex gap-3">
            <Link href="/groups" className={buttonClasses("primary")}>
              Browse groups
            </Link>
            <Link href="/my/groups" className={buttonClasses("secondary")}>
              My groups
            </Link>
          </div>
        </div>
      ) : (
        <ul className="max-w-2xl space-y-4">
          {orders.map((o) => (
            <li key={o.groupId} className="rounded-2xl border border-line bg-card p-5 shadow-card">
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

              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-ink-500">Seller</dt>
                  <dd className="mt-0.5 font-medium">{o.sellerName}</dd>
                </div>
                <div>
                  <dt className="text-ink-500">Contact</dt>
                  <dd className="mt-0.5 font-medium">
                    {o.sellerPhone}
                    {o.sellerCity ? ` · ${o.sellerCity}` : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-500">Delivery</dt>
                  <dd className="mt-0.5 font-medium">Within {o.deliveryDays} days</dd>
                </div>
              </dl>

              {o.fulfilment === "shipped" ? (
                <ActionForm action={confirmDeliveryAction} className="mt-4">
                  <input type="hidden" name="groupId" value={o.groupId} />
                  <button type="submit" className={buttonClasses("primary")}>
                    I received it
                  </button>
                </ActionForm>
              ) : null}
              {o.fulfilment === "confirmed" ? (
                <p className="mt-4 text-sm text-ink-500">
                  Waiting for the seller to ship. Contact them above if you need an update.
                </p>
              ) : null}

              {o.fulfilment === "delivered" ? (
                reviewed.has(o.groupId) ? (
                  <p className="mt-4 text-sm font-medium text-success-600">
                    Delivered ✓ Thanks for your review.
                  </p>
                ) : (
                  <div className="mt-4 border-t border-line pt-4">
                    <p className="text-sm font-semibold">How was {o.sellerName}?</p>
                    <ActionForm action={submitReviewAction} className="mt-3 space-y-3">
                      <input type="hidden" name="groupId" value={o.groupId} />
                      <label className="block text-sm">
                        <span className="sr-only">Rating</span>
                        <select name="rating" defaultValue="5" className={fieldClasses}>
                          <option value="5">5 – Excellent</option>
                          <option value="4">4 – Good</option>
                          <option value="3">3 – Okay</option>
                          <option value="2">2 – Poor</option>
                          <option value="1">1 – Very poor</option>
                        </select>
                      </label>
                      <label className="block text-sm">
                        <span className="sr-only">Comment (optional)</span>
                        <textarea
                          name="comment"
                          rows={2}
                          maxLength={500}
                          placeholder="Comment (optional)"
                          className={fieldClasses}
                        />
                      </label>
                      <button type="submit" className={buttonClasses("primary")}>
                        Submit review
                      </button>
                    </ActionForm>
                  </div>
                )
              ) : null}

              <details className="mt-4 border-t border-line pt-3">
                <summary className="cursor-pointer text-sm font-medium text-ink-500 hover:text-accent-700">
                  Report a problem
                </summary>
                <ActionForm action={submitReportAction} className="mt-3 space-y-3">
                  <input type="hidden" name="groupId" value={o.groupId} />
                  <label className="block text-sm">
                    <span className="sr-only">Reason</span>
                    <select name="reason" defaultValue="not_delivered" className={fieldClasses}>
                      {REPORT_REASONS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm">
                    <span className="sr-only">Details</span>
                    <textarea
                      name="details"
                      rows={3}
                      maxLength={1000}
                      placeholder="What happened?"
                      className={fieldClasses}
                    />
                  </label>
                  <button type="submit" className={buttonClasses("secondary")}>
                    Send report
                  </button>
                </ActionForm>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
