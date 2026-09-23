import { NextResponse } from "next/server";
import { addServerLog } from "@/lib/server-notification-logs";

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

    // Resolve alias with fallback mappings
    let resolvedAlias = templateAlias.trim();
    if (
      resolvedAlias === "nueva-cotizacion" ||
      resolvedAlias === "nueva_cotizacion" ||
      resolvedAlias === "sales.send_quote" ||
      resolvedAlias === "send_quote" ||
      resolvedAlias === "quote"
    ) {
      resolvedAlias = "cotizacion";
    }

    const defaultPortalLink = "https://devio.lat/login";
    const rawReceiptUrl =
      templateModel.url_recibo ||
      templateModel.link_recibo ||
      templateModel.recibo_url ||
      templateModel.url ||
      templateModel.link ||
      templateModel.pdf_url ||
      templateModel.cotizacion_url ||
      templateModel.link_documento ||
      templateModel.portal_link ||
      templateModel.login_link ||
      defaultPortalLink;

    const finalReceiptUrl = sanitizeImageUrl(rawReceiptUrl, defaultPortalLink);

    // Construct final model with robust fallback variables for Postmark templates
    const finalTemplateModel = {
      año: new Date().getFullYear().toString(),
      anio: new Date().getFullYear().toString(),
      nombre: templateModel.nombre || templateModel.nombre_cliente || "Cliente",
      nombre_cliente: templateModel.nombre_cliente || templateModel.nombre || "Cliente",
      desarrolladora: templateModel.desarrolladora || "Desarrolladora Inmobiliaria",
      proyecto: templateModel.proyecto || "Proyecto Residencial",
      unidad: templateModel.unidad || "Unidad",
      tipo: templateModel.tipo || "Departamento",
      superficie: templateModel.superficie || "N/A",
      fecha_entrega: templateModel.fecha_entrega || "Por definir",
      plan_nombre: templateModel.plan_nombre || templateModel.plan || "Plan de Pagos",
      enganche: templateModel.enganche || "$0",
      num_pagos: templateModel.num_pagos || "1",
      monto_pago: templateModel.monto_pago || "$0",
      liquidacion: templateModel.liquidacion || "$0",
      total_plan: templateModel.total_plan || templateModel.monto_total || "$0",
      monto_total: templateModel.monto_total || templateModel.total_plan || "$0",
      folio_cotizacion: templateModel.folio_cotizacion || templateModel.folio || "",
      cotizacion_url: finalReceiptUrl,
      url_recibo: finalReceiptUrl,
      link_recibo: finalReceiptUrl,
      recibo_url: finalReceiptUrl,
      url: finalReceiptUrl,
      link: finalReceiptUrl,
      pdf_url: finalReceiptUrl,
      link_documento: finalReceiptUrl,
      portal_link: templateModel.login_link || defaultPortalLink,
      login_link: templateModel.login_link || defaultPortalLink,
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
      TemplateAlias: resolvedAlias,
      TemplateModel: finalTemplateModel,
      MessageStream: "outbound",
    };

    console.log(`[Postmark] Enviando plantilla "${resolvedAlias}" a ${to} desde ${finalFromEmail}...`);

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

    const triggerName =
      resolvedAlias === "bienvenida-cliente"
        ? "Bienvenida y Credenciales Portal Cliente"
        : resolvedAlias === "bienvenida-user"
        ? "Invitación de Staff / Colaborador"
        : resolvedAlias === "alta-unidad"
        ? "Asignación de Unidad Formalizada"
        : resolvedAlias === "avance-proyecto"
        ? "Avance de Proyecto Fotográfico"
        : resolvedAlias === "registro-porcentaje"
        ? "Registro de Porcentaje de Obra"
        : resolvedAlias === "estado-cuenta"
        ? "Estado de Cuenta Digital"
        : resolvedAlias === "recordatorio-pago"
        ? "Recordatorio Preventivo de Pago"
        : resolvedAlias === "moroso"
        ? "Aviso de Saldo Vencido / Moroso"
        : resolvedAlias === "recibo-pago"
        ? "Recibo de Pago de Enganche"
        : resolvedAlias === "broadcast-devio"
        ? "Comunicado General / Broadcast"
        : resolvedAlias === "cotizacion"
        ? "12. Enviar Cotización Digital"
        : `Notificación (${resolvedAlias})`;

    if (!response.ok) {
      console.error("[Postmark Error]", response.status, data);
      const errMsg = data.Message || "Error al enviar correo en Postmark";

      addServerLog({
        id: `log-pmk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toLocaleString("es-MX", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        triggerKey: `postmark.${templateAlias}`,
        triggerName,
        channel: "POSTMARK",
        recipient: to,
        recipientName: templateModel.nombre || "Usuario Devio",
        developerName: templateModel.desarrolladora || "Devio Inmobiliario",
        status: "FALLIDO",
        errorDetails: `Postmark [Error ${data.ErrorCode || response.status}]: ${errMsg}`,
        retryCount: 0,
        metadata: { templateAlias, postmarkCode: data.ErrorCode, templateModel },
      });

      return NextResponse.json(
        {
          error: errMsg,
          postmarkCode: data.ErrorCode,
        },
        { status: response.status }
      );
    }

    console.log(`[Postmark Success] Mensaje enviado exitosamente a ${to}. MessageID: ${data.MessageID}`);

    addServerLog({
      id: `log-pmk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      triggerKey: `postmark.${templateAlias}`,
      triggerName,
      channel: "POSTMARK",
      recipient: to,
      recipientName: templateModel.nombre || "Usuario Devio",
      developerName: templateModel.desarrolladora || "Devio Inmobiliario",
      status: "ENTREGADO",
      retryCount: 0,
      metadata: { templateAlias, messageId: data.MessageID, templateModel },
    });

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
