import type { Metadata } from "next";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/buttonStyles";
import { getProfile, requireUser } from "@/lib/auth";
import { formatPaiseAsINR } from "@/lib/money";
import { listMyGroups } from "@/lib/myGroups";
import { fulfilmentLabel } from "@/lib/orderStatus";
import { listMyOrders } from "@/lib/orderTracking";
import { getUnreadCount } from "@/lib/unread";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

const GROUP_STATUS: Record<string, string> = {
  open: "Open to join",
  full: "Full",
  bidding: "Sellers bidding",
  locked: "Choose an offer",
  completed: "Completed",
  cancelled: "Cancelled",
  expired_no_offers: "No offers",
};

const ACTIVE = new Set(["open", "full", "bidding", "locked"]);

export default async function BuyerDashboardPage() {
  const user = await requireUser("/dashboard");
  const profile = await getProfile(user.id);
  const name = profile?.full_name ?? user.email ?? "there";

  const [groups, orders, unread] = await Promise.all([
    listMyGroups(),
    listMyOrders(),
    getUnreadCount(),
  ]);

  const activeGroups = groups.filter((g) => ACTIVE.has(g.status));
  const toChoose = groups.filter((g) => g.status === "locked" && !g.chosen).length;
  const inProgress = orders.filter((o) => o.fulfilment !== "delivered");
  const toConfirm = orders.filter((o) => o.fulfilment === "shipped").length;

  const stats = [
    { label: "Active groups", value: activeGroups.length, href: "/my/groups" },
    { label: "Orders in progress", value: inProgress.length, href: "/my/orders" },
    { label: "Unread alerts", value: unread, href: "/notifications" },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Welcome, {name}</h1>
        <p className="mt-2 text-ink-500">Here is where your groups and orders stand.</p>
      </header>

      {toChoose > 0 || toConfirm > 0 ? (
        <section
          aria-label="Needs your attention"
          className="rounded-2xl border border-accent-500 bg-accent-50 p-5"
        >
          <p className="font-semibold text-accent-700">Needs your attention</p>
          <ul className="mt-2 space-y-1 text-sm text-ink-700">
            {toChoose > 0 ? (
              <li>
                {toChoose} group{toChoose === 1 ? " has" : "s have"} offers ready.{" "}
                <Link href="/my/groups" className="font-semibold underline">
                  Choose an offer
                </Link>
              </li>
            ) : null}
            {toConfirm > 0 ? (
              <li>
                {toConfirm} order{toConfirm === 1 ? " has" : "s have"} shipped.{" "}
                <Link href="/my/orders" className="font-semibold underline">
                  Confirm delivery
                </Link>
              </li>
            ) : null}
          </ul>
        </section>
      ) : null}

      <ul className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <li key={s.label}>
            <Link
              href={s.href}
              className="block rounded-2xl border border-line bg-card p-5 shadow-card transition-colors hover:border-accent-500"
            >
              <p className="text-3xl font-semibold">{s.value}</p>
              <p className="mt-1 text-sm text-ink-500">{s.label}</p>
            </Link>
          </li>
        ))}
      </ul>

      <section aria-labelledby="groups-h" className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 id="groups-h" className="font-semibold">
            Your groups
          </h2>
          <Link href="/my/groups" className="text-sm font-medium text-accent-700 hover:underline">
            See all
          </Link>
        </div>

        {groups.length === 0 ? (
          <div className="rounded-2xl border border-line bg-card p-6 shadow-card">
            <p className="font-semibold">You have not joined a group yet</p>
            <p className="mt-1 text-sm text-ink-500">
              Pick a product, join a group, and sellers compete for your combined demand.
            </p>
            <div className="mt-4 flex gap-3">
              <Link href="/catalog" className={buttonClasses("primary")}>
                Browse the catalog
              </Link>
              <Link href="/groups" className={buttonClasses("secondary")}>
                See open groups
              </Link>
            </div>
          </div>
        ) : (
          <ul className="space-y-3">
            {groups.slice(0, 5).map((g) => (
              <li key={g.groupId}>
                <Link
                  href={`/groups/${g.groupId}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-card p-4 shadow-card transition-colors hover:border-accent-500"
                >
                  <div>
                    <p className="font-semibold">
                      {g.brand} {g.productName}
                    </p>
                    <p className="text-sm text-ink-500">
                      {g.variantLabel} · {g.memberCount}/{g.minMembers} buyers
                      {g.chosen && g.chosen.unitPricePaise !== null
                        ? ` · ${g.chosen.sellerName} at ${formatPaiseAsINR(g.chosen.unitPricePaise)}`
                        : ""}
                    </p>
                  </div>
                  <span className="rounded-full bg-accent-50 px-2.5 py-0.5 text-xs font-semibold text-accent-700">
                    {GROUP_STATUS[g.status] ?? g.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {inProgress.length > 0 ? (
        <section aria-labelledby="orders-h" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 id="orders-h" className="font-semibold">
              Orders in progress
            </h2>
            <Link href="/my/orders" className="text-sm font-medium text-accent-700 hover:underline">
              See all
            </Link>
          </div>
          <ul className="space-y-3">
            {inProgress.slice(0, 3).map((o) => (
              <li
                key={o.groupId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-card p-4 shadow-card"
              >
                <div>
                  <p className="font-semibold">{o.productName}</p>
                  <p className="text-sm text-ink-500">
                    {o.sellerName} · {o.variantLabel}
                  </p>
                </div>
                <span className="rounded-full bg-accent-50 px-2.5 py-0.5 text-xs font-semibold text-accent-700">
                  {fulfilmentLabel(o.fulfilment)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
