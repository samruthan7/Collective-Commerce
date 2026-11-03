import { requireUser } from "@/lib/requireUser";

export interface AdminVariant {
  id: string;
  label: string;
  mrpPaise: number;
  isActive: boolean;
}

export interface AdminProduct {
  id: string;
  brand: string;
  name: string;
  imageUrl: string | null;
  isActive: boolean;
  variants: AdminVariant[];
}

export interface AdminCategory {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
  products: AdminProduct[];
}

/** Everything, including inactive rows. Row level security lets only admins see those. */
export async function listAdminCatalog(): Promise<AdminCategory[]> {
  const { supabase } = await requireUser();

  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, slug, name, is_active")
    .order("sort_order");
  if (error) throw new Error("Could not load categories.");

  const { data: products, error: productError } = await supabase
    .from("products")
    .select(
      "id, category_id, brand, name, image_url, is_active, product_variants(id, label, mrp_paise, is_active)",
    )
    .order("brand");
  if (productError) throw new Error("Could not load products.");

  return (categories ?? []).map((c) => ({
    id: c.id as string,
    slug: c.slug as string,
    name: c.name as string,
    isActive: c.is_active as boolean,
    products: (products ?? [])
      .filter((p) => p.category_id === c.id)
      .map((p) => ({
        id: p.id as string,
        brand: p.brand as string,
        name: p.name as string,
        imageUrl: (p.image_url as string | null) ?? null,
        isActive: p.is_active as boolean,
        variants: ((p.product_variants ?? []) as Record<string, unknown>[])
          .map((v) => ({
            id: v.id as string,
            label: v.label as string,
            mrpPaise: v.mrp_paise as number,
            isActive: v.is_active as boolean,
          }))
          .sort((a, b) => a.mrpPaise - b.mrpPaise),
      })),
  }));
}
