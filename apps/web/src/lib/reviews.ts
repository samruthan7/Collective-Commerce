import { requireUser } from "@/lib/requireUser";

/** Group ids the signed-in buyer has already reviewed. */
export async function listMyReviewedGroupIds(): Promise<Set<string>> {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from("reviews").select("group_id").eq("user_id", user.id);
  return new Set((data ?? []).map((r) => r.group_id as string));
}
