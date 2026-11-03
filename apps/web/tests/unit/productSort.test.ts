import { describe, expect, it } from "vitest";
import { parseSort, sortProducts } from "../../src/lib/productSort";

const items = [
  { name: "Beta", minPricePaise: 500 },
  { name: "Alpha", minPricePaise: null },
  { name: "Gamma", minPricePaise: 300 },
];

describe("sortProducts", () => {
  it("sorts by name", () => {
    expect(sortProducts(items, "name").map((i) => i.name)).toEqual(["Alpha", "Beta", "Gamma"]);
  });

  it("sorts by price and keeps unpriced items last", () => {
    expect(sortProducts(items, "price-asc").map((i) => i.name)).toEqual(["Gamma", "Beta", "Alpha"]);
    expect(sortProducts(items, "price-desc").map((i) => i.name)).toEqual([
      "Beta",
      "Gamma",
      "Alpha",
    ]);
  });

  it("does not change the input", () => {
    const before = items.map((i) => i.name);
    sortProducts(items, "price-asc");
    expect(items.map((i) => i.name)).toEqual(before);
  });

  it("falls back to name for unknown values", () => {
    expect(parseSort("nonsense")).toBe("name");
    expect(parseSort(undefined)).toBe("name");
    expect(parseSort("price-asc")).toBe("price-asc");
  });
});
