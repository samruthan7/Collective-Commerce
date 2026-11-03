import type { Metadata } from "next";
import { ActionForm } from "@/components/ui/ActionForm";
import { buttonClasses } from "@/components/ui/buttonStyles";
import { listAdminCatalog } from "@/lib/adminCatalog";
import { requireAdmin } from "@/lib/auth";
import { formatPaiseAsINR } from "@/lib/money";
import {
  addVariantAction,
  createProductAction,
  setProductImageAction,
  toggleCategoryAction,
  toggleProductAction,
  toggleVariantAction,
} from "@/lib/productAdminActions";

export const metadata: Metadata = { title: "Catalog manager" };
export const dynamic = "force-dynamic";

const fieldClasses =
  "w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent-500";

function Chip({ on }: { on: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        on ? "bg-accent-50 text-accent-700" : "bg-line text-ink-500"
      }`}
    >
      {on ? "Active" : "Inactive"}
    </span>
  );
}

export default async function AdminCatalogPage() {
  await requireAdmin("/admin/catalog");
  const categories = await listAdminCatalog();

  return (
    <div className="space-y-8">
      <header className="max-w-2xl">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Catalog manager</h1>
        <p className="mt-3 text-ink-500">
          Add products with a picture, add variants, and switch categories, products and variants on
          or off. Buyers only see active items.
        </p>
      </header>

      <section
        aria-labelledby="add-h"
        className="max-w-2xl rounded-2xl border border-line bg-card p-5 shadow-card"
      >
        <h2 id="add-h" className="font-semibold">
          Add a product
        </h2>
        <ActionForm action={createProductAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-ink-500">Category</span>
            <select name="categoryId" required className={fieldClasses}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-ink-500">Brand</span>
            <input name="brand" required maxLength={60} className={fieldClasses} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-ink-500">Product name</span>
            <input name="name" required maxLength={120} className={fieldClasses} />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-ink-500">Description (optional)</span>
            <textarea name="description" rows={2} maxLength={500} className={fieldClasses} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-ink-500">First variant name</span>
            <input
              name="variantLabel"
              required
              maxLength={120}
              placeholder="e.g. 256 GB, Black"
              className={fieldClasses}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-ink-500">Reference price (₹)</span>
            <input
              name="price"
              type="number"
              required
              min="1"
              max="20000000"
              step="any"
              className={fieldClasses}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-ink-500">
              Product picture (required: JPG, PNG or WebP, up to 3 MB)
            </span>
            <input
              name="image"
              type="file"
              required
              accept="image/jpeg,image/png,image/webp"
              className={fieldClasses}
            />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className={buttonClasses("primary")}>
              Add product
            </button>
          </div>
        </ActionForm>
      </section>

      {categories.map((category) => (
        <section key={category.id} aria-label={category.name} className="max-w-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">{category.name}</h2>
              <Chip on={category.isActive} />
            </div>
            <ActionForm action={toggleCategoryAction}>
              <input type="hidden" name="id" value={category.id} />
              <input type="hidden" name="active" value={String(!category.isActive)} />
              <button type="submit" className={buttonClasses("secondary")}>
                {category.isActive ? "Deactivate category" : "Activate category"}
              </button>
            </ActionForm>
          </div>

          {category.products.length === 0 ? (
            <p className="text-sm text-ink-500">No products in this category yet.</p>
          ) : (
            <ul className="space-y-4">
              {category.products.map((p) => (
                <li key={p.id} className="rounded-2xl border border-line bg-card p-5 shadow-card">
                  <div className="flex items-start gap-4">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.imageUrl}
                        alt={`${p.brand} ${p.name}`}
                        className="h-20 w-20 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-line text-center text-xs text-ink-500">
                        No picture
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold">
                          {p.brand} {p.name}
                        </p>
                        <Chip on={p.isActive} />
                      </div>
                      <ActionForm action={toggleProductAction} className="mt-2">
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="active" value={String(!p.isActive)} />
                        <button type="submit" className={buttonClasses("ghost")}>
                          {p.isActive ? "Deactivate product" : "Activate product"}
                        </button>
                      </ActionForm>
                    </div>
                  </div>

                  {!p.imageUrl ? (
                    <ActionForm
                      action={setProductImageAction}
                      className="mt-3 flex flex-wrap items-end gap-3 border-t border-line pt-3"
                    >
                      <input type="hidden" name="productId" value={p.id} />
                      <label className="block text-sm">
                        <span className="mb-1 block text-ink-500">Add the missing picture</span>
                        <input
                          name="image"
                          type="file"
                          required
                          accept="image/jpeg,image/png,image/webp"
                          className={fieldClasses}
                        />
                      </label>
                      <button type="submit" className={buttonClasses("secondary")}>
                        Save picture
                      </button>
                    </ActionForm>
                  ) : null}

                  <ul className="mt-4 space-y-2 border-t border-line pt-3 text-sm">
                    {p.variants.map((v) => (
                      <li key={v.id} className="flex flex-wrap items-center justify-between gap-2">
                        <span>
                          {v.label} · {formatPaiseAsINR(v.mrpPaise)}
                        </span>
                        <span className="flex items-center gap-2">
                          <Chip on={v.isActive} />
                          <ActionForm action={toggleVariantAction}>
                            <input type="hidden" name="id" value={v.id} />
                            <input type="hidden" name="active" value={String(!v.isActive)} />
                            <button type="submit" className={buttonClasses("ghost")}>
                              {v.isActive ? "Deactivate" : "Activate"}
                            </button>
                          </ActionForm>
                        </span>
                      </li>
                    ))}
                  </ul>

                  <ActionForm
                    action={addVariantAction}
                    className="mt-3 flex flex-wrap items-end gap-3 border-t border-line pt-3"
                  >
                    <input type="hidden" name="productId" value={p.id} />
                    <label className="block text-sm">
                      <span className="mb-1 block text-ink-500">New variant</span>
                      <input name="label" required maxLength={120} className={fieldClasses} />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block text-ink-500">Price (₹)</span>
                      <input
                        name="price"
                        type="number"
                        required
                        min="1"
                        max="20000000"
                        step="any"
                        className={fieldClasses}
                      />
                    </label>
                    <button type="submit" className={buttonClasses("secondary")}>
                      Add variant
                    </button>
                  </ActionForm>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
