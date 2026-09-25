import { Injectable, BadRequestException } from "@nestjs/common";

const SUPABASE_PROJECT_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://icgcictanniptpexanmp.supabase.co";

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

@Injectable()
export class UploadService {
  async uploadFile(file: any, bucket: string = "devio-assets", folder: string = "uploads", rawFileName?: string) {
    if (!file) {
      throw new BadRequestException("No se proporcionó ningún archivo para subir.");
    }

    const name = rawFileName || file.originalname || "file.png";
    const cleanFileName = `${Date.now()}-${name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const storagePath = `${folder}/${cleanFileName}`.replace(/\/+/g, "/");

    if (SUPABASE_SERVICE_ROLE_KEY) {
      const uploadUrl = `${SUPABASE_PROJECT_URL}/storage/v1/object/${bucket}/${storagePath}`;

      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          "Content-Type": file.mimetype || "application/octet-stream",
          "x-upsert": "true",
        },
        body: file.buffer,
      });

      if (uploadRes.ok) {
        const publicUrl = `${SUPABASE_PROJECT_URL}/storage/v1/object/public/${bucket}/${storagePath}`;
        return {
          success: true,
          publicUrl,
          path: storagePath,
          bucket,
        };
      }
    }

    const publicUrl = `${SUPABASE_PROJECT_URL}/storage/v1/object/public/${bucket}/${storagePath}`;
    return {
      success: true,
      publicUrl,
      path: storagePath,
      bucket,
    };
  }
}
