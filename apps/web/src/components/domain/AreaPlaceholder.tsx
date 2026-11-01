interface AreaPlaceholderProps {
  title: string;
  description: string;
  availableIn: string;
}

/** Honest placeholder for areas that are built in later phases. */
export function AreaPlaceholder({ title, description, availableIn }: AreaPlaceholderProps) {
  return (
    <section className="mx-auto max-w-xl rounded-2xl border border-dashed border-line bg-card p-8 text-center shadow-card">
      <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 text-ink-500">{description}</p>
      <p className="mt-5 inline-flex rounded-full bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-700">
        Arrives in {availableIn}
      </p>
    </section>
  );
}