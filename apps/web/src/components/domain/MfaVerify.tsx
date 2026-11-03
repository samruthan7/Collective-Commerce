"use client";

import { useActionState } from "react";
import { buttonClasses } from "@/components/ui/buttonStyles";
import { verifyLoginAction } from "@/lib/mfaActions";
import { initialVerifyState } from "@/lib/mfaTypes";

const fieldClasses =
  "w-40 rounded-xl border border-line bg-surface px-3 py-2 text-center font-mono text-lg tracking-widest outline-none focus:border-accent-500";

export function MfaVerify({ next }: { next: string }) {
  const [state, action, pending] = useActionState(verifyLoginAction, initialVerifyState);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="next" value={next} />
      <label className="block text-sm">
        <span className="sr-only">6-digit code</span>
        <input
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          autoFocus
          placeholder="000000"
          className={fieldClasses}
        />
      </label>
      <button type="submit" disabled={pending} className={buttonClasses("primary")}>
        {pending ? "Checking…" : "Continue"}
      </button>
      {state.error ? (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
