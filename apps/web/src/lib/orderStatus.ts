export type Fulfilment = "confirmed" | "shipped" | "delivered";

export const FULFILMENT_STEPS: { key: Fulfilment; label: string }[] = [
  { key: "confirmed", label: "Confirmed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

/** Position of a status in the track: 0, 1 or 2. */
export function stepIndex(status: Fulfilment): number {
  return FULFILMENT_STEPS.findIndex((s) => s.key === status);
}

export function fulfilmentLabel(status: Fulfilment): string {
  return FULFILMENT_STEPS[stepIndex(status)]?.label ?? status;
}
