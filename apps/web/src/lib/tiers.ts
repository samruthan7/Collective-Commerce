export interface Tier {
  minMembers: number;
  unitPricePaise: number;
}

/** Best price the group has unlocked at this member count. */
export function effectiveTier(tiers: Tier[], members: number): Tier | null {
  const eligible = tiers.filter((t) => t.minMembers <= members);
  if (eligible.length === 0) return null;
  return eligible.reduce((best, t) => (t.minMembers > best.minMembers ? t : best));
}

/** Next tier the group has not reached yet. */
export function nextTier(tiers: Tier[], members: number): Tier | null {
  const upcoming = tiers.filter((t) => t.minMembers > members);
  if (upcoming.length === 0) return null;
  return upcoming.reduce((soonest, t) => (t.minMembers < soonest.minMembers ? t : soonest));
}
