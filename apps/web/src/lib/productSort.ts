export type SortKey = "name" | "price-asc" | "price-desc";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "name", label: "Name (A to Z)" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

export function parseSort(value: string | undefined): SortKey {
  return value === "price-asc" || value === "price-desc" ? value : "name";
}

/** Sorts without changing the input. Items with no price always go last. */
export function sortProducts<T extends { name: string; minPricePaise: number | null }>(
  items: T[],
  sort: SortKey,
): T[] {
  const copy = [...items];
  copy.sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name);
    if (a.minPricePaise === null && b.minPricePaise === null) return a.name.localeCompare(b.name);
    if (a.minPricePaise === null) return 1;
    if (b.minPricePaise === null) return -1;
    return sort === "price-asc"
      ? a.minPricePaise - b.minPricePaise
      : b.minPricePaise - a.minPricePaise;
  });
  return copy;
}
