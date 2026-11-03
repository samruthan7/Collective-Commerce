import type { Metadata } from "next";
import { MfaEnroll } from "@/components/domain/MfaEnroll";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Account security" };
export const dynamic = "force-dynamic";

export default async function SecurityPage() {
  await requireUser("/account/security");
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.mfa.listFactors();
  const enabled = (data?.totp ?? []).some((f) => f.status === "verified");

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Account security</h1>
      <p className="text-ink-500">
        Two-step login asks for a code from your phone after your password. Admin accounts must use
        it.
      </p>
      {enabled ? (
        <p className="rounded-2xl border border-line bg-card p-5 font-medium text-success-600 shadow-card">
          Two-step login is on ✓
        </p>
      ) : (
        <MfaEnroll />
      )}
    </div>
  );
}
