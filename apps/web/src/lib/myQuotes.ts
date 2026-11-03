import { z } from "@cc/shared";
import { requireUser } from "@/lib/requireUser";
import { effectiveTier } from "@/lib/tiers";

export interface MyQuoteRow {
  groupId: string;
  groupStatus: string;
  productName: string;
  variantLabel: string;
  memberCount: number;
  quoteStatus: string;
  currentPricePaise: number | null;
  tiers: { minMembers: number; unitPricePaise: number }[];
}

const schema = z.array(
  z.object({
    status: z.string(),
    group: z.object({
      id: z.string(),
      status: z.string(),
      member_count: z.number().int(),
      variant: z.object({ label: z.string(), product: z.object({ name: z.string() }) }),
    }),
    quotation_tiers: z.array(
      z.object({ min_members: z.number().int(), unit_price_paise: z.number() }),
    ),
  }),
);

export async function listMyQuotes(): Promise<MyQuoteRow[]> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("quotations")
    .select(
      "status, group:groups(id, status, member_count, variant:product_variants(label, product:products(name))), quotation_tiers(min_members, unit_price_paise)",
    )
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error("Could not load your quotations.");

  return schema.parse(data).map((q) => {
    const tiers = q.quotation_tiers
      .map((t) => ({ minMembers: t.min_members, unitPricePaise: Number(t.unit_price_paise) }))
      .sort((a, b) => a.minMembers - b.minMembers);
    return {
      groupId: q.group.id,
      groupStatus: q.group.status,
      productName: q.group.variant.product.name,
      variantLabel: q.group.variant.label,
      memberCount: q.group.member_count,
      quoteStatus: q.status,
      currentPricePaise: effectiveTier(tiers, q.group.member_count)?.unitPricePaise ?? null,
      tiers,
    };
  });
}
