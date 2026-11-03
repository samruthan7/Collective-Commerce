"use server";

import { redirect } from "next/navigation";
import { z } from "@cc/shared";
import type { EnrollState, VerifyState } from "@/lib/mfaTypes";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const codeSchema = z.string().regex(/^[0-9]{6}$/);

function safeNext(raw: unknown): string {
  return typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/admin";
}

export async function startEnrollAction(
  _prev: EnrollState,
  _formData: FormData,
): Promise<EnrollState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const empty = { factorId: null, qr: null, secret: null };
  if (!user) return { ...empty, error: "Please log in again." };

  const { data: factors } = await supabase.auth.mfa.listFactors();
  for (const f of factors?.all ?? []) {
    if (f.factor_type !== "totp") continue;
    if (f.status === "verified") {
      return { ...empty, error: "Two-step login is already turned on." };
    }
    // Remove half-finished setups so enrolment can start clean.
    await supabase.auth.mfa.unenroll({ factorId: f.id });
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: `Authenticator ${Date.now()}`,
  });
  if (error || !data) {
    return {
      ...empty,
      error: "Could not start setup. Check that multi-factor login is enabled in Supabase.",
    };
  }
  return { error: null, factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret };
}

export async function verifyEnrollAction(
  _prev: VerifyState,
  formData: FormData,
): Promise<VerifyState> {
  const factorId = z.string().uuid().safeParse(formData.get("factorId"));
  const code = codeSchema.safeParse(formData.get("code"));
  if (!factorId.success || !code.success) return { error: "Enter the 6-digit code." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId: factorId.data,
    code: code.data,
  });
  if (error) return { error: "That code did not work. Check your phone's clock and try again." };
  redirect("/account/security");
}

export async function verifyLoginAction(
  _prev: VerifyState,
  formData: FormData,
): Promise<VerifyState> {
  const code = codeSchema.safeParse(formData.get("code"));
  if (!code.success) return { error: "Enter the 6-digit code." };
  const next = safeNext(formData.get("next"));

  const supabase = await createSupabaseServerClient();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const factor = (factors?.totp ?? []).find((f) => f.status === "verified");
  if (!factor) return { error: "No authenticator is set up for this account." };

  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId: factor.id,
    code: code.data,
  });
  if (error) return { error: "That code did not work. Try the newest code." };
  redirect(next);
}
