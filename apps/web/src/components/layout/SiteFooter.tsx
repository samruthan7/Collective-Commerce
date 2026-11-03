import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-card">
      <div className="mx-auto w-full max-w-6xl space-y-3 px-4 py-8 text-sm text-ink-500 sm:px-6">
        <p>
          Collective Commerce is a marketplace. We never sell products ourselves: every purchase is
          between a buyer and a verified seller.
        </p>
        <p>Prices, names and figures shown during development are illustrative sample data.</p>
        <nav aria-label="Legal">
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            <li>
              <Link href="/privacy" className="font-medium text-ink-700 hover:text-accent-700">
                Privacy policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="font-medium text-ink-700 hover:text-accent-700">
                Terms of service
              </Link>
            </li>
            <li>
              <Link href="/grievance" className="font-medium text-ink-700 hover:text-accent-700">
                Grievance officer
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
