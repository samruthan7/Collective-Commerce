"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "@cc/shared";
import type { ActionState } from "@/lib/actionState";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ERRORS: Record<string, string> = {
  GROUP_NOT_FOUND: "This group no longer exists.",
  GROUP_NOT_OPEN: "Joining has closed for this group.",
  GROUP_FULL: "This group is full.",
  ALREADY_MEMBER: "You are already in this group.",
  NOT_MEMBER: "You are not a member of this group.",
  LEAVE_NOT_ALLOWED: "You can no longer leave this group.",
  VARIANT_NOT_FOUND: "That product variant is not available.",
  GROUP_BUSY: "Many people are joining right now. Please try again.",
  UNAUTHENTICATED: "Please log in first.",
};

function friendly(message: string): string {
  for (const [code, text] of Object.entries(ERRORS)) {
    if (message.includes(code)) return text;
  }
  console.error("group rpc failed:", message);
  return "Something went wrong. Please try again.";
}

const fail = (error: string): ActionState => ({ error, notice: null });
const commitmentSchema = z.enum(["interested", "committed"]).default("interested");

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login"); // adjust if your login route has another path
  return supabase;
}

const startSchema = z.object({ variantId: z.string().uuid(), commitment: commitmentSchema });

/** Join the open group for a variant, creating it (or an overflow group) if needed. */
export async function joinOrCreateGroupAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = startSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Invalid request.");
  const supabase = await requireUser();

  // Launch city is Chennai (decision D14). Phase 13 will let buyers choose.
  const { data: region } = await supabase
    .from("regions")
    .select("id")
    .eq("slug", "chennai")
    .maybeSingle();
  if (!region) return fail("The launch region is not set up yet.");

  const { data, error } = await supabase.rpc("join_or_create_group", {
    p_variant_id: parsed.data.variantId,
    p_region_id: region.id,
    p_commitment: parsed.data.commitment,
  });
  if (error) return fail(friendly(error.message));

  const row = z.object({ group_id: z.string() }).safeParse(data);
  if (!row.success) return fail("Something went wrong. Please try again.");
  revalidatePath("/groups");
  redirect(`/groups/${row.data.group_id}`);
}

const joinSchema = z.object({ groupId: z.string().uuid(), commitment: commitmentSchema });

export async function joinGroupAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = joinSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Invalid request.");
  const supabase = await requireUser();

  const { error } = await supabase.rpc("join_group", {
    p_group_id: parsed.data.groupId,
    p_commitment: parsed.data.commitment,
  });
  if (error) return fail(friendly(error.message));
  revalidatePath(`/groups/${parsed.data.groupId}`);
  return { error: null, notice: "You have joined this group." };
}

const leaveSchema = z.object({ groupId: z.string().uuid() });

export async function leaveGroupAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = leaveSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Invalid request.");
  const supabase = await requireUser();

  const { error } = await supabase.rpc("leave_group", { p_group_id: parsed.data.groupId });
  if (error) return fail(friendly(error.message));
  revalidatePath(`/groups/${parsed.data.groupId}`);
  return { error: null, notice: "You have left this group." };
}
