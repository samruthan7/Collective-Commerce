import { z } from "@cc/shared";
import { requireUser } from "@/lib/requireUser";

const buyerSchema = z.array(
  z.object({
    group_id: z.string(),
    product_name: z.string(),
    variant_label: z.string(),
    seller_name: z.string(),
    seller_phone: z.string(),
    seller_city: z.string(),
    unit_price_paise: z.number().nullable(),
    delivery_days: z.number().int(),
  }),
);
export type BuyerOrder = z.infer<typeof buyerSchema>[number];

const sellerSchema = z.array(
  z.object({
    group_id: z.string(),
    product_name: z.string(),
    variant_label: z.string(),
    buyer_name: z.string(),
    buyer_email: z.string(),
    unit_price_paise: z.number().nullable(),
    selected_at: z.string(),
  }),
);
export type SellerOrder = z.infer<typeof sellerSchema>[number];

export async function listMyOrders(): Promise<BuyerOrder[]> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("my_orders");
  if (error) throw new Error("Could not load your orders.");
  return buyerSchema.parse(data ?? []);
}

export async function listSellerOrders(): Promise<SellerOrder[]> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("seller_orders");
  if (error) throw new Error("Could not load your orders.");
  return sellerSchema.parse(data ?? []);
}
