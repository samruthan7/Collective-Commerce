"use client";

import { useQuery } from "@tanstack/react-query";
import { z } from "@cc/shared";
import { buttonClasses } from "@/components/ui/buttonStyles";
import { apiGet } from "@/lib/apiClient";

const healthSchema = z.object({
  status: z.literal("ok"),
  service: z.string(),
  environment: z.string(),
  uptimeSeconds: z.number(),
  timestamp: z.string(),
});

export function ApiStatus() {
  const { data, error, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: ["api-health"],
    queryFn: ({ signal }) => apiGet("/health", healthSchema, signal),
  });

  let dotClass = "bg-ink-300 animate-pulse";
  let title = "Checking API connection…";
  let detail: string | null = null;

  if (data) {
    dotClass = "bg-success-600";
    title = "API online";
    detail = `Environment: ${data.environment} · up ${data.uptimeSeconds}s`;
  } else if (isError) {
    dotClass = "bg-danger-600";
    title = "Cannot reach the API";
    detail = error instanceof Error ? error.message : "Unknown error";
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-card p-5 shadow-card"
    >
      <div className="flex items-start gap-3">
        <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dotClass}`} aria-hidden="true" />
        <div>
          <p className="font-semibold">{title}</p>
          {detail ? <p className="text-sm text-ink-500">{detail}</p> : null}
        </div>
      </div>

      {isError ? (
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className={buttonClasses("secondary")}
        >
          Try again
        </button>
      ) : null}
      {isPending && !isError ? <span className="sr-only">Loading</span> : null}
    </div>
  );
}