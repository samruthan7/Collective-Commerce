"use client";

import { buttonClasses } from "@/components/ui/buttonStyles";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-3 text-ink-500">
        An unexpected error occurred. You can try again, and if it keeps happening please come back
        a little later.
      </p>
      {error.digest ? <p className="mt-2 text-xs text-ink-300">Reference: {error.digest}</p> : null}
      <button type="button" onClick={reset} className={`${buttonClasses("primary")} mt-6`}>
        Try again
      </button>
    </main>
  );
}
