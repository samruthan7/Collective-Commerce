"use client";

import { useActionState, type ReactNode } from "react";
import { initialActionState, type ActionState } from "@/lib/actionState";

interface ActionFormProps {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  children: ReactNode;
  className?: string;
}

export function ActionForm({ action, children, className }: ActionFormProps) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  return (
    <form action={formAction} className={className}>
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
      {state.error ? (
        <p role="alert" className="mt-2 text-sm text-danger-600">
          {state.error}
        </p>
      ) : null}
      {state.notice ? (
        <p role="status" className="mt-2 text-sm text-success-600">
          {state.notice}
        </p>
      ) : null}
    </form>
  );
}
