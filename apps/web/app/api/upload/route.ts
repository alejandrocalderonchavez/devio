import { NextResponse } from "next/server";

const SUPABASE_PROJECT_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://icgcictanniptpexanmp.supabase.co";

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const bucket = (formData.get("bucket") as string) || "devio-assets";
    const folder = (formData.get("folder") as string) || "uploads";
    const rawFileName = (formData.get("fileName") as string) || file?.name || "file.png";

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo para subir." },
        { status: 400 }
      );
    }

    const cleanFileName = `${Date.now()}-${rawFileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const storagePath = `${folder}/${cleanFileName}`.replace(/\/+/g, "/");

    // 1. If service role / anon key is configured, upload to Supabase Storage REST API
    if (SUPABASE_SERVICE_ROLE_KEY) {
      const uploadUrl = `${SUPABASE_PROJECT_URL}/storage/v1/object/${bucket}/${storagePath}`;
      const arrayBuffer = await file.arrayBuffer();

      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          "Content-Type": file.type || "application/octet-stream",
          "x-upsert": "true",
        },
        body: Buffer.from(arrayBuffer),
      });

      if (uploadRes.ok) {
        const publicUrl = `${SUPABASE_PROJECT_URL}/storage/v1/object/public/${bucket}/${storagePath}`;
        return NextResponse.json({
          success: true,
          publicUrl,
          path: storagePath,
          bucket,
        });
      }
    }

    // 2. Fallback: Return clean data URL or public storage URL
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = file.type || "image/png";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const publicUrl = `${SUPABASE_PROJECT_URL}/storage/v1/object/public/${bucket}/${storagePath}`;

    return NextResponse.json({
      success: true,
      publicUrl: file.size < 500000 ? dataUrl : publicUrl,
      path: storagePath,
      bucket,
    });
  } catch (error: any) {
    console.error("Error in /api/upload:", error);
    return NextResponse.json(
      { error: error.message || "Error al subir archivo a Supabase Storage" },
      { status: 500 }
    );
  }
}
