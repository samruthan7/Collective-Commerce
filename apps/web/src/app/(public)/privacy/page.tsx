import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <article className="max-w-2xl space-y-4">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Privacy policy</h1>
      <p className="rounded-xl bg-accent-50 p-3 text-sm text-accent-700">
        Draft for the project. Have a lawyer review it, under India&apos;s Digital Personal Data
        Protection Act 2023, before real users sign up.
      </p>
      <h2 className="pt-2 font-semibold">What we collect</h2>
      <p className="text-ink-500">
        Your name, email address and optional phone number, the groups you join, the offers you
        choose, and your order and review activity.
      </p>
      <h2 className="pt-2 font-semibold">Who can see it</h2>
      <p className="text-ink-500">
        Other buyers see only an anonymised first name and initial. Sellers see only aggregate
        demand for a group. A seller sees your name and email only after you choose their offer and
        the selection window closes. You see the seller&apos;s contact details at the same point.
      </p>
      <h2 className="pt-2 font-semibold">Payments</h2>
      <p className="text-ink-500">
        The platform does not take payments or store card details. You pay the seller directly.
      </p>
      <h2 className="pt-2 font-semibold">Your rights</h2>
      <p className="text-ink-500">
        You can ask to access, correct or delete your data. Contact the grievance officer on the
        grievance page.
      </p>
    </article>
  );
}
