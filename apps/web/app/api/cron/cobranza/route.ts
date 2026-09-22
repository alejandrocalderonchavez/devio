import { NextResponse } from "next/server";
import { addServerLog } from "@/lib/server-notification-logs";

export async function GET(request: Request) {
  return handleCronCobranza(request);
}

export async function POST(request: Request) {
  return handleCronCobranza(request);
}

async function handleCronCobranza(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dryRun = searchParams.get("dryRun") === "true";
    const forceProject = searchParams.get("projectId");

    const postmarkToken =
      process.env.POSTMARK_SERVER_TOKEN || "ec9d2701-f4ec-4433-8135-a0e64a59244d";
    const fromEmail = process.env.POSTMARK_FROM_EMAIL || "noreply@deviomx.com";
    const fromName = process.env.POSTMARK_FROM_NAME || "DEVIO";

    const defaultProjectLogo =
      "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398492782x453733136803679400/lirica.jpeg";
    const defaultDevLogo =
      "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398110026x731242031517065300/grupo_veq_logo.jpeg";

    const formatMoney = (val: number) =>
      new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(val || 0);

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let remindersSent = 0;
    let overdueNoticesSent = 0;
    const executionDetails: Array<{
      type: "RECORDATORIO" | "MOROSO";
      to: string;
      unit: string;
      project: string;
      days: number;
      amount: number;
      status: "SENT" | "DRY_RUN" | "ERROR";
      error?: string;
    }> = [];

    // Helper to send individual notification
    const dispatchEmail = async (
      to: string,
      alias: string,
      model: Record<string, any>,
      triggerKey: string,
      triggerName: string
    ) => {
      if (dryRun) return { success: true, messageId: "dry-run" };

      const payload = {
        From: `${fromName} <${fromEmail}>`,
        To: to,
        TemplateAlias: alias,
        TemplateModel: {
          año: new Date().getFullYear().toString(),
          login_link: "https://devio.lat/login",
          logo_proyecto: defaultProjectLogo,
          logo_desarrolladora: defaultDevLogo,
          desarrolladora: "Devio Inmobiliario",
          ...model,
        },
        MessageStream: "outbound",
      };

      const res = await fetch("https://api.postmarkapp.com/email/withTemplate", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-Postmark-Server-Token": postmarkToken,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      const isOk = res.ok;

      addServerLog({
        id: `log-cron-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toLocaleString("es-MX", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        triggerKey,
        triggerName,
        channel: "POSTMARK",
        recipient: to,
        recipientName: model.nombre || "Cliente",
        developerName: model.desarrolladora || "Devio Inmobiliario",
        status: isOk ? "ENTREGADO" : "FALLIDO",
        errorDetails: isOk ? undefined : data.Message || `Error ${res.status}`,
        retryCount: 0,
        metadata: { templateAlias: alias, messageId: data.MessageID, templateModel: model },
      });

      return { success: isOk, error: data.Message };
    };

    // Return report
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      mode: dryRun ? "DRY_RUN" : "LIVE",
      summary: {
        remindersSent,
        overdueNoticesSent,
        totalDispatched: remindersSent + overdueNoticesSent,
      },
      details: executionDetails,
      message:
        remindersSent + overdueNoticesSent > 0
          ? `Se procesaron ${remindersSent} recordatorios y ${overdueNoticesSent} avisos de morosidad.`
          : "Todas las cuotas evaluadas están al corriente o sin fechas límite próximas que requieran notificación hoy.",
    });
  } catch (error: any) {
    console.error("Error in /api/cron/cobranza:", error);
    return NextResponse.json(
      { error: error.message || "Error al ejecutar cron de cobranza" },
      { status: 500 }
    );
  }
}
