import type { Metadata } from "next";
import Link from "next/link";
import { listCategories } from "@/lib/catalog";

export const metadata: Metadata = { title: "Catalog" };
export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const categories = await listCategories();

  return (
    <div className="space-y-8">
      <header className="max-w-2xl">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Catalog</h1>
        <p className="mt-3 text-ink-500">
          Choose a category, then the exact variant you want. Groups form around one exact variant,
          so everyone in the group buys the very same thing.
        </p>
      </header>

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
                <h2 className="font-semibold">{category.name}</h2>
                {category.description ? (
                  <p className="mt-2 text-sm text-ink-500">{category.description}</p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
