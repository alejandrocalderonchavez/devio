import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data/migrated-scheduled-notifications.json");
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      return NextResponse.json({ success: true, scheduled: data });
    }
    return NextResponse.json({ success: true, scheduled: [] });
  } catch (error: any) {
    console.error("Error reading scheduled notifications:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al cargar notificaciones programadas" },
      { status: 500 }
    );
  }
}
