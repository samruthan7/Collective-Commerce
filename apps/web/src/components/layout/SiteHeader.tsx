import Link from "next/link";
import { getNavState, type NavLink } from "@/lib/nav";
import { AuthMenu } from "./AuthMenu";
import { Logo } from "./Logo";

export type { NavLink };

interface SiteHeaderProps {
  /** Shown as a small badge for the seller and admin areas. */
  areaLabel?: string;
  /** Kept so existing layouts still compile. Navigation is now built from who is signed in. */
  links?: NavLink[];
}

const linkClasses =
  "rounded-lg px-3 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-accent-50 hover:text-accent-700";

export async function SiteHeader({ areaLabel }: SiteHeaderProps) {
  const { links, signedIn, unread } = await getNavState();

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

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <nav aria-label="Main">
            <ul className="flex flex-wrap items-center gap-1">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClasses}>
                    {link.label}
                  </Link>
                </li>
              ))}
              {signedIn ? (
                <li>
                  <Link
                    href="/notifications"
                    className={linkClasses}
                    aria-label={unread > 0 ? `Alerts, ${unread} unread` : "Alerts"}
                  >
                    Alerts
                    {unread > 0 ? (
                      <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-accent-500 px-1.5 text-xs font-semibold text-white">
                        {unread > 99 ? "99+" : unread}
                      </span>
                    ) : null}
                  </Link>
                </li>
              ) : null}
            </ul>
          </nav>
          <AuthMenu />
        </div>
      </div>
    </header>
  );
}
