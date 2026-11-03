import type { Metadata } from "next";
import Link from "next/link";
import { AutoRefresh } from "@/components/domain/AutoRefresh";
import { Countdown } from "@/components/domain/Countdown";
import { GroupProgress } from "@/components/domain/GroupProgress";
import { listActiveGroups, STATUS_LABELS } from "@/lib/groups";

export const metadata: Metadata = { title: "Groups" };
export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const groups = await listActiveGroups();

  return (
    <div className="space-y-8">
      <AutoRefresh />
      <header className="max-w-2xl">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Active groups</h1>
        <p className="mt-3 text-ink-500">
          Join a group for the exact variant you want. Joining is free and is not a purchase.
        </p>
      </header>

      {groups.length === 0 ? (
        <p className="text-ink-500">
          No active groups yet.{" "}
          <Link href="/catalog" className="font-semibold text-accent-600">
            Browse the catalog
          </Link>{" "}
          and be the first to start one.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <li key={g.id}>
              <Link
                href={`/groups/${g.id}`}
                className="block h-full rounded-2xl border border-line bg-card p-6 shadow-card transition-colors hover:border-accent-500"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                  {g.variant.product.brand} · {g.region.name}
                </p>
                <h2 className="mt-1 font-semibold">{g.variant.product.name}</h2>
                <p className="text-sm text-ink-500">{g.variant.label}</p>
                <div className="mt-4">
                  <GroupProgress
                    memberCount={g.member_count}
                    minMembers={g.min_members}
                    maxMembers={g.max_members}
                  />
                </div>
                <p className="mt-3 flex justify-between text-xs text-ink-500">
                  <span>{STATUS_LABELS[g.status]}</span>
                  {g.status === "open" ? <Countdown target={g.join_deadline_at} /> : null}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
