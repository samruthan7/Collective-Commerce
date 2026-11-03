"use server";

import { redirect } from "next/navigation";
import { safeRedirectPath, type AuthFormState } from "@/lib/authForm";
import { loginSchema, signupSchema } from "@/lib/authSchemas";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function loginAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details.", notice: null };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    // One message for every failure, so attackers cannot tell which part was wrong.
    return { error: "Incorrect email or password.", notice: null };
  }

  redirect(safeRedirectPath(formData.get("next")));
}

export async function signupAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signupSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details.", notice: null };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.fullName } },
  });
  if (error) {
    // Server-side only: the visitor still sees the generic message.
    console.error("signup failed:", {
      code: error.code,
      status: error.status,
      message: error.message,
    });
    return {
      error: "We could not create your account. Try another email or a stronger password.",
      notice: null,
    };
  }

  // With email confirmation switched on there is no session yet.
  if (!data.session) {
    return { error: null, notice: "Check your email to confirm your account, then log in." };
  }

  redirect(safeRedirectPath(formData.get("next")));
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
