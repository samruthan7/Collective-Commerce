import { z } from "@cc/shared";
import { requireUser } from "@/lib/requireUser";
import { effectiveTier } from "@/lib/tiers";

export interface MyGroupRow {
  groupId: string;
  status: string;
  productName: string;
  brand: string;
  variantLabel: string;
  memberCount: number;
  minMembers: number;
  joinDeadline: string;
  chosen: { sellerName: string; unitPricePaise: number | null; deliveryDays: number } | null;
}

const membershipSchema = z.array(
  z.object({
    group: z.object({
      id: z.string(),
      status: z.string(),
      member_count: z.number().int(),
      min_members: z.number().int(),
      join_deadline_at: z.string(),
      variant: z.object({
        label: z.string(),
        product: z.object({ name: z.string(), brand: z.string() }),
      }),
    }),
  }),
);

export async function listMyGroups(): Promise<MyGroupRow[]> {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("group_members")
    .select(
      "group:groups(id, status, member_count, min_members, join_deadline_at, variant:product_variants(label, product:products(name, brand)))",
    )
    .eq("user_id", user.id)
    .is("left_at", null)
    .order("joined_at", { ascending: false });
  if (error) throw new Error("Could not load your groups.");
  const memberships = membershipSchema.parse(data);

  const { data: selections } = await supabase
    .from("buyer_selections")
    .select("group_id, quotation_id")
    .eq("user_id", user.id);
  const selectionByGroup = new Map(
    (selections ?? []).map((s) => [s.group_id as string, s.quotation_id as string]),
  );

  const quotationIds = [...selectionByGroup.values()];
  const quoteById = new Map<
    string,
    {
      sellerId: string;
      deliveryDays: number;
      tiers: { minMembers: number; unitPricePaise: number }[];
    }
  >();
  const sellerNames = new Map<string, string>();

  if (quotationIds.length > 0) {
    const { data: quotes } = await supabase
      .from("quotations")
      .select("id, seller_id, delivery_days, quotation_tiers(min_members, unit_price_paise)")
      .in("id", quotationIds);
    for (const q of quotes ?? []) {
      quoteById.set(q.id as string, {
        sellerId: q.seller_id as string,
        deliveryDays: q.delivery_days as number,
        tiers: (q.quotation_tiers as { min_members: number; unit_price_paise: number }[]).map(
          (t) => ({
            minMembers: t.min_members,
            unitPricePaise: Number(t.unit_price_paise),
          }),
        ),
      });
    }
    const sellerIds = [...new Set([...quoteById.values()].map((q) => q.sellerId))];
    if (sellerIds.length > 0) {
      const { data: sellers } = await supabase
        .from("sellers_public")
        .select("user_id, business_name")
        .in("user_id", sellerIds);
      for (const s of sellers ?? [])
        sellerNames.set(s.user_id as string, s.business_name as string);
    }
  }

  return memberships.map(({ group }) => {
    const quoteId = selectionByGroup.get(group.id);
    const quote = quoteId ? quoteById.get(quoteId) : undefined;
    return {
      groupId: group.id,
      status: group.status,
      productName: group.variant.product.name,
      brand: group.variant.product.brand,
      variantLabel: group.variant.label,
      memberCount: group.member_count,
      minMembers: group.min_members,
      joinDeadline: group.join_deadline_at,
      chosen: quote
        ? {
            sellerName: sellerNames.get(quote.sellerId) ?? "Verified seller",
            unitPricePaise: effectiveTier(quote.tiers, group.member_count)?.unitPricePaise ?? null,
            deliveryDays: quote.deliveryDays,
          }
        : null,
    };
  });
}
