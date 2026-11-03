import type { Metadata } from "next";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/buttonStyles";
import { listCategories, searchProducts } from "@/lib/catalog";
import { formatPaiseAsINR } from "@/lib/money";
import { parseSort, SORT_OPTIONS, sortProducts } from "@/lib/productSort";

export const metadata: Metadata = { title: "Catalog" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

const fieldClasses =
  "rounded-xl border border-line bg-surface px-4 py-2.5 text-sm outline-none focus:border-accent-500";

export default async function CatalogPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = first(params.q).trim();
  const sort = parseSort(first(params.sort));

  const categories = await listCategories();
  const results = q ? sortProducts(await searchProducts(q), sort) : null;

  return (
    <div className="space-y-8">
      <header className="max-w-2xl">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Catalog</h1>
        <p className="mt-3 text-ink-500">
          Choose a category, then the exact variant you want. Groups form around one exact variant,
          so everyone in the group buys the very same thing.
        </p>
      </header>

      <form action="/catalog" method="get" role="search" className="flex flex-wrap gap-3">
        <label className="sr-only" htmlFor="q">
          Search products
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Search by product or brand"
          className={`${fieldClasses} w-full sm:w-80`}
        />
        <label className="sr-only" htmlFor="sort">
          Sort results
        </label>
        <select id="sort" name="sort" defaultValue={sort} className={fieldClasses}>
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button type="submit" className={buttonClasses("primary")}>
          Search
        </button>
        {q ? (
          <Link href="/catalog" className={buttonClasses("ghost")}>
            Clear
          </Link>
        ) : null}
      </form>

      {results ? (
        <section aria-labelledby="results-h" className="space-y-4">
          <h2 id="results-h" className="font-semibold">
            {results.length === 0
              ? `No products match “${q}”`
              : `${results.length} result${results.length === 1 ? "" : "s"} for “${q}”`}
          </h2>
          {results.length === 0 ? (
            <p className="text-sm text-ink-500">
              Try a shorter search, or browse the categories below.
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/catalog/${r.categorySlug}`}
                    className="block h-full rounded-2xl border border-line bg-card p-5 shadow-card transition-colors hover:border-accent-500"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                      {r.brand} · {r.categoryName}
                    </p>
                    <h3 className="mt-1 font-semibold">{r.name}</h3>
                    <p className="mt-3 text-sm text-ink-500">
                      {r.variantCount} variant{r.variantCount === 1 ? "" : "s"}
                      {r.minPricePaise !== null
                        ? ` · from ${formatPaiseAsINR(r.minPricePaise)}`
                        : ""}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <section aria-labelledby="categories-h" className="space-y-4">
        <h2 id="categories-h" className="font-semibold">
          Browse by category
        </h2>
        {categories.length === 0 ? (
          <p className="text-ink-500">No categories are available yet.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/catalog/${category.slug}`}
                  className="block h-full rounded-2xl border border-line bg-card p-6 shadow-card transition-colors hover:border-accent-500"
                >
                  <h3 className="font-semibold">{category.name}</h3>
                  {category.description ? (
                    <p className="mt-2 text-sm text-ink-500">{category.description}</p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
