import { z } from "zod";

/**
 * Money convention (ADR-005)
 * --------------------------
 * - PostgreSQL stores every amount as BIGINT paise.
 * - In JavaScript an amount is a whole `number` of paise (a safe integer).
 * - JSON carries integers; API field names end in `Paise`.
 * - Floating-point rupees are NEVER used for calculation or storage.
 */
export type Paise = number;

/** True when the value is a whole number of paise that JavaScript can represent exactly. */
export function isPaise(value: unknown): value is Paise {
  return typeof value === "number" && Number.isSafeInteger(value);
}

/** Throws a RangeError unless the value is a safe-integer number of paise. */
export function assertPaise(value: unknown, label = "amount"): asserts value is Paise {
  if (!isPaise(value)) {
    throw new RangeError(
      `${label} must be a whole number of paise (safe integer), received: ${String(value)}`,
    );
  }
}

/**
 * Converts a value coming from outside the type system into paise.
 * Main use: the `pg` driver returns BIGINT columns as strings.
 * Rejects decimals, non-numeric text and numbers beyond the safe-integer range.
 */
export function parsePaise(value: string | number | bigint, label = "amount"): Paise {
  if (typeof value === "number") {
    assertPaise(value, label);
    return value === 0 ? 0 : value;
  }

  if (typeof value === "bigint") {
    if (
      value > BigInt(Number.MAX_SAFE_INTEGER) ||
      value < BigInt(Number.MIN_SAFE_INTEGER)
    ) {
      throw new RangeError(`${label} is outside the safe integer range: ${value.toString()}`);
    }
    return Number(value);
  }

  if (!/^-?\d+$/.test(value)) {
    throw new RangeError(`${label} must be an integer string of paise, received: "${value}"`);
  }
  const parsed = Number(value);
  assertPaise(parsed, label);
  return parsed === 0 ? 0 : parsed;
}

const RUPEE_PATTERN = /^(-)?(\d{1,13})(?:\.(\d{1,2}))?$/;

/**
 * Converts a rupee amount typed by a person (a string such as "74,500.50" or "₹7,45,000")
 * into paise using integer arithmetic only. Allows at most 2 decimal places.
 */
export function rupeesToPaise(input: string): Paise {
  const cleaned = input.replace(/[₹,\s]/g, "");
  const match = RUPEE_PATTERN.exec(cleaned);
  const whole = match?.[2];
  if (match === null || whole === undefined) {
    throw new RangeError(`Invalid rupee amount: "${input}"`);
  }

  const negative = match[1] === "-";
  const fraction = (match[3] ?? "").padEnd(2, "0");
  const paise = Number(whole) * 100 + Number(fraction);

  if (paise === 0) return 0;
  return negative ? -paise : paise;
}

/** Inserts commas the Indian way: last 3 digits, then groups of 2 (7,45,000). */
function groupIndianDigits(digits: string): string {
  if (digits.length <= 3) return digits;
  const lastThree = digits.slice(-3);
  const rest = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${rest},${lastThree}`;
}

export interface FormatINROptions {
  /**
   * "auto"   (default): show paise only when they are not zero (₹74,500 or ₹74,500.50)
   * "always": always show two decimals (₹74,500.00)
   */
  fractionDigits?: "auto" | "always";
}

/**
 * Formats paise as rupees with the rupee sign and Indian digit grouping.
 * Implemented by hand (not Intl) so output is identical on every browser and server.
 */
export function formatINR(paise: Paise, options: FormatINROptions = {}): string {
  assertPaise(paise, "paise");

  const negative = paise < 0;
  const absolute = Math.abs(paise);
  const rupees = Math.floor(absolute / 100);
  const remainder = absolute % 100;

  const showFraction = options.fractionDigits === "always" || remainder !== 0;
  const fraction = showFraction ? `.${String(remainder).padStart(2, "0")}` : "";

  return `${negative ? "-" : ""}₹${groupIndianDigits(String(rupees))}${fraction}`;
}

/** Zod: a non-negative whole number of paise (prices, charges, discounts). */
export const paiseSchema = z
  .number()
  .int("Amount must be a whole number of paise")
  .min(0, "Amount cannot be negative")
  .refine(Number.isSafeInteger, "Amount is too large");

/** Zod: a strictly positive whole number of paise (a base price must be above zero). */
export const positivePaiseSchema = z
  .number()
  .int("Amount must be a whole number of paise")
  .min(1, "Amount must be greater than zero")
  .refine(Number.isSafeInteger, "Amount is too large");