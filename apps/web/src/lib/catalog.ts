import { z } from "@cc/shared";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const categorySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
});

const variantSchema = z.object({
  id: z.string(),
  sku: z.string(),
  label: z.string(),
  mrp_paise: z.number().int(),
  is_active: z.boolean(),
});

const productSchema = z.object({
  id: z.string(),
  slug: z.string(),
  brand: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  image_url: z.string().nullable(),
  product_variants: z.array(variantSchema),
});

export type Category = z.infer<typeof categorySchema>;
export type Product = z.infer<typeof productSchema>;

export async function listCategories(): Promise<Category[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name, description")
    .order("sort_order");
  if (error) throw new Error("Could not load categories.");
  return z.array(categorySchema).parse(data);
}

export async function getCategoryWithProducts(
  slug: string,
): Promise<{ category: Category; products: Product[] } | null> {
  const supabase = await createSupabaseServerClient();

  const { data: categoryRow, error: categoryError } = await supabase
    .from("categories")
    .select("id, slug, name, description")
    .eq("slug", slug)
    .maybeSingle();
  if (categoryError) throw new Error("Could not load the category.");
  if (!categoryRow) return null;
  const category = categorySchema.parse(categoryRow);

  const { data, error } = await supabase
    .from("products")
    .select(
      "id, slug, brand, name, description, image_url, product_variants(id, sku, label, mrp_paise, is_active)",
    )
    .eq("category_id", category.id)
    .order("name");
  if (error) throw new Error("Could not load products.");

  const products = z
    .array(productSchema)
    .parse(data)
    .map((product) => ({
      ...product,
      product_variants: product.product_variants
        .filter((variant) => variant.is_active)
        .sort((a, b) => a.mrp_paise - b.mrp_paise),
    }));

  return { category, products };
}

const searchRowSchema = z.object({
  id: z.string(),
  brand: z.string(),
  name: z.string(),
  image_url: z.string().nullable(),
  category: z.object({ slug: z.string(), name: z.string() }),
  product_variants: z.array(z.object({ mrp_paise: z.number(), is_active: z.boolean() })),
});

export interface SearchResult {
  id: string;
  brand: string;
  name: string;
  imageUrl: string | null;
  categorySlug: string;
  categoryName: string;
  minPricePaise: number | null;
  variantCount: number;
}

/** Searches product names and brands across all active categories. */
export async function searchProducts(rawQuery: string): Promise<SearchResult[]> {
  // Remove characters that have a meaning inside the filter string.
  const term = rawQuery
    .replace(/[%_,()*\\"']/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
  if (term.length < 2) return [];
  const pattern = `%${term}%`;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, brand, name, image_url, category:categories!inner(slug, name), product_variants(mrp_paise, is_active)",
    )
    .or(`name.ilike."${pattern}",brand.ilike."${pattern}"`)
    .limit(40);
  if (error) throw new Error("Search is unavailable right now.");

  return z
    .array(searchRowSchema)
    .parse(data)
    .map((row) => {
      const prices = row.product_variants.filter((v) => v.is_active).map((v) => v.mrp_paise);
      return {
        id: row.id,
        brand: row.brand,
        name: row.name,
        imageUrl: row.image_url,
        categorySlug: row.category.slug,
        categoryName: row.category.name,
        minPricePaise: prices.length > 0 ? Math.min(...prices) : null,
        variantCount: prices.length,
      };
    })
    .filter((r) => r.variantCount > 0);
}
