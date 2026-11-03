"use server";

import { revalidatePath } from "next/cache";
import { z } from "@cc/shared";
import type { ActionState } from "@/lib/actionState";
import { requireAdmin } from "@/lib/requireAdmin";
import { requireUser } from "@/lib/requireUser";
import { friendlyRpcError } from "@/lib/rpcErrors";

const fail = (error: string): ActionState => ({ error, notice: null });
const ok = (notice: string): ActionState => ({ error: null, notice });

const applySchema = z.object({
  businessName: z.string().trim().min(2, "Business name is required.").max(120),
  gstin: z.string().trim().toUpperCase().optional(),
  city: z.string().trim().min(2, "City is required.").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+ -]{8,15}$/, "Enter a valid phone number."),
});

export async function applyAsSellerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = applySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input.");
  const { supabase } = await requireUser();

  const { error } = await supabase.rpc("apply_as_seller", {
    p_business_name: parsed.data.businessName,
    p_gstin: parsed.data.gstin ?? "",
    p_city: parsed.data.city,
    p_phone: parsed.data.phone,
  });
  if (error) {
    return fail(
      error.code === "23514"
        ? "Check the GSTIN format (15 characters)."
        : friendlyRpcError(error.message),
    );
  }
  revalidatePath("/seller");
  return ok("Application sent. An admin will review it.");
}

const quoteSchema = z.object({
  groupId: z.string().uuid(),
  deliveryDays: z.coerce
    .number()
    .int()
    .min(1, "Delivery days: 1 to 90.")
    .max(90, "Delivery days: 1 to 90."),
  warrantyMonths: z.coerce.number().int().min(0).max(120),
  notes: z.string().trim().max(500).optional(),
});

export async function submitQuotationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = quoteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input.");

  const tiers = [1, 2, 3].flatMap((i) => {
    const min = String(formData.get(`t${i}Min`) ?? "").trim();
    const price = String(formData.get(`t${i}Price`) ?? "").trim();
    if (!min && !price) return [];
    return [{ min_members: Number(min), unit_price_paise: Math.round(Number(price) * 100) }];
  });
  const badTier = tiers.some(
    (t) =>
      !Number.isInteger(t.min_members) ||
      t.min_members < 1 ||
      !Number.isFinite(t.unit_price_paise) ||
      t.unit_price_paise < 1,
  );
  if (tiers.length === 0 || badTier)
    return fail("Enter at least one valid tier (members and price).");

  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("submit_quotation", {
    p_group_id: parsed.data.groupId,
    p_delivery_days: parsed.data.deliveryDays,
    p_warranty_months: parsed.data.warrantyMonths,
    p_notes: parsed.data.notes ?? "",
    p_tiers: tiers,
  });
  if (error) return fail(friendlyRpcError(error.message));
  revalidatePath(`/seller/groups/${parsed.data.groupId}`);
  return ok("Quotation saved.");
}

export async function withdrawQuotationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = z.object({ groupId: z.string().uuid() }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Invalid request.");
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("withdraw_quotation", { p_group_id: parsed.data.groupId });
  if (error) return fail(friendlyRpcError(error.message));
  revalidatePath(`/seller/groups/${parsed.data.groupId}`);
  return ok("Quotation withdrawn.");
}

const statusSchema = z.object({
  userId: z.string().uuid(),
  status: z.enum(["verified", "rejected", "suspended", "pending"]),
});

export async function setSellerStatusAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await requireAdmin();
  const parsed = statusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Invalid request.");
  const { error } = await supabase.rpc("admin_set_seller_status", {
    p_user_id: parsed.data.userId,
    p_status: parsed.data.status,
  });
  if (error) return fail(friendlyRpcError(error.message));
  revalidatePath("/admin/sellers");
  return ok("Seller updated.");
}
