import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Unread alerts for the signed-in user (row level security limits this to their own). */
export async function getUnreadCount(): Promise<number> {
  try {
    const supabase = await createSupabaseServerClient();
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .is("read_at", null);
    return error ? 0 : (count ?? 0);
  } catch {
    return 0;
  }
}
