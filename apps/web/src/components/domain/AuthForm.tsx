"use client";

import Link from "next/link";
import { useActionState } from "react";
import { buttonClasses } from "@/components/ui/buttonStyles";
import { inputClasses } from "@/components/ui/inputStyles";
import { initialAuthFormState, type AuthFormState } from "@/lib/authForm";

interface AuthFormProps {
  mode: "login" | "signup";
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  /** Where to go after success. Checked again on the server. */
  next: string;
}

export function AuthForm({ mode, action, next }: AuthFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialAuthFormState);
  const isSignup = mode === "signup";

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-line bg-card p-8 shadow-card">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        {isSignup ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-2 text-sm text-ink-500">
        {isSignup
          ? "Join groups, compare offers and buy together."
          : "Log in to see your groups and offers."}
      </p>

      <form action={formAction} className="mt-6 space-y-4" noValidate>
        <input type="hidden" name="next" value={next} />

        {isSignup ? (
          <div>
            <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium">
              Full name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              disabled={isPending}
              className={inputClasses}
            />
          </div>
        ) : null}

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={isPending}
            className={inputClasses}
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            required
            minLength={isSignup ? 8 : undefined}
            disabled={isPending}
            className={inputClasses}
          />
          {isSignup ? <p className="mt-1.5 text-xs text-ink-500">At least 8 characters.</p> : null}
        </div>

        <div aria-live="polite">
          {state.error ? (
            <p role="alert" className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">
              {state.error}
            </p>
          ) : null}
          {state.notice ? (
            <p
              role="status"
              className="rounded-lg bg-success-50 px-3 py-2 text-sm text-success-600"
            >
              {state.notice}
            </p>
          ) : null}
        </div>

        <button type="submit" disabled={isPending} className={`${buttonClasses("primary")} w-full`}>
          {isPending ? "Please wait…" : isSignup ? "Create account" : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        {isSignup ? "Already have an account? " : "New here? "}
        <Link
          href={isSignup ? "/login" : "/signup"}
          className="font-semibold text-accent-600 hover:text-accent-700"
        >
          {isSignup ? "Log in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
