import Link from "next/link";
import { ApiStatus } from "@/components/domain/ApiStatus";
import { buttonClasses } from "@/components/ui/buttonStyles";

const steps = [
  {
    title: "Pick the exact product",
    text: "Choose the precise variant you want, so everyone in the group buys the very same thing.",
  },
  {
    title: "Join or start a group",
    text: "Join buyers who want it too. The more people join, the better the offers can get.",
  },
  {
    title: "Compare offers, choose freely",
    text: "Verified sellers bid in sealed quotations. You see the true total cost and decide for yourself, with no obligation.",
  },
] as const;

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="max-w-3xl pt-4 sm:pt-10">
        <p className="text-sm font-semibold text-accent-600">Collective buying, made fair</p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Buy together. Let sellers compete for your group.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-ink-500">
          Join buyers who want the exact same product. Verified sellers bid for your combined
          demand, and every buyer accepts or declines on their own.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/dashboard" className={buttonClasses("primary")}>
            Open buyer area
          </Link>
          <Link href="/seller" className={buttonClasses("secondary")}>
            Sell on Collective Commerce
          </Link>
        </div>
      </section>

      <section aria-labelledby="status-heading" className="max-w-3xl">
        <h2 id="status-heading" className="mb-3 text-sm font-semibold text-ink-500">
          Development status
        </h2>
        <ApiStatus />
      </section>

      <section aria-labelledby="how-heading">
        <h2 id="how-heading" className="font-display text-2xl font-semibold tracking-tight">
          How it works
        </h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="rounded-2xl border border-line bg-card p-6 shadow-card">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-50 text-sm font-semibold text-accent-700">
                {index + 1}
              </span>
              <h3 className="mt-4 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-ink-500">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}