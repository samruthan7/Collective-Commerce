import { z } from "@cc/shared";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tier } from "@/lib/tiers";

export interface Offer {
  id: string;
  sellerName: string;
  sellerCity: string;
  deliveryDays: number;
  warrantyMonths: number;
  notes: string | null;
  tiers: Tier[];
}

const offerSchema = z.object({
  id: z.string(),
  seller_id: z.string(),
  delivery_days: z.number().int(),
  warranty_months: z.number().int(),
  notes: z.string().nullable(),
  quotation_tiers: z.array(
    z.object({ min_members: z.number().int(), unit_price_paise: z.number() }),
  ),
});

export async function listOffers(groupId: string): Promise<Offer[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("quotations")
    .select(
      "id, seller_id, delivery_days, warranty_months, notes, quotation_tiers(min_members, unit_price_paise)",
    )
    .eq("group_id", groupId)
    .eq("status", "submitted");
  if (error) throw new Error("Could not load offers.");
  const rows = z.array(offerSchema).parse(data);
  if (rows.length === 0) return [];

  const { data: sellers } = await supabase
    .from("sellers_public")
    .select("user_id, business_name, city")
    .in(
      "user_id",
      rows.map((r) => r.seller_id),
    );
  const byId = new Map((sellers ?? []).map((s) => [s.user_id as string, s]));

  return rows.map((r) => ({
    id: r.id,
    sellerName: byId.get(r.seller_id)?.business_name ?? "Verified seller",
    sellerCity: byId.get(r.seller_id)?.city ?? "",
    deliveryDays: r.delivery_days,
    warrantyMonths: r.warranty_months,
    notes: r.notes,
    tiers: r.quotation_tiers
      .map((t) => ({ minMembers: t.min_members, unitPricePaise: t.unit_price_paise }))
      .sort((a, b) => a.minMembers - b.minMembers),
  }));
}

export async function getMySelection(groupId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("buyer_selections")
    .select("quotation_id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();
  return data?.quotation_id ?? null;
}
