import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { z } from "@cc/shared";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const profileSchema = z.object({
  full_name: z.string().nullable(),
  role: z.enum(["buyer", "admin"]),
});

export type Profile = z.infer<typeof profileSchema>;

/**
 * The signed-in user for this request, or null. getUser() asks Supabase to verify
 * the session, so a forged cookie is not trusted. Cached per request.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  return error ? null : data.user;
});

/** The user's own profile row (row level security allows only their own). */
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;

  const parsed = profileSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}

/** Sends visitors who are not logged in to /login, then back to `nextPath`. */
export async function requireUser(nextPath: string) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return user;
}

/** Only admins pass. Everyone else sees the 404 page. */
/** Only admins pass, and only with two-step login. Everyone else sees the 404 page. */
export async function requireAdmin(nextPath: string) {
  const user = await requireUser(nextPath);
  const profile = await getProfile(user.id);
  if (profile?.role !== "admin") {
    notFound();
  }
  // Local development only. Ignored in production.
  if (process.env.NODE_ENV !== "production" && process.env.ADMIN_MFA_OPTIONAL === "true") {
    return user;
  }
  const supabase = await createSupabaseServerClient();
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  // No authenticator yet: send the admin to set one up.
  if (!aal || aal.nextLevel === "aal1") redirect("/account/security");
  // Authenticator set up but not entered this session.
  if (aal.currentLevel !== "aal2") redirect(`/mfa?next=${encodeURIComponent(nextPath)}`);
  return user;
}
