import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MfaVerify } from "@/components/domain/MfaVerify";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Enter your code" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function MfaPage({ searchParams }: { searchParams: SearchParams }) {
  await requireUser("/mfa");
  const params = await searchParams;
  const raw = Array.isArray(params.next) ? params.next[0] : params.next;
  const next = raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/admin";

  const supabase = await createSupabaseServerClient();
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel === "aal2") redirect(next);
  if (aal?.nextLevel !== "aal2") redirect("/account/security");

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Enter your code</h1>
      <p className="text-ink-500">
        Open your authenticator app and enter the current 6-digit code.
      </p>
      <MfaVerify next={next} />
    </div>
  );
}
