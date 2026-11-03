"use server";

import { revalidatePath } from "next/cache";
import { z } from "@cc/shared";
import type { ActionState } from "@/lib/actionState";
import { requireUser } from "@/lib/requireUser";
import { friendlyRpcError } from "@/lib/rpcErrors";

const schema = z.object({ groupId: z.string().uuid(), quotationId: z.string().uuid() });

export async function selectOfferAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid request.", notice: null };
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("select_offer", {
    p_group_id: parsed.data.groupId,
    p_quotation_id: parsed.data.quotationId,
  });
  if (error) return { error: friendlyRpcError(error.message), notice: null };
  revalidatePath(`/groups/${parsed.data.groupId}`);
  return { error: null, notice: "Offer chosen. You can change it until selection closes." };
}
