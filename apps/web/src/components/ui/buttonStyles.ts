const base =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const variants = {
  primary: "bg-accent-600 text-white hover:bg-accent-700",
  secondary: "border border-line bg-card text-ink-900 hover:bg-accent-50",
  ghost: "text-ink-700 hover:bg-accent-50",
} as const;

export type ButtonVariant = keyof typeof variants;

/** Class names for buttons and button-looking links, so they look identical everywhere. */
export function buttonClasses(variant: ButtonVariant = "primary"): string {
  return `${base} ${variants[variant]}`;
}