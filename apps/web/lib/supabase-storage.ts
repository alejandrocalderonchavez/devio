/**
 * Supabase Storage Client Helper
 * Handles uploading and retrieving files from `devio-assets` (public)
 * and `devio-documents` (private) buckets in Supabase.
 */

const SUPABASE_PROJECT_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://icgcictanniptpexanmp.supabase.co";

export interface UploadResult {
  success: boolean;
  publicUrl?: string;
  path?: string;
  error?: string;
}

/**
 * Upload a file (image, logo, render, blueprint) to `devio-assets` bucket via Next.js /api/upload
 */
export async function uploadProjectAsset(
  projectId: string,
  file: File | Blob,
  fileName: string,
  folder: "renders" | "logos" | "floorplans" | "advances" | "covers" = "covers"
): Promise<UploadResult> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "devio-assets");
    formData.append("folder", `${projectId}/${folder}`);
    formData.append("fileName", fileName);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Error al subir imagen" }));
      return { success: false, error: err.error };
    }

    const data = await res.json();
    return {
      success: true,
      publicUrl: data.publicUrl,
      path: data.path,
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
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "devio-documents");
    formData.append("folder", `${projectId}/${folder}`);
    formData.append("fileName", fileName);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Error al subir documento" }));
      return { success: false, error: err.error };
    }

    const data = await res.json();
    return {
      success: true,
      publicUrl: data.publicUrl,
      path: data.path,
    };
  } catch (error: any) {
    console.error("Error uploading project document:", error);
    return {
      success: false,
      error: error?.message || "Error al subir documento privado",
    };
  }
}
