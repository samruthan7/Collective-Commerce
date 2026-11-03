import type { Metadata } from "next";
import Link from "next/link";
import { STATUS_LABELS, type GroupStatus } from "@/lib/groups";
import { formatPaiseAsINR } from "@/lib/money";
import { listMyQuotes } from "@/lib/myQuotes";

export const metadata: Metadata = { title: "My quotations" };
export const dynamic = "force-dynamic";

export default async function MyQuotesPage() {
  const rows = await listMyQuotes();

  return (
    <div className="space-y-6">
      <header>
        <Link href="/seller" className="text-sm font-semibold text-accent-600">
          ← Seller portal
        </Link>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">My quotations</h1>
      </header>

      {rows.length === 0 ? (
        <p className="text-ink-500">You have not quoted any group yet.</p>
      ) : (
        <ul className="space-y-4">
          {rows.map((r) => (
            <li
              key={r.groupId}
              className="max-w-2xl rounded-2xl border border-line bg-card p-6 shadow-card"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{r.productName}</p>
                  <p className="text-sm text-ink-500">{r.variantLabel}</p>
                </div>
                <span className="rounded-full bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-700">
                  {r.quoteStatus === "withdrawn"
                    ? "Withdrawn"
                    : (STATUS_LABELS[r.groupStatus as GroupStatus] ?? r.groupStatus)}
                </span>
              </div>
              <p className="mt-3 text-sm">
                {r.memberCount} buyers · your price now:{" "}
                <span className="font-semibold">
                  {r.currentPricePaise !== null
                    ? formatPaiseAsINR(r.currentPricePaise)
                    : "no tier reached yet"}
                </span>
              </p>
              <ul className="mt-2 space-y-0.5 text-sm text-ink-500">
                {r.tiers.map((t) => (
                  <li key={t.minMembers}>
                    {t.minMembers}+ buyers: {formatPaiseAsINR(t.unitPricePaise)}
                  </li>
                ))}
              </ul>
              {r.groupStatus === "bidding" && r.quoteStatus === "submitted" ? (
                <Link
                  href={`/seller/groups/${r.groupId}`}
                  className="mt-3 inline-block text-sm font-semibold text-accent-600"
                >
                  Edit quotation →
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
