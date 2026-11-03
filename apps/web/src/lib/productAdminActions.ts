"use server";

import { revalidatePath } from "next/cache";
import { z } from "@cc/shared";
import type { ActionState } from "@/lib/actionState";
import { requireAdmin } from "@/lib/auth";
import { detectImageKind } from "@/lib/imageType";
import { requireUser } from "@/lib/requireUser";
import type { createSupabaseServerClient } from "@/lib/supabase/server";

type Db = Awaited<ReturnType<typeof createSupabaseServerClient>>;

const BUCKET = "product-images";
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function suffix(): string {
  return crypto.randomUUID().slice(0, 4);
}

function fail(error: string): ActionState {
  return { error, notice: null };
}

function refresh() {
  revalidatePath("/admin/catalog");
  revalidatePath("/catalog", "layout");
}

interface CheckedImage {
  file: File;
  mime: string;
  ext: string;
}

async function readImage(value: FormDataEntryValue | null): Promise<CheckedImage | string> {
  if (!(value instanceof File) || value.size === 0) return "A product picture is required.";
  if (value.size > MAX_IMAGE_BYTES) return "The picture is larger than 3 MB.";
  const kind = detectImageKind(new Uint8Array(await value.slice(0, 16).arrayBuffer()));
  if (!kind) return "The picture must be a JPG, PNG or WebP image.";
  return { file: value, mime: kind.mime, ext: kind.ext };
}

async function uploadImage(
  supabase: Db,
  folder: string,
  image: CheckedImage,
): Promise<{ url: string; path: string } | null> {
  const path = `${folder}/${crypto.randomUUID()}.${image.ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, image.file, { contentType: image.mime, upsert: false });
  if (error) return null;
  return { url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl, path };
}

/** Inserts a variant, retrying once with a different SKU if the first one is taken. */
async function insertVariant(
  supabase: Db,
  productId: string,
  productSlug: string,
  label: string,
  mrpPaise: number,
): Promise<boolean> {
  const base = `${productSlug}-${slugify(label)}`.toUpperCase();
  for (const sku of [base, `${base}-${suffix().toUpperCase()}`]) {
    const { error } = await supabase
      .from("product_variants")
      .insert({ product_id: productId, sku, label, mrp_paise: mrpPaise });
    if (!error) return true;
    if (error.code !== "23505") return false;
  }
  return false;
}

const priceField = z.coerce.number().positive().max(20000000);

const createSchema = z.object({
  categoryId: z.string().uuid(),
  brand: z.string().trim().min(1).max(60),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500),
  variantLabel: z.string().trim().min(1).max(120),
  price: priceField,
});

export async function createProductAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin("/admin/catalog");

  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail("Fill in the category, brand, product name, variant and price.");
  }
  const image = await readImage(formData.get("image"));
  if (typeof image === "string") return fail(image);

  const { supabase } = await requireUser();
  const { data: category } = await supabase
    .from("categories")
    .select("slug")
    .eq("id", parsed.data.categoryId)
    .maybeSingle();
  if (!category) return fail("That category was not found.");

  const uploaded = await uploadImage(supabase, category.slug as string, image);
  if (!uploaded) return fail("The picture upload failed. Please try again.");

  const { brand, name, description, variantLabel, price } = parsed.data;
  const baseSlug = slugify(`${brand} ${name}`) || "product";
  let product: { id: string; slug: string } | null = null;
  for (const slug of [baseSlug, `${baseSlug}-${suffix()}`]) {
    const { data, error } = await supabase
      .from("products")
      .insert({
        category_id: parsed.data.categoryId,
        slug,
        brand,
        name,
        description: description || null,
        image_url: uploaded.url,
      })
      .select("id, slug")
      .single();
    if (!error && data) {
      product = { id: data.id as string, slug: data.slug as string };
      break;
    }
    if (error?.code !== "23505") break;
  }
  if (!product) {
    await supabase.storage.from(BUCKET).remove([uploaded.path]);
    return fail("Could not save the product.");
  }

  const variantSaved = await insertVariant(
    supabase,
    product.id,
    product.slug,
    variantLabel,
    Math.round(price * 100),
  );
  if (!variantSaved) {
    await supabase.from("products").delete().eq("id", product.id);
    await supabase.storage.from(BUCKET).remove([uploaded.path]);
    return fail("Could not save the variant.");
  }

  refresh();
  return { error: null, notice: `${brand} ${name} was added.` };
}

const variantSchema = z.object({
  productId: z.string().uuid(),
  label: z.string().trim().min(1).max(120),
  price: priceField,
});

export async function addVariantAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin("/admin/catalog");
  const parsed = variantSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Enter a variant name and a price.");

  const { supabase } = await requireUser();
  const { data: product } = await supabase
    .from("products")
    .select("slug")
    .eq("id", parsed.data.productId)
    .maybeSingle();
  if (!product) return fail("That product was not found.");

  const saved = await insertVariant(
    supabase,
    parsed.data.productId,
    product.slug as string,
    parsed.data.label,
    Math.round(parsed.data.price * 100),
  );
  if (!saved) return fail("Could not save the variant.");
  refresh();
  return { error: null, notice: "Variant added." };
}

const imageSchema = z.object({ productId: z.string().uuid() });

export async function setProductImageAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin("/admin/catalog");
  const parsed = imageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Invalid request.");
  const image = await readImage(formData.get("image"));
  if (typeof image === "string") return fail(image);

  const { supabase } = await requireUser();
  const uploaded = await uploadImage(supabase, `products/${parsed.data.productId}`, image);
  if (!uploaded) return fail("The picture upload failed. Please try again.");

  const { error } = await supabase
    .from("products")
    .update({ image_url: uploaded.url })
    .eq("id", parsed.data.productId);
  if (error) {
    await supabase.storage.from(BUCKET).remove([uploaded.path]);
    return fail("Could not save the picture.");
  }
  refresh();
  return { error: null, notice: "Picture saved." };
}

const toggleSchema = z.object({
  id: z.string().uuid(),
  active: z.enum(["true", "false"]),
});

async function setActive(
  table: "categories" | "products" | "product_variants",
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin("/admin/catalog");
  const parsed = toggleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Invalid request.");
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from(table)
    .update({ is_active: parsed.data.active === "true" })
    .eq("id", parsed.data.id);
  if (error) return fail("Could not update. Please try again.");
  refresh();
  return { error: null, notice: "Saved." };
}

export async function toggleCategoryAction(_prev: ActionState, formData: FormData) {
  return setActive("categories", formData);
}

export async function toggleProductAction(_prev: ActionState, formData: FormData) {
  return setActive("products", formData);
}

export async function toggleVariantAction(_prev: ActionState, formData: FormData) {
  return setActive("product_variants", formData);
}
