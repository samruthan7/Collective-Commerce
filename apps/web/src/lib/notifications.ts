import { z } from "@cc/shared";
import { requireUser } from "@/lib/requireUser";

const schema = z.array(
  z.object({
    id: z.string(),
    title: z.string(),
    body: z.string(),
    link: z.string().nullable(),
    created_at: z.string(),
    read_at: z.string().nullable(),
  }),
);
export type NotificationRow = z.infer<typeof schema>[number];

export async function listNotifications(): Promise<NotificationRow[]> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, title, body, link, created_at, read_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error("Could not load notifications.");
  return schema.parse(data);
}
