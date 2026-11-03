"use server";

import { revalidatePath } from "next/cache";
import { z } from "@cc/shared";
import type { ActionState } from "@/lib/actionState";
import { requireUser } from "@/lib/requireUser";
import { friendlyRpcError } from "@/lib/rpcErrors";

function feedbackError(message: string): string {
  if (message.includes("REVIEW_NOT_ALLOWED"))
    return "You can review a seller after you confirm delivery.";
  if (message.includes("ALREADY_REVIEWED")) return "You have already reviewed this order.";
  if (message.includes("INVALID_RATING")) return "Please choose a rating from 1 to 5.";
  if (message.includes("ORDER_NOT_FOUND")) return "We could not find that order.";
  if (message.includes("REPORT_EXISTS")) return "You already have an open report for this order.";
  return friendlyRpcError(message);
}

const reviewSchema = z.object({
  groupId: z.string().uuid(),
  rating: z.string().regex(/^[1-5]$/),
  comment: z.string().max(500).optional(),
});

const reportSchema = z.object({
  groupId: z.string().uuid(),
  reason: z.enum(["not_delivered", "wrong_item", "price_changed", "seller_unresponsive", "other"]),
  details: z.string().max(1000).optional(),
});

export async function submitReviewAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Please choose a rating from 1 to 5.", notice: null };
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("submit_review", {
    p_group_id: parsed.data.groupId,
    p_rating: Number(parsed.data.rating),
    p_comment: parsed.data.comment ?? null,
  });
  if (error) return { error: feedbackError(error.message), notice: null };
  revalidatePath("/my/orders");
  return { error: null, notice: "Thank you for your review." };
}

export async function submitReportAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = reportSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Please choose a reason.", notice: null };
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("submit_order_report", {
    p_group_id: parsed.data.groupId,
    p_reason: parsed.data.reason,
    p_details: parsed.data.details ?? null,
  });
  if (error) return { error: feedbackError(error.message), notice: null };
  revalidatePath("/my/orders");
  return { error: null, notice: "Report sent. Our team will look into it." };
}
