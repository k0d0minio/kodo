import { createClient } from "@/lib/supabase/client";

const CONTRACTS_BUCKET = "contracts";

/**
 * Upload a contract file to Supabase Storage
 */
export async function uploadContractFile(file: File, contractId: string): Promise<string> {
  const supabase = createClient();

  // Generate unique filename
  const fileExt = file.name.split(".").pop();
  const fileName = `${contractId}-${Date.now()}.${fileExt}`;
  const filePath = `${contractId}/${fileName}`;

  // Upload file
  const { data, error } = await supabase.storage.from(CONTRACTS_BUCKET).upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    throw error;
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(CONTRACTS_BUCKET).getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Delete a contract file from Supabase Storage
 */
export async function deleteContractFile(fileUrl: string): Promise<void> {
  const supabase = createClient();

  // Extract file path from URL
  const urlParts = fileUrl.split("/");
  const filePath = urlParts.slice(urlParts.indexOf(CONTRACTS_BUCKET) + 1).join("/");

  const { error } = await supabase.storage.from(CONTRACTS_BUCKET).remove([filePath]);

  if (error) {
    throw error;
  }
}

/**
 * Get a signed URL for a contract file (for private access)
 */
export async function getContractFileUrl(filePath: string): Promise<string> {
  const supabase = createClient();

  const { data, error } = await supabase.storage
    .from(CONTRACTS_BUCKET)
    .createSignedUrl(filePath, 3600); // 1 hour expiry

  if (error) {
    throw error;
  }

  return data.signedUrl;
}
