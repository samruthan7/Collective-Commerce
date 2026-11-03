import type { Metadata } from "next";
import Link from "next/link";
import { AutoRefresh } from "@/components/domain/AutoRefresh";
import { ActionForm } from "@/components/ui/ActionForm";
import { buttonClasses } from "@/components/ui/buttonStyles";
import { markNotificationsReadAction } from "@/lib/notificationActions";
import { listNotifications } from "@/lib/notifications";

export const metadata: Metadata = { title: "Alerts" };
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const rows = await listNotifications();
  const unread = rows.filter((r) => r.read_at === null).length;

  return (
    <div className="max-w-2xl space-y-6">
      <AutoRefresh />
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Alerts</h1>
          <p className="mt-1 text-ink-500">{unread} unread</p>
        </div>
        {unread > 0 ? (
          <ActionForm action={markNotificationsReadAction}>
            <button type="submit" className={buttonClasses("secondary")}>
              Mark all read
            </button>
          </ActionForm>
        ) : null}
      </header>

      {rows.length === 0 ? (
        <p className="text-ink-500">
          Nothing yet. You will see updates when your groups move forward.
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((n) => {
            const card = (
              <div className="rounded-2xl border border-line bg-card p-5 shadow-card">
                <p className={n.read_at === null ? "font-semibold" : "text-ink-500"}>
                  {n.read_at === null ? "● " : ""}
                  {n.title}
                </p>
                <p className="mt-1 text-sm text-ink-500">{n.body}</p>
                <p className="mt-2 text-xs text-ink-300">
                  {new Date(n.created_at).toLocaleString("en-IN")}
                </p>
              </div>
            );
            return <li key={n.id}>{n.link ? <Link href={n.link}>{card}</Link> : card}</li>;
          })}
        </ul>
      )}
    </div>
  );
}
