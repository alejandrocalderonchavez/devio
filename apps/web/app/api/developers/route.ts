import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl && !apiUrl.includes("localhost")) {
      try {
        const res = await fetch(`${apiUrl}/v1/developers`, {
          cache: "no-store",
        });

        if (res.ok) {
          const developers = await res.json();
          if (Array.isArray(developers) && developers.length > 0) {
            return NextResponse.json({ success: true, developers });
          }
        }
      } catch (e) {
        console.warn("Direct API fetch failed, falling back to migrated JSON data:", e);
      }
    }

    // Fallback to bundled migrated data
    const filePath = path.join(process.cwd(), "data/migrated-developers.json");
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      return NextResponse.json({ success: true, developers: data });
    }

    return NextResponse.json({ success: true, developers: [] });
  } catch (error: any) {
    console.error("Error in /api/developers:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al obtener desarrolladoras" },
      { status: 500 }
    );
  }
}
