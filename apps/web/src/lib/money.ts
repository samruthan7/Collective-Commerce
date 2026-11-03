/** Formats whole paise as Indian rupees, for example 1499900 becomes "₹14,999". */
export function formatPaiseAsINR(paise: number): string {
  if (!Number.isInteger(paise)) {
    throw new RangeError("paise must be a whole number");
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: paise % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(paise / 100);
}
