"use server";

import { revalidatePath } from "next/cache";
import { z } from "@cc/shared";
import type { ActionState } from "@/lib/actionState";
import { requireUser } from "@/lib/requireUser";
import { friendlyRpcError } from "@/lib/rpcErrors";

function orderError(message: string): string {
  if (message.includes("ORDER_NOT_FOUND")) return "We could not find that order.";
  if (message.includes("ORDER_STATE")) return "This order cannot move to that step right now.";
  return friendlyRpcError(message);
}

const shipSchema = z.object({ groupId: z.string().uuid(), buyerId: z.string().uuid() });
const deliverSchema = z.object({ groupId: z.string().uuid() });

export async function markShippedAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = shipSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid request.", notice: null };
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("seller_mark_shipped", {
    p_group_id: parsed.data.groupId,
    p_buyer_id: parsed.data.buyerId,
  });
  if (error) return { error: orderError(error.message), notice: null };
  revalidatePath("/seller/orders");
  return { error: null, notice: "Marked as shipped. The buyer has been notified." };
}

export async function confirmDeliveryAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = deliverSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid request.", notice: null };
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("buyer_confirm_delivery", {
    p_group_id: parsed.data.groupId,
  });
  if (error) return { error: orderError(error.message), notice: null };
  revalidatePath("/my/orders");
  return { error: null, notice: "Delivery confirmed. Thank you!" };
}
