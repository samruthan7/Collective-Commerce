import type { Metadata } from "next";
import { ActionForm } from "@/components/ui/ActionForm";
import { buttonClasses } from "@/components/ui/buttonStyles";
import { resolveReportAction } from "@/lib/adminReportActions";
import { listReports } from "@/lib/adminReports";
import { requireAdmin } from "@/lib/auth";
import { reasonLabel } from "@/lib/reportReasons";

export const metadata: Metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  await requireAdmin("/admin/reports");
  const reports = await listReports();
  const open = reports.filter((r) => r.status === "open");
  const resolved = reports.filter((r) => r.status !== "open");

  return (
    <div className="space-y-8">
      <header className="max-w-2xl">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Reports</h1>
        <p className="mt-3 text-ink-500">Problems buyers have reported with their orders.</p>
      </header>

      <section aria-labelledby="open-h" className="space-y-4">
        <h2 id="open-h" className="font-semibold">
          Open ({open.length})
        </h2>
        {open.length === 0 ? (
          <p className="text-sm text-ink-500">All caught up. No open reports.</p>
        ) : (
          <ul className="max-w-2xl space-y-4">
            {open.map((r) => (
              <li key={r.id} className="rounded-2xl border border-line bg-card p-5 shadow-card">
                <p className="font-semibold">{reasonLabel(r.reason)}</p>
                <p className="mt-1 text-sm text-ink-500">
                  {r.product_name} · seller {r.seller_name}
                </p>
                <p className="mt-1 text-sm text-ink-500">
                  Reported by {r.buyer_name} ({r.buyer_email}) on{" "}
                  {new Date(r.created_at).toLocaleDateString("en-IN")}
                </p>
                {r.details ? <p className="mt-3 text-sm">{r.details}</p> : null}
                <ActionForm action={resolveReportAction} className="mt-4">
                  <input type="hidden" name="reportId" value={r.id} />
                  <button type="submit" className={buttonClasses("primary")}>
                    Mark resolved
                  </button>
                </ActionForm>
              </li>
            ))}
          </ul>
        )}
      </section>

      {resolved.length > 0 ? (
        <section aria-labelledby="done-h" className="space-y-3">
          <h2 id="done-h" className="font-semibold">
            Resolved ({resolved.length})
          </h2>
          <ul className="max-w-2xl space-y-2 text-sm text-ink-500">
            {resolved.map((r) => (
              <li key={r.id}>
                {reasonLabel(r.reason)} · {r.product_name} · {r.seller_name}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
