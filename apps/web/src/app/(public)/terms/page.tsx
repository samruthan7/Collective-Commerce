import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of service" };

export default function TermsPage() {
  return (
    <article className="max-w-2xl space-y-4">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Terms of service</h1>
      <p className="rounded-xl bg-accent-50 p-3 text-sm text-accent-700">
        Draft for the project. Have a lawyer review it, including the wording on binding quotations
        and the E-Commerce Rules 2020, before launch.
      </p>
      <h2 className="pt-2 font-semibold">What this platform does</h2>
      <p className="text-ink-500">
        Collective Commerce brings buyers together into groups and lets verified sellers compete to
        supply them. We do not sell products ourselves.
      </p>
      <h2 className="pt-2 font-semibold">Buyers</h2>
      <p className="text-ink-500">
        Joining a group is not a purchase. You choose an offer yourself, can change that choice
        until selection closes, and pay the seller directly.
      </p>
      <h2 className="pt-2 font-semibold">Sellers</h2>
      <p className="text-ink-500">
        Sellers set all prices and terms. A quotation you submit is an offer you are expected to
        honour at the tier the group reaches. Sellers must be verified before bidding.
      </p>
      <h2 className="pt-2 font-semibold">Problems</h2>
      <p className="text-ink-500">
        Buyers can report a problem with an order from the My orders page. We review reports and may
        suspend sellers who repeatedly fail to deliver.
      </p>
    </article>
  );
}
