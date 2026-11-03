interface GroupProgressProps {
  memberCount: number;
  minMembers: number;
  maxMembers: number | null;
}

export function GroupProgress({ memberCount, minMembers, maxMembers }: GroupProgressProps) {
  const target = maxMembers ?? Math.max(minMembers, memberCount);
  const pct = Math.min(100, Math.round((memberCount / target) * 100));
  const minPct = Math.min(100, Math.round((minMembers / target) * 100));
  const remaining = Math.max(0, minMembers - memberCount);
  const message =
    remaining > 0
      ? `${remaining} more buyer${remaining === 1 ? "" : "s"} needed to start bidding`
      : "Minimum reached: verified sellers will be invited to bid";

  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-semibold">{memberCount} joined</span>
        <span className="text-ink-500">{maxMembers ? `max ${maxMembers}` : "no limit"}</span>
      </div>
      <div
        role="progressbar"
        aria-label="Group members"
        aria-valuemin={0}
        aria-valuemax={target}
        aria-valuenow={memberCount}
        className="relative mt-2 h-3 overflow-hidden rounded-full bg-accent-50"
      >
        <div
          className="h-full rounded-full bg-accent-600 transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute inset-y-0 w-0.5 bg-ink-900/40"
          style={{ left: `${minPct}%` }}
          aria-hidden="true"
        />
      </div>
      <p className="mt-2 text-sm text-ink-500">{message}</p>
    </div>
  );
}
