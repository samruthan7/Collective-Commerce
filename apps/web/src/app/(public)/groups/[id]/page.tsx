import { OfferComparison } from "@/components/domain/OfferComparison";
import { OffersPanel } from "@/components/domain/OffersPanel";
import { getMySelection, listOffers } from "@/lib/offers";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AutoRefresh } from "@/components/domain/AutoRefresh";
import { Countdown } from "@/components/domain/Countdown";
import { GroupActions } from "@/components/domain/GroupActions";
import { GroupProgress } from "@/components/domain/GroupProgress";
import { getGroup, getMyMembership, listGroupMembers, STATUS_LABELS } from "@/lib/groups";

export const metadata: Metadata = { title: "Group" };
export const dynamic = "force-dynamic";

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const group = await getGroup(id);
  if (!group) notFound();

  const [members, mine] = await Promise.all([listGroupMembers(id), getMyMembership(id)]);
  const committed = members.filter((m) => m.commitment === "committed").length;
  const showOffers = group.status === "locked" || group.status === "completed";
  const [offers, selectedId] = showOffers
    ? await Promise.all([listOffers(id), getMySelection(id)])
    : [[], null];

  return (
    <div className="space-y-8">
      <AutoRefresh />
      <header className="max-w-2xl">
        <Link href="/groups" className="text-sm font-semibold text-accent-600">
          ← All groups
        </Link>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-ink-500">
          {group.variant.product.brand} · {group.region.name}
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
          {group.variant.product.name}
        </h1>
        <p className="mt-1 text-ink-500">{group.variant.label}</p>
        <p className="mt-3 inline-flex rounded-full bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-700">
          {STATUS_LABELS[group.status]}
        </p>
      </header>

      <section className="max-w-2xl rounded-2xl border border-line bg-card p-6 shadow-card">
        <GroupProgress
          memberCount={group.member_count}
          minMembers={group.min_members}
          maxMembers={group.max_members}
        />
        <dl className="mt-5 grid grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-ink-500">Joining closes</dt>
            <dd className="font-semibold">
              {group.status === "open" ? <Countdown target={group.join_deadline_at} /> : "Closed"}
            </dd>
          </div>
          <div>
            <dt className="text-ink-500">Committed</dt>
            <dd className="font-semibold">{committed}</dd>
          </div>
          <div>
            <dt className="text-ink-500">Interested</dt>
            <dd className="font-semibold">{members.length - committed}</dd>
          </div>
        </dl>
      </section>

      <section className="max-w-2xl rounded-2xl border border-line bg-card p-6 shadow-card">
        <GroupActions group={group} isMember={mine !== null} />
      </section>

      <section aria-labelledby="members-h" className="max-w-2xl">
        <h2 id="members-h" className="font-semibold">
          Members
        </h2>
        {members.length === 0 ? (
          <p className="mt-2 text-sm text-ink-500">No members yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-card text-sm">
            {members.map((m, i) => (
              <li key={i} className="flex justify-between px-5 py-3">
                <span>{m.display_name}</span>
                <span className="text-ink-500">
                  {m.commitment === "committed" ? "Committed" : "Interested"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      {showOffers && offers.length > 1 ? (
        <OfferComparison members={group.member_count} offers={offers} />
      ) : null}
      {showOffers && offers.length > 0 ? (
        <OffersPanel
          groupId={group.id}
          members={group.member_count}
          offers={offers}
          selectedId={selectedId}
          canSelect={group.status === "locked" && mine !== null}
        />
      ) : null}
      <p className="text-sm text-ink-500">
        Joining a group is not a purchase. You choose an offer individually later. Names are
        shortened to protect privacy.
      </p>
    </div>
  );
}
