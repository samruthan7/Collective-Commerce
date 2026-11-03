import { z } from "@cc/shared";
import { requireUser } from "@/lib/requireUser";
import type { Fulfilment } from "@/lib/orderStatus";

const fulfilmentSchema = z.enum(["confirmed", "shipped", "delivered"]);

const buyerRowSchema = z.object({
  group_id: z.string(),
  product_name: z.string(),
  variant_label: z.string(),
  seller_name: z.string(),
  seller_phone: z.string(),
  seller_city: z.string(),
  unit_price_paise: z.number().nullable(),
  delivery_days: z.number().int(),
  fulfilment: fulfilmentSchema,
  selected_at: z.string(),
});

const sellerRowSchema = z.object({
  group_id: z.string(),
  product_name: z.string(),
  variant_label: z.string(),
  buyer_id: z.string(),
  buyer_name: z.string(),
  buyer_email: z.string(),
  unit_price_paise: z.number().nullable(),
  selected_at: z.string(),
  fulfilment: fulfilmentSchema,
});

export interface BuyerOrder {
  groupId: string;
  productName: string;
  variantLabel: string;
  sellerName: string;
  sellerPhone: string;
  sellerCity: string;
  unitPricePaise: number | null;
  deliveryDays: number;
  fulfilment: Fulfilment;
}

export interface SellerOrder {
  groupId: string;
  productName: string;
  variantLabel: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  unitPricePaise: number | null;
  selectedAt: string;
  fulfilment: Fulfilment;
}

export async function listMyOrders(): Promise<BuyerOrder[]> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("my_orders_tracked");
  if (error) throw new Error("Could not load your orders.");
  return z
    .array(buyerRowSchema)
    .parse(data ?? [])
    .map((r) => ({
      groupId: r.group_id,
      productName: r.product_name,
      variantLabel: r.variant_label,
      sellerName: r.seller_name,
      sellerPhone: r.seller_phone,
      sellerCity: r.seller_city,
      unitPricePaise: r.unit_price_paise === null ? null : Number(r.unit_price_paise),
      deliveryDays: r.delivery_days,
      fulfilment: r.fulfilment,
    }));
}

export async function listSellerOrders(): Promise<SellerOrder[]> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("seller_orders_tracked");
  if (error) throw new Error("Could not load your sales.");
  return z
    .array(sellerRowSchema)
    .parse(data ?? [])
    .map((r) => ({
      groupId: r.group_id,
      productName: r.product_name,
      variantLabel: r.variant_label,
      buyerId: r.buyer_id,
      buyerName: r.buyer_name,
      buyerEmail: r.buyer_email,
      unitPricePaise: r.unit_price_paise === null ? null : Number(r.unit_price_paise),
      selectedAt: r.selected_at,
      fulfilment: r.fulfilment,
    }));
}
