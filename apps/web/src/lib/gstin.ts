const CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const SHAPE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export function normaliseGstin(value: string): string {
  return value.trim().toUpperCase();
}

/** Format, state code (01 to 38) and check digit. It cannot prove the GSTIN is registered. */
export function isValidGstin(input: string): boolean {
  const g = normaliseGstin(input);
  if (!SHAPE.test(g)) return false;
  const state = Number(g.slice(0, 2));
  if (state < 1 || state > 38) return false;

  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const value = CHARS.indexOf(g.charAt(i)) * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(value / 36) + (value % 36);
  }
  return CHARS.charAt((36 - (sum % 36)) % 36) === g.charAt(14);
}

/** The business PAN is characters 3 to 12 of a GSTIN. */
export function panFromGstin(input: string): string {
  return normaliseGstin(input).slice(2, 12);
}
