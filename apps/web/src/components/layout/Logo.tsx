/** The brand mark: three rising tier segments. */
export function Logo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="8" className="fill-accent-600" />
      <rect x="6" y="17" width="5" height="9" rx="1.5" fill="#fff" opacity="0.55" />
      <rect x="13.5" y="12" width="5" height="14" rx="1.5" fill="#fff" opacity="0.8" />
      <rect x="21" y="6" width="5" height="20" rx="1.5" fill="#fff" />
    </svg>
  );
}
