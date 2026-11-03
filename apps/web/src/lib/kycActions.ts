"use server";

import { revalidatePath } from "next/cache";
import { z } from "@cc/shared";
import type { ActionState } from "@/lib/actionState";
import { detectFileKind } from "@/lib/fileType";
import { requireUser } from "@/lib/requireUser";
import { friendlyRpcError } from "@/lib/rpcErrors";

const MAX_BYTES = 5 * 1024 * 1024;
const docTypeSchema = z.enum(["gst_certificate", "business_proof", "id_proof"]);

function kycError(message: string): string {
  if (message.includes("SELLER_NOT_FOUND")) return "Please submit your seller application first.";
  if (message.includes("TOO_MANY_DOCUMENTS")) return "You have reached the limit of 10 documents.";
  return friendlyRpcError(message);
}

export async function uploadDocumentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const docType = docTypeSchema.safeParse(formData.get("docType"));
  if (!docType.success) return { error: "Choose a document type.", notice: null };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload.", notice: null };
  }
  if (file.size > MAX_BYTES) return { error: "The file is larger than 5 MB.", notice: null };

  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const kind = detectFileKind(head);
  if (!kind) return { error: "Only PDF, JPG or PNG files are accepted.", notice: null };

  const { supabase, user } = await requireUser();
  const path = `${user.id}/${crypto.randomUUID()}.${kind.ext}`;

  const { error: uploadError } = await supabase.storage
    .from("kyc-documents")
    .upload(path, file, { contentType: kind.mime, upsert: false });
  if (uploadError) return { error: "The upload failed. Please try again.", notice: null };

  const safeName = file.name.replace(/[^\w.\- ]/g, "_").slice(0, 200) || `document.${kind.ext}`;
  const { error } = await supabase.rpc("add_seller_document", {
    p_doc_type: docType.data,
    p_path: path,
    p_name: safeName,
  });
  if (error) {
    await supabase.storage.from("kyc-documents").remove([path]);
    return { error: kycError(error.message), notice: null };
  }

  revalidatePath("/seller/documents");
  return { error: null, notice: "Document uploaded. Our team will review it." };
}
