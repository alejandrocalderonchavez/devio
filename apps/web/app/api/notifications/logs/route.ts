import { NextResponse } from "next/server";
import { getServerLogs, addServerLog, updateServerLog, ServerNotificationLog } from "@/lib/server-notification-logs";

export async function GET() {
  try {
    const logs = getServerLogs();
    return NextResponse.json({
      success: true,
      logs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al obtener logs de notificaciones" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: ServerNotificationLog = await request.json();
    if (!body || !body.id) {
      return NextResponse.json(
        { error: "Payload de log inválido" },
        { status: 400 }
      );
    }

    addServerLog(body);

    return NextResponse.json({
      success: true,
      log: body,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al registrar log de notificación" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, updates } = body;
    if (!id) {
      return NextResponse.json(
        { error: "ID de log requerido" },
        { status: 400 }
      );
    }

    updateServerLog(id, updates);

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al actualizar log de notificación" },
      { status: 500 }
    );
  }
}
