import type { Metadata } from "next";
import { z } from "@cc/shared";
import { ActionForm } from "@/components/ui/ActionForm";
import { buttonClasses } from "@/components/ui/buttonStyles";
import {
  createProductAction,
  createVariantAction,
  toggleActiveAction,
} from "@/lib/catalogAdminActions";
import { formatPaiseAsINR } from "@/lib/money";
import { requireAdmin } from "@/lib/requireAdmin";

export const metadata: Metadata = { title: "Catalog manager" };
export const dynamic = "force-dynamic";

const categoriesSchema = z.array(
  z.object({ id: z.string(), name: z.string(), slug: z.string(), is_active: z.boolean() }),
);
const productsSchema = z.array(
  z.object({
    id: z.string(),
    brand: z.string(),
    name: z.string(),
    is_active: z.boolean(),
    product_variants: z.array(
      z.object({
        id: z.string(),
        sku: z.string(),
        label: z.string(),
        mrp_paise: z.number().int(),
        is_active: z.boolean(),
      }),
    ),
  }),
);

const field = "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm";
const labelClass = "mb-1 block text-xs font-semibold text-ink-500";

function ToggleForm({
  table,
  id,
  active,
}: {
  table: "categories" | "products" | "product_variants";
  id: string;
  active: boolean;
}) {
  return (
    <ActionForm action={toggleActiveAction} className="inline">
      <input type="hidden" name="table" value={table} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="next" value={String(!active)} />
      <button type="submit" className="text-xs font-semibold text-accent-600 hover:underline">
        {active ? "Deactivate" : "Activate"}
      </button>
    </ActionForm>
  );
}

export default async function AdminCatalogPage() {
  const supabase = await requireAdmin();
  const [catRes, prodRes] = await Promise.all([
    supabase.from("categories").select("id, name, slug, is_active").order("sort_order"),
    supabase
      .from("products")
      .select("id, brand, name, is_active, product_variants(id, sku, label, mrp_paise, is_active)")
      .order("name"),
  ]);
  if (catRes.error || prodRes.error) throw new Error("Could not load the catalog.");
  const categories = categoriesSchema.parse(catRes.data);
  const products = productsSchema.parse(prodRes.data);

  return (
    <div className="space-y-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Catalog manager</h1>

      <section
        aria-labelledby="cat-h"
        className="rounded-2xl border border-line bg-card p-6 shadow-card"
      >
        <h2 id="cat-h" className="font-semibold">
          Categories
        </h2>
        <ul className="mt-3 divide-y divide-line text-sm">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center justify-between py-2">
              <span>
                {c.name} <span className="text-ink-300">({c.is_active ? "active" : "hidden"})</span>
              </span>
              <ToggleForm table="categories" id={c.id} active={c.is_active} />
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section
          aria-labelledby="np-h"
          className="rounded-2xl border border-line bg-card p-6 shadow-card"
        >
          <h2 id="np-h" className="font-semibold">
            Add product
          </h2>
          <ActionForm action={createProductAction} className="mt-4 space-y-3">
            <div>
              <label htmlFor="categoryId" className={labelClass}>
                Category
              </label>
              <select id="categoryId" name="categoryId" required className={field}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="brand" className={labelClass}>
                Brand
              </label>
              <input id="brand" name="brand" required className={field} />
            </div>
            <div>
              <label htmlFor="name" className={labelClass}>
                Product name
              </label>
              <input id="name" name="name" required className={field} />
            </div>
            <div>
              <label htmlFor="description" className={labelClass}>
                Description (optional)
              </label>
              <input id="description" name="description" className={field} />
            </div>
            <button type="submit" className={buttonClasses("primary")}>
              Add product
            </button>
          </ActionForm>
        </section>

        <section
          aria-labelledby="nv-h"
          className="rounded-2xl border border-line bg-card p-6 shadow-card"
        >
          <h2 id="nv-h" className="font-semibold">
            Add variant
          </h2>
          <ActionForm action={createVariantAction} className="mt-4 space-y-3">
            <div>
              <label htmlFor="productId" className={labelClass}>
                Product
              </label>
              <select id="productId" name="productId" required className={field}>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.brand} {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="sku" className={labelClass}>
                SKU
              </label>
              <input
                id="sku"
                name="sku"
                required
                placeholder="DEMO-PH1-512-RED"
                className={field}
              />
            </div>
            <div>
              <label htmlFor="label" className={labelClass}>
                Label
              </label>
              <input id="label" name="label" required placeholder="512 GB, Red" className={field} />
            </div>
            <div>
              <label htmlFor="priceRupees" className={labelClass}>
                Reference price (MRP) in rupees
              </label>
              <input
                id="priceRupees"
                name="priceRupees"
                type="number"
                step="0.01"
                min="1"
                required
                className={field}
              />
            </div>
            <div>
              <label htmlFor="attributes" className={labelClass}>
                Attributes (JSON, optional)
              </label>
              <input
                id="attributes"
                name="attributes"
                placeholder='{"storage_gb":512}'
                className={field}
              />
            </div>
            <button type="submit" className={buttonClasses("primary")}>
              Add variant
            </button>
          </ActionForm>
        </section>
      </div>

      <section aria-labelledby="pl-h" className="space-y-4">
        <h2 id="pl-h" className="font-semibold">
          Products and variants
        </h2>
        {products.map((p) => (
          <div key={p.id} className="rounded-2xl border border-line bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <p className="font-semibold">
                {p.brand} {p.name}{" "}
                <span className="text-xs font-normal text-ink-300">
                  ({p.is_active ? "active" : "hidden"})
                </span>
              </p>
              <ToggleForm table="products" id={p.id} active={p.is_active} />
            </div>
            <ul className="mt-3 divide-y divide-line text-sm">
              {p.product_variants.map((v) => (
                <li key={v.id} className="flex items-center justify-between py-2">
                  <span>
                    {v.label} · {v.sku} · {formatPaiseAsINR(v.mrp_paise)}{" "}
                    <span className="text-ink-300">({v.is_active ? "active" : "hidden"})</span>
                  </span>
                  <ToggleForm table="product_variants" id={v.id} active={v.is_active} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
