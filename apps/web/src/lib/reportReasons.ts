export const REPORT_REASONS = [
  { value: "not_delivered", label: "Item not delivered" },
  { value: "wrong_item", label: "Wrong or damaged item" },
  { value: "price_changed", label: "Seller changed the price" },
  { value: "seller_unresponsive", label: "Seller is not responding" },
  { value: "other", label: "Something else" },
] as const;

export function reasonLabel(value: string): string {
  return REPORT_REASONS.find((r) => r.value === value)?.label ?? value;
}
