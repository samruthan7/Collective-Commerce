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
/** Index of the lowest price, ignoring offers with no unlocked tier. Returns -1 if none. */
export function lowestIndex(prices: (number | null)[]): number {
  let best = -1;
  prices.forEach((price, i) => {
    if (price !== null && (best === -1 || price < (prices[best] as number))) best = i;
  });
  return best;
}
