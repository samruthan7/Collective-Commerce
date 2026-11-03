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
      "id, slug, brand, name, description, product_variants(id, sku, label, mrp_paise, is_active)",
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
