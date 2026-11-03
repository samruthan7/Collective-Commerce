import { z } from "@cc/shared";
import { requireUser } from "@/lib/requireUser";

const rowSchema = z.object({
  id: z.string(),
  group_id: z.string(),
  product_name: z.string(),
  buyer_name: z.string(),
  buyer_email: z.string(),
  seller_name: z.string(),
  reason: z.string(),
  details: z.string().nullable(),
  status: z.string(),
  created_at: z.string(),
});

export type AdminReport = z.infer<typeof rowSchema>;

export async function listReports(): Promise<AdminReport[]> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("admin_list_reports");
  if (error) throw new Error("Could not load reports.");
  return z.array(rowSchema).parse(data ?? []);
}
