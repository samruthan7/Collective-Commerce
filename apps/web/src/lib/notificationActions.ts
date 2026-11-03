"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/actionState";
import { requireUser } from "@/lib/requireUser";

export async function markNotificationsReadAction(): Promise<ActionState> {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("mark_notifications_read");
  if (error) return { error: "Could not update notifications.", notice: null };
  revalidatePath("/notifications");
  return { error: null, notice: "All marked as read." };
}
