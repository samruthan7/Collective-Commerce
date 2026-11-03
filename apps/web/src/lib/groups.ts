import { z } from "@cc/shared";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const groupStatusSchema = z.enum([
  "open",
  "full",
  "bidding",
  "locked",
  "completed",
  "cancelled",
  "expired_no_offers",
]);
export type GroupStatus = z.infer<typeof groupStatusSchema>;

export const STATUS_LABELS: Record<GroupStatus, string> = {
  open: "Open to join",
  full: "Full",
  bidding: "Sellers are bidding",
  locked: "Choose an offer",
  completed: "Completed",
  cancelled: "Cancelled",
  expired_no_offers: "Closed (no offers)",
};

const groupSchema = z.object({
  id: z.string(),
  status: groupStatusSchema,
  region_id: z.string(),
  min_members: z.number().int(),
  max_members: z.number().int().nullable(),
  member_count: z.number().int(),
  join_deadline_at: z.string(),
  bidding_deadline_at: z.string(),
  selection_deadline_at: z.string(),
  region: z.object({ name: z.string() }),
  variant: z.object({
    id: z.string(),
    label: z.string(),
    product: z.object({ name: z.string(), brand: z.string() }),
  }),
});
export type Group = z.infer<typeof groupSchema>;

const memberSchema = z.object({
  display_name: z.string(),
  commitment: z.enum(["interested", "committed"]),
  joined_at: z.string(),
});
export type PublicMember = z.infer<typeof memberSchema>;

const SELECT =
  "id, status, region_id, min_members, max_members, member_count, join_deadline_at, bidding_deadline_at, selection_deadline_at, region:regions(name), variant:product_variants(id, label, product:products(name, brand))";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function listActiveGroups(): Promise<Group[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("groups")
    .select(SELECT)
    .in("status", ["open", "full", "bidding", "locked"])
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error("Could not load groups.");
  return z.array(groupSchema).parse(data);
}

export async function getGroup(id: string): Promise<Group | null> {
  if (!UUID.test(id)) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("groups").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw new Error("Could not load the group.");
  return data ? groupSchema.parse(data) : null;
}

export async function listGroupMembers(id: string): Promise<PublicMember[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("group_members_public")
    .select("display_name, commitment, joined_at")
    .eq("group_id", id)
    .order("joined_at");
  if (error) throw new Error("Could not load members.");
  return z.array(memberSchema).parse(data);
}

export async function getMyMembership(id: string): Promise<{ commitment: string } | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("group_members")
    .select("commitment")
    .eq("group_id", id)
    .eq("user_id", user.id)
    .is("left_at", null)
    .maybeSingle();
  return data ?? null;
}
