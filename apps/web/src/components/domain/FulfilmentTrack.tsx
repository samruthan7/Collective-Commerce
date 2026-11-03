import { FULFILMENT_STEPS, stepIndex, type Fulfilment } from "@/lib/orderStatus";

export function FulfilmentTrack({ status }: { status: Fulfilment }) {
  const current = stepIndex(status);
  return (
    <ol className="flex items-center gap-2" aria-label={`Order status: ${status}`}>
      {FULFILMENT_STEPS.map((step, i) => {
        const done = i <= current;
        return (
          <li key={step.key} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={`h-2.5 w-2.5 rounded-full ${done ? "bg-accent-500" : "bg-line"}`}
            />
            <span className={`text-xs ${done ? "font-semibold text-ink-700" : "text-ink-500"}`}>
              {step.label}
            </span>
            {i < FULFILMENT_STEPS.length - 1 ? (
              <span
                aria-hidden="true"
                className={`h-px w-6 ${i < current ? "bg-accent-500" : "bg-line"}`}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
