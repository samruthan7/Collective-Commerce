import type { Metadata } from "next";
import { ActionForm } from "@/components/ui/ActionForm";
import { requireAdmin } from "@/lib/requireAdmin";
import { setSellerStatusAction } from "@/lib/sellerActions";

export const metadata: Metadata = { title: "Sellers" };
export const dynamic = "force-dynamic";

function StatusButton({
  userId,
  status,
  label,
}: {
  userId: string;
  status: string;
  label: string;
}) {
  return (
    <ActionForm action={setSellerStatusAction} className="inline">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="status" value={status} />
      <button type="submit" className="text-xs font-semibold text-accent-600 hover:underline">
        {label}
      </button>
    </ActionForm>
  );
}

export default async function AdminSellersPage() {
  const supabase = await requireAdmin();
  const { data, error } = await supabase
    .from("seller_profiles")
    .select("user_id, business_name, gstin, city, phone, status, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error("Could not load sellers.");

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Sellers</h1>
      {(data ?? []).length === 0 ? (
        <p className="text-ink-500">No seller applications yet.</p>
      ) : null}
      <ul className="space-y-3">
        {(data ?? []).map((s) => (
          <li key={s.user_id} className="rounded-2xl border border-line bg-card p-5 shadow-card">
            <p className="font-semibold">
              {s.business_name}{" "}
              <span className="text-xs font-normal text-ink-300">({s.status})</span>
            </p>
            <p className="text-sm text-ink-500">
              {s.city} · {s.phone} · GSTIN: {s.gstin ?? "not given"}
            </p>
            <div className="mt-2 flex gap-4">
              <StatusButton userId={s.user_id} status="verified" label="Verify" />
              <StatusButton userId={s.user_id} status="rejected" label="Reject" />
              <StatusButton userId={s.user_id} status="suspended" label="Suspend" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
