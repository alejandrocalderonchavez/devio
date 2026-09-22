import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      to,
      templateAlias,
      templateModel = {},
      fromEmail = "noreply@deviomx.com",
      fromName = "DEVIO",
    } = body;

    if (!to || !templateAlias) {
      return NextResponse.json(
        { error: "Los campos 'to' y 'templateAlias' son requeridos." },
        { status: 400 }
      );
    }

    const postmarkToken =
      process.env.POSTMARK_SERVER_TOKEN || "ec9d2701-f4ec-4433-8135-a0e64a59244d";

    // Dynamic current year if not present
    const finalTemplateModel = {
      año: new Date().getFullYear().toString(),
      ...templateModel,
    };

    const postmarkPayload = {
      From: `${fromName} <${fromEmail}>`,
      To: to,
      TemplateAlias: templateAlias,
      TemplateModel: finalTemplateModel,
      MessageStream: "outbound",
    };

    const response = await fetch("https://api.postmarkapp.com/email/withTemplate", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": postmarkToken,
      },
      body: JSON.stringify(postmarkPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: data.Message || "Error al enviar correo en Postmark",
          postmarkCode: data.ErrorCode,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: data.MessageID,
      submittedAt: data.SubmittedAt,
      to: data.To,
    });
  } catch (error: any) {
    console.error("Error in /api/notifications/send:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor al procesar la notificación" },
      { status: 500 }
    );
  }
}
