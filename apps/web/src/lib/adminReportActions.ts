"use server";

import { revalidatePath } from "next/cache";
import { z } from "@cc/shared";
import type { ActionState } from "@/lib/actionState";
import { requireUser } from "@/lib/requireUser";
import { friendlyRpcError } from "@/lib/rpcErrors";

const schema = z.object({ reportId: z.string().uuid() });

export async function resolveReportAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid request.", notice: null };
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("admin_resolve_report", { p_id: parsed.data.reportId });
  if (error) return { error: friendlyRpcError(error.message), notice: null };
  revalidatePath("/admin/reports");
  return { error: null, notice: "Marked as resolved." };
}
