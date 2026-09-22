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
    const finalFromEmail =
      process.env.POSTMARK_FROM_EMAIL || fromEmail || "noreply@deviomx.com";
    const finalFromName =
      process.env.POSTMARK_FROM_NAME || fromName || "DEVIO";

    // Helper to ensure image URLs sent to email clients are absolute, valid HTTPS URLs
    const defaultProjectLogo =
      "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398492782x453733136803679400/lirica.jpeg";
    const defaultDevLogo =
      "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398110026x731242031517065300/grupo_veq_logo.jpeg";

    const sanitizeImageUrl = (url: any, fallback: string) => {
      if (!url || typeof url !== "string" || !url.trim()) return fallback;
      const trimmed = url.trim();
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        return trimmed;
      }
      return fallback;
    };

    // Construct final model with robust fallback variables for Postmark templates
    const finalTemplateModel = {
      año: new Date().getFullYear().toString(),
      desarrolladora: templateModel.desarrolladora || "Desarrolladora Inmobiliaria",
      proyecto: templateModel.proyecto || "Proyecto Residencial",
      ...templateModel,
      // Ensure image fields are valid public URLs and never empty strings (prevents broken <img> in emails)
      logo_proyecto: sanitizeImageUrl(templateModel.logo_proyecto, defaultProjectLogo),
      logo_desarrolladora: sanitizeImageUrl(templateModel.logo_desarrolladora, defaultDevLogo),
      logo_url: sanitizeImageUrl(templateModel.logo_url, defaultDevLogo),
      foto_1: sanitizeImageUrl(
        templateModel.foto_1,
        "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777401220510x647449209921793000/black_eleven_07.jpg"
      ),
      foto_2: sanitizeImageUrl(
        templateModel.foto_2,
        "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777401219420x876505465866231700/black_eleven_05.jpg"
      ),
      foto_3: sanitizeImageUrl(
        templateModel.foto_3,
        "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777401219392x670070627510692200/black_eleven_06.jpg"
      ),
    };

    const postmarkPayload = {
      From: `${finalFromName} <${finalFromEmail}>`,
      To: to,
      TemplateAlias: templateAlias,
      TemplateModel: finalTemplateModel,
      MessageStream: "outbound",
    };

    console.log(`[Postmark] Enviando plantilla "${templateAlias}" a ${to} desde ${finalFromEmail}...`);

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
      console.error("[Postmark Error]", response.status, data);
      return NextResponse.json(
        {
          error: data.Message || "Error al enviar correo en Postmark",
          postmarkCode: data.ErrorCode,
        },
        { status: response.status }
      );
    }

    console.log(`[Postmark Success] Mensaje enviado exitosamente a ${to}. MessageID: ${data.MessageID}`);

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
