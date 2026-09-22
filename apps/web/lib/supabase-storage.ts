/**
 * Supabase Storage Client Helper
 * Handles uploading and retrieving files from `devio-assets` (public)
 * and `devio-documents` (private) buckets.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-supabase-project.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export interface UploadResult {
  success: boolean;
  publicUrl?: string;
  path?: string;
  error?: string;
}

/**
 * Upload a file (image, logo, render, blueprint) to `devio-assets` bucket
 */
export async function uploadProjectAsset(
  projectId: string,
  file: File | Blob,
  fileName: string,
  folder: "renders" | "logos" | "floorplans" | "advances" = "renders"
): Promise<UploadResult> {
  const cleanPath = `${projectId}/${folder}/${Date.now()}-${fileName.replace(/\s+/g, "_")}`;
  const uploadEndpoint = `${SUPABASE_URL}/storage/v1/object/devio-assets/${cleanPath}`;

  try {
    const res = await fetch(uploadEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY,
        "Content-Type": file.type || "application/octet-stream",
      },
      body: file,
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: errText };
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/devio-assets/${cleanPath}`;
    return {
      success: true,
      publicUrl,
      path: cleanPath,
    };
  } catch (error: any) {
    console.error("Error uploading project asset:", error);
    return {
      success: false,
      error: error?.message || "Error al subir archivo a Supabase Storage",
    };
  }
}

/**
 * Upload a private document (contract, quote PDF, receipt voucher) to `devio-documents` bucket
 */
export async function uploadProjectDocument(
  projectId: string,
  file: File | Blob,
  fileName: string,
  folder: "contracts" | "quotes" | "receipts" | "kyc" = "contracts"
): Promise<UploadResult> {
  const cleanPath = `${projectId}/${folder}/${Date.now()}-${fileName.replace(/\s+/g, "_")}`;
  const uploadEndpoint = `${SUPABASE_URL}/storage/v1/object/devio-documents/${cleanPath}`;

  try {
    const res = await fetch(uploadEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY,
        "Content-Type": file.type || "application/pdf",
      },
      body: file,
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: errText };
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/devio-documents/${cleanPath}`;
    return {
      success: true,
      publicUrl,
      path: cleanPath,
    };
  } catch (error: any) {
    console.error("Error uploading project document:", error);
    return {
      success: false,
      error: error?.message || "Error al subir documento privado",
    };
  }
}
