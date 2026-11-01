import Link from "next/link";
import { Logo } from "./Logo";

export interface NavLink {
  href: string;
  label: string;
}

interface SiteHeaderProps {
  /** Shown as a small badge for the seller and admin areas. */
  areaLabel?: string;
  links: NavLink[];
}

export function SiteHeader({ areaLabel, links }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo />
          <span className="font-display text-base font-semibold tracking-tight">
            Collective Commerce
          </span>
          {areaLabel ? (
            <span className="rounded-full bg-accent-50 px-2.5 py-0.5 text-xs font-semibold text-accent-700">
              {areaLabel}
            </span>
          ) : null}
        </Link>

        <nav aria-label="Main">
          <ul className="flex items-center gap-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-accent-50 hover:text-accent-700"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}