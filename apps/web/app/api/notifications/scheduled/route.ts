import { NextResponse } from "next/server";
import scheduledNotifs from "@/data/migrated-scheduled-notifications.json";

export async function GET() {
  try {
    return NextResponse.json({ success: true, scheduled: scheduledNotifs });
  } catch (error: any) {
    console.error("Error reading scheduled notifications:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al cargar notificaciones programadas" },
      { status: 500 }
    );
  }
}
