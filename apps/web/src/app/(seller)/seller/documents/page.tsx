import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/ui/ActionForm";
import { buttonClasses } from "@/components/ui/buttonStyles";
import { isValidGstin } from "@/lib/gstin";
import { DOC_TYPES, docTypeLabel, listMyDocuments } from "@/lib/kyc";
import { uploadDocumentAction } from "@/lib/kycActions";
import { requireUser } from "@/lib/requireUser";

export const metadata: Metadata = { title: "Verification documents" };
export const dynamic = "force-dynamic";

const fieldClasses =
  "w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent-500";

export default async function SellerDocumentsPage() {
  const { supabase, user } = await requireUser();
  const { data: seller } = await supabase
    .from("seller_profiles")
    .select("status, gstin")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!seller) {
    return (
      <div className="max-w-2xl space-y-4">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Verification documents
        </h1>
        <p className="text-ink-500">Submit your seller application first, then upload documents.</p>
        <Link href="/seller" className={buttonClasses("primary")}>
          Go to seller application
        </Link>
      </div>
    );
  }

  const docs = await listMyDocuments();
  const gstin = (seller.gstin as string | null) ?? null;

  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Verification documents
        </h1>
        <p className="mt-3 text-ink-500">
          Upload your GST certificate, business proof and owner ID. Files are private: only you and
          our verification team can open them. PDF, JPG or PNG, up to 5 MB each.
        </p>
      </header>

      <section className="max-w-2xl rounded-2xl border border-line bg-card p-5 shadow-card">
        <p className="text-sm text-ink-500">Application status</p>
        <p className="font-semibold capitalize">{seller.status as string}</p>
        {gstin ? (
          <p className="mt-3 text-sm">
            GSTIN <span className="font-mono">{gstin}</span>:{" "}
            {isValidGstin(gstin) ? (
              <span className="font-medium text-success-600">format and check digit valid</span>
            ) : (
              <span className="font-medium text-red-600">check digit does not match</span>
            )}
          </p>
        ) : (
          <p className="mt-3 text-sm text-ink-500">No GSTIN on your application.</p>
        )}
      </section>

      <section className="max-w-2xl rounded-2xl border border-line bg-card p-5 shadow-card">
        <h2 className="font-semibold">Upload a document</h2>
        <ActionForm action={uploadDocumentAction} className="mt-4 space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-ink-500">Document type</span>
            <select name="docType" defaultValue="gst_certificate" className={fieldClasses}>
              {DOC_TYPES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-ink-500">File</span>
            <input
              type="file"
              name="file"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              required
              className={fieldClasses}
            />
          </label>
          <button type="submit" className={buttonClasses("primary")}>
            Upload
          </button>
        </ActionForm>
      </section>

      <section className="max-w-2xl space-y-3">
        <h2 className="font-semibold">Your documents ({docs.length})</h2>
        {docs.length === 0 ? (
          <p className="text-sm text-ink-500">Nothing uploaded yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {docs.map((d) => (
              <li key={d.id} className="rounded-xl border border-line bg-card px-4 py-3">
                <span className="font-medium">{docTypeLabel(d.docType)}</span>
                <span className="text-ink-500">
                  {" "}
                  · {d.originalName} · {new Date(d.createdAt).toLocaleDateString("en-IN")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
