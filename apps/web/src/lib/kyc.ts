import { requireUser } from "@/lib/requireUser";

export const DOC_TYPES = [
  { value: "gst_certificate", label: "GST certificate" },
  { value: "business_proof", label: "Business proof (shop licence or registration)" },
  { value: "id_proof", label: "Owner ID proof" },
] as const;

export function docTypeLabel(value: string): string {
  return DOC_TYPES.find((d) => d.value === value)?.label ?? value;
}

export interface SellerDoc {
  id: string;
  docType: string;
  originalName: string;
  createdAt: string;
}

export async function listMyDocuments(): Promise<SellerDoc[]> {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("seller_documents")
    .select("id, doc_type, original_name, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return (data ?? []).map((d) => ({
    id: d.id as string,
    docType: d.doc_type as string,
    originalName: d.original_name as string,
    createdAt: d.created_at as string,
  }));
}

export interface KycSeller {
  userId: string;
  businessName: string;
  city: string;
  phone: string;
  gstin: string | null;
  status: string;
  docs: (SellerDoc & { url: string | null })[];
}

/** Admin only (row level security and storage policies enforce it). Links last 5 minutes. */
export async function listKycSellers(): Promise<KycSeller[]> {
  const { supabase } = await requireUser();

  const { data: sellers, error } = await supabase
    .from("seller_profiles")
    .select("user_id, business_name, city, phone, gstin, status")
    .order("created_at", { ascending: false });
  if (error) throw new Error("Could not load sellers.");

  const { data: docs } = await supabase
    .from("seller_documents")
    .select("id, user_id, doc_type, storage_path, original_name, created_at")
    .order("created_at", { ascending: false });

  const urlByPath = new Map<string, string>();
  const paths = (docs ?? []).map((d) => d.storage_path as string);
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage
      .from("kyc-documents")
      .createSignedUrls(paths, 300);
    for (const s of signed ?? []) {
      if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl);
    }
  }

  return (sellers ?? []).map((s) => ({
    userId: s.user_id as string,
    businessName: s.business_name as string,
    city: s.city as string,
    phone: s.phone as string,
    gstin: (s.gstin as string | null) ?? null,
    status: s.status as string,
    docs: (docs ?? [])
      .filter((d) => d.user_id === s.user_id)
      .map((d) => ({
        id: d.id as string,
        docType: d.doc_type as string,
        originalName: d.original_name as string,
        createdAt: d.created_at as string,
        url: urlByPath.get(d.storage_path as string) ?? null,
      })),
  }));
}
