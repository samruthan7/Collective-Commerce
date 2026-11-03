import { z } from "@cc/shared";
import { listActiveGroups, type Group } from "@/lib/groups";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const sellerSchema = z.object({
  business_name: z.string(),
  city: z.string(),
  status: z.enum(["pending", "verified", "rejected", "suspended"]),
});
export type MySeller = z.infer<typeof sellerSchema>;

export async function getMySeller(userId: string): Promise<MySeller | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("seller_profiles")
    .select("business_name, city, status")
    .eq("user_id", userId)
    .maybeSingle();
  return data ? sellerSchema.parse(data) : null;
}

export async function listBiddingGroups(): Promise<Group[]> {
  const groups = await listActiveGroups();
  return groups.filter((g) => g.status === "bidding");
}

const myQuoteSchema = z.object({
  status: z.enum(["submitted", "withdrawn"]),
  delivery_days: z.number().int(),
  warranty_months: z.number().int(),
  notes: z.string().nullable(),
  quotation_tiers: z.array(
    z.object({ min_members: z.number().int(), unit_price_paise: z.number() }),
  ),
});
export type MyQuote = z.infer<typeof myQuoteSchema>;

export async function getMyQuotation(groupId: string, userId: string): Promise<MyQuote | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("quotations")
    .select(
      "status, delivery_days, warranty_months, notes, quotation_tiers(min_members, unit_price_paise)",
    )
    .eq("group_id", groupId)
    .eq("seller_id", userId)
    .maybeSingle();
  if (!data) return null;
  const quote = myQuoteSchema.parse(data);
  quote.quotation_tiers.sort((a, b) => a.min_members - b.min_members);
  return quote;
}
