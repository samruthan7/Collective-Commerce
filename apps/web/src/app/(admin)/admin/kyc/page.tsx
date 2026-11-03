import type { Metadata } from "next";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/buttonStyles";
import { requireAdmin } from "@/lib/auth";
import { isValidGstin, panFromGstin } from "@/lib/gstin";
import { docTypeLabel, listKycSellers } from "@/lib/kyc";

export const metadata: Metadata = { title: "Seller KYC" };
export const dynamic = "force-dynamic";

export default async function AdminKycPage() {
  await requireAdmin("/admin/kyc");
  const sellers = await listKycSellers();

  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Seller KYC</h1>
        <p className="mt-3 text-ink-500">
          Review each seller&apos;s documents and GSTIN, then approve or reject them on the sellers
          page. Document links expire after 5 minutes. Reload the page for fresh links.
        </p>
        <Link href="/admin/sellers" className={`${buttonClasses("secondary")} mt-4 inline-block`}>
          Open sellers page
        </Link>
      </header>

      {sellers.length === 0 ? (
        <p className="text-sm text-ink-500">No seller applications yet.</p>
      ) : (
        <ul className="max-w-2xl space-y-4">
          {sellers.map((s) => (
            <li key={s.userId} className="rounded-2xl border border-line bg-card p-5 shadow-card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{s.businessName}</p>
                  <p className="text-sm text-ink-500">
                    {s.city} · {s.phone}
                  </p>
                </div>
                <span className="rounded-full bg-accent-50 px-2.5 py-0.5 text-xs font-semibold capitalize text-accent-700">
                  {s.status}
                </span>
              </div>

              <p className="mt-3 text-sm">
                GSTIN{" "}
                {s.gstin ? (
                  <>
                    <span className="font-mono">{s.gstin}</span> ·{" "}
                    {isValidGstin(s.gstin) ? (
                      <span className="font-medium text-success-600">
                        check digit valid (PAN {panFromGstin(s.gstin)})
                      </span>
                    ) : (
                      <span className="font-medium text-red-600">check digit invalid</span>
                    )}
                  </>
                ) : (
                  <span className="text-ink-500">not provided</span>
                )}
              </p>

              <div className="mt-3">
                <p className="text-sm font-medium">Documents ({s.docs.length})</p>
                {s.docs.length === 0 ? (
                  <p className="text-sm text-ink-500">None uploaded.</p>
                ) : (
                  <ul className="mt-1 space-y-1 text-sm">
                    {s.docs.map((d) => (
                      <li key={d.id}>
                        {d.url ? (
                          <a
                            href={d.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-accent-700 hover:underline"
                          >
                            {docTypeLabel(d.docType)}
                          </a>
                        ) : (
                          <span>{docTypeLabel(d.docType)}</span>
                        )}
                        <span className="text-ink-500"> · {d.originalName}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
