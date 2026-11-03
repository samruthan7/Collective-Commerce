import type { Metadata } from "next";

export const metadata: Metadata = { title: "Grievance officer" };

export default function GrievancePage() {
  return (
    <article className="max-w-2xl space-y-4">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Grievance officer</h1>
      <p className="text-ink-500">
        If you have a complaint about the platform, a seller, or how your data is handled, contact
        our grievance officer. We aim to acknowledge complaints within 48 hours.
      </p>
      <dl className="rounded-2xl border border-line bg-card p-5 text-sm shadow-card">
        <div className="py-1">
          <dt className="text-ink-500">Name</dt>
          <dd className="font-medium">Deva Samruthan</dd>
        </div>
        <div className="py-1">
          <dt className="text-ink-500">Email</dt>
          <dd className="font-medium">samruthan7@gmail.com</dd>
        </div>
        <div className="py-1">
          <dt className="text-ink-500">Address</dt>
          <dd className="font-medium">Mudichur, Varadharajapuram ,Chennai-600048</dd>
        </div>
      </dl>
    </article>
  );
}
