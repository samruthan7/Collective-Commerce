"use server";

import { revalidatePath } from "next/cache";
import { z } from "@cc/shared";
import type { ActionState } from "@/lib/actionState";
import { requireAdmin } from "@/lib/requireAdmin";
import { slugify } from "@/lib/slug";

const fail = (error: string): ActionState => ({ error, notice: null });
const ok = (notice: string): ActionState => ({ error: null, notice });

const productSchema = z.object({
  categoryId: z.string().uuid("Choose a category."),
  brand: z.string().trim().min(1, "Brand is required.").max(80),
  name: z.string().trim().min(1, "Name is required.").max(120),
  description: z.string().trim().max(500).optional(),
});

export async function createProductAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await requireAdmin();
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input.");

  const { categoryId, brand, name, description } = parsed.data;
  const { error } = await supabase.from("products").insert({
    category_id: categoryId,
    brand,
    name,
    slug: slugify(`${brand} ${name}`),
    description: description || null,
  });
  if (error) {
    console.error("create product failed:", error.code, error.message);
    return fail(
      error.code === "23505"
        ? "A product with this name already exists."
        : "Could not save the product.",
    );
  }
  revalidatePath("/admin/catalog");
  return ok(`Added ${brand} ${name}.`);
}

const variantSchema = z.object({
  productId: z.string().uuid("Choose a product."),
  sku: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{3,40}$/, "SKU: 3-40 letters, digits or dashes."),
  label: z.string().trim().min(1, "Label is required.").max(120),
  priceRupees: z.coerce.number().positive("Price must be above zero.").max(10_000_000),
  attributes: z.string().trim().optional(),
});

export async function createVariantAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await requireAdmin();
  const parsed = variantSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input.");

  let attributes: unknown = {};
  if (parsed.data.attributes) {
    try {
      attributes = JSON.parse(parsed.data.attributes);
    } catch {
      return fail('Attributes must be valid JSON, for example {"storage_gb":128}.');
    }
  }
  const { error } = await supabase.from("product_variants").insert({
    product_id: parsed.data.productId,
    sku: parsed.data.sku,
    label: parsed.data.label,
    mrp_paise: Math.round(parsed.data.priceRupees * 100),
    attributes,
  });
  if (error) {
    console.error("create variant failed:", error.code, error.message);
    return fail(
      error.code === "23505" ? "This SKU already exists." : "Could not save the variant.",
    );
  }
  revalidatePath("/admin/catalog");
  return ok(`Added variant ${parsed.data.sku}.`);
}

const toggleSchema = z.object({
  table: z.enum(["categories", "products", "product_variants"]),
  id: z.string().uuid(),
  next: z.enum(["true", "false"]),
});

export async function toggleActiveAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await requireAdmin();
  const parsed = toggleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Invalid request.");

  const { error } = await supabase
    .from(parsed.data.table)
    .update({ is_active: parsed.data.next === "true" })
    .eq("id", parsed.data.id);
  if (error) return fail("Could not update.");
  revalidatePath("/admin/catalog");
  revalidatePath("/catalog", "layout");
  return ok("Saved.");
}
