"use client";

import { useActionState } from "react";
import { buttonClasses } from "@/components/ui/buttonStyles";
import { startEnrollAction, verifyEnrollAction } from "@/lib/mfaActions";
import { initialEnrollState, initialVerifyState } from "@/lib/mfaTypes";

const fieldClasses =
  "w-40 rounded-xl border border-line bg-surface px-3 py-2 text-center font-mono text-lg tracking-widest outline-none focus:border-accent-500";

export function MfaEnroll() {
  const [enroll, startAction, starting] = useActionState(startEnrollAction, initialEnrollState);
  const [verify, verifyAction, verifying] = useActionState(verifyEnrollAction, initialVerifyState);

  if (!enroll.factorId) {
    return (
      <form action={startAction} className="space-y-3">
        <button type="submit" disabled={starting} className={buttonClasses("primary")}>
          {starting ? "Starting…" : "Set up authenticator app"}
        </button>
        {enroll.error ? (
          <p role="alert" className="text-sm text-red-600">
            {enroll.error}
          </p>
        ) : null}
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <ol className="list-decimal space-y-1 pl-5 text-sm text-ink-700">
        <li>Open an authenticator app (Google Authenticator, Microsoft Authenticator, Authy).</li>
        <li>Scan this QR code, or type the key below.</li>
        <li>Enter the 6-digit code the app shows.</li>
      </ol>
      {enroll.qr ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={enroll.qr} alt="QR code for your authenticator app" className="h-48 w-48" />
      ) : null}
      {enroll.secret ? (
        <p className="text-sm text-ink-500">
          Key: <span className="font-mono text-ink-700">{enroll.secret}</span>
        </p>
      ) : null}
      <form action={verifyAction} className="space-y-3">
        <input type="hidden" name="factorId" value={enroll.factorId} />
        <label className="block text-sm">
          <span className="sr-only">6-digit code</span>
          <input
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            placeholder="000000"
            className={fieldClasses}
          />
        </label>
        <button type="submit" disabled={verifying} className={buttonClasses("primary")}>
          {verifying ? "Checking…" : "Verify and turn on"}
        </button>
        {verify.error ? (
          <p role="alert" className="text-sm text-red-600">
            {verify.error}
          </p>
        ) : null}
      </form>
    </div>
  );
}
