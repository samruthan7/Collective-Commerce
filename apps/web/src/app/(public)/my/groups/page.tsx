import type { Metadata } from "next";
import Link from "next/link";
import { Countdown } from "@/components/domain/Countdown";
import { GroupProgress } from "@/components/domain/GroupProgress";
import { STATUS_LABELS, type GroupStatus } from "@/lib/groups";
import { formatPaiseAsINR } from "@/lib/money";
import { listMyGroups } from "@/lib/myGroups";

export const metadata: Metadata = { title: "My groups" };
export const dynamic = "force-dynamic";

export default async function MyGroupsPage() {
  const rows = await listMyGroups();

  return (
    <div className="space-y-8">
      <header className="max-w-2xl">
        <h1 className="font-display text-3xl font-semibold tracking-tight">My groups</h1>
        <p className="mt-2 text-ink-500">Groups you joined, and the offer you chose in each.</p>
      </header>

      {rows.length === 0 ? (
        <p className="text-ink-500">
          You have not joined any group yet.{" "}
          <Link href="/catalog" className="font-semibold text-accent-600">
            Browse the catalog
          </Link>
          .
        </p>
      ) : (
        <ul className="space-y-4">
          {rows.map((r) => (
            <li
              key={r.groupId}
              className="max-w-2xl rounded-2xl border border-line bg-card p-6 shadow-card"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                    {r.brand}
                  </p>
                  <Link href={`/groups/${r.groupId}`} className="font-semibold hover:underline">
                    {r.productName}
                  </Link>
                  <p className="text-sm text-ink-500">{r.variantLabel}</p>
                </div>
                <span className="rounded-full bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-700">
                  {STATUS_LABELS[r.status as GroupStatus] ?? r.status}
                </span>
              </div>
              <div className="mt-4">
                <GroupProgress
                  memberCount={r.memberCount}
                  minMembers={r.minMembers}
                  maxMembers={null}
                />
              </div>
              {r.status === "open" ? (
                <p className="mt-3 text-sm text-ink-500">
                  Joining closes in <Countdown target={r.joinDeadline} />
                </p>
              ) : null}
              {r.chosen ? (
                <p className="mt-3 text-sm">
                  Your choice: <span className="font-semibold">{r.chosen.sellerName}</span>
                  {r.chosen.unitPricePaise !== null ? (
                    <>
                      {" "}
                      at{" "}
                      <span className="font-semibold">
                        {formatPaiseAsINR(r.chosen.unitPricePaise)}
                      </span>
                    </>
                  ) : null}
                  , delivery in {r.chosen.deliveryDays} days.
                </p>
              ) : r.status === "locked" ? (
                <p className="mt-3 text-sm font-semibold text-accent-600">
                  <Link href={`/groups/${r.groupId}`}>Offers are ready. Choose one →</Link>
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
