import type { ReactNode } from "react";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader, type NavLink } from "./SiteHeader";

interface AreaShellProps {
  areaLabel?: string;
  /** Optional and ignored: the header builds one navigation for everyone. */
  links?: NavLink[];
  children: ReactNode;
}

export function AreaShell({ areaLabel, children }: AreaShellProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader areaLabel={areaLabel} />
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
