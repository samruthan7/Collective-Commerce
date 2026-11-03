import { ActionForm } from "@/components/ui/ActionForm";
import { buttonClasses } from "@/components/ui/buttonStyles";
import { joinOrCreateGroupAction } from "@/lib/groupActions";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryWithProducts } from "@/lib/catalog";
import { formatPaiseAsINR } from "@/lib/money";

export const metadata: Metadata = { title: "Catalog" };
export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: slug } = await params;
  const result = await getCategoryWithProducts(slug);
  if (!result) notFound();

  const { category, products } = result;

  return (
    <div className="space-y-8">
      <header className="max-w-2xl">
        <Link href="/catalog" className="text-sm font-semibold text-accent-600">
          ← All categories
        </Link>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">{category.name}</h1>
        {category.description ? <p className="mt-3 text-ink-500">{category.description}</p> : null}
      </header>

      {products.length === 0 ? (
        <p className="text-ink-500">No products in this category yet.</p>
      ) : (
        <ul className="space-y-4">
          {products.map((product) => (
            <li key={product.id} className="rounded-2xl border border-line bg-card p-6 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                {product.brand}
              </p>
              <h2 className="mt-1 text-lg font-semibold">{product.name}</h2>
              {product.description ? (
                <p className="mt-1 text-sm text-ink-500">{product.description}</p>
              ) : null}

              <table className="mt-4 w-full text-left text-sm">
                <caption className="sr-only">Variants of {product.name}</caption>

                <thead>
                  <tr className="border-b border-line text-ink-500">
                    <th scope="col" className="py-2 font-medium">
                      Variant
                    </th>

                    <th scope="col" className="py-2 text-right font-medium">
                      Reference price (MRP)
                    </th>

                    <th scope="col" className="py-2">
                      <span className="sr-only">Group</span>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {product.product_variants.map((variant) => (
                    <tr key={variant.id}>
                      <td className="py-2.5">{variant.label}</td>

                      <td className="py-2.5 text-right">{formatPaiseAsINR(variant.mrp_paise)}</td>

                      <td className="py-2.5 text-right">
                        <ActionForm action={joinOrCreateGroupAction}>
                          <input type="hidden" name="variantId" value={variant.id} />

                          <input type="hidden" name="commitment" value="interested" />

                          <button type="submit" className={buttonClasses("secondary")}>
                            Join or start group
                          </button>
                        </ActionForm>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </li>
          ))}
        </ul>
      )}

      <p className="text-sm text-ink-500">
        The price shown is only a reference. Groups and seller offers arrive in the next phases.
        Sample products are illustrative.
      </p>
    </div>
  );
}
