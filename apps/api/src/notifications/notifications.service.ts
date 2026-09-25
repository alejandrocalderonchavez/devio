import { Injectable, BadRequestException, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export interface ServerNotificationLog {
  id: string;
  timestamp: string;
  triggerKey: string;
  triggerName: string;
  channel: "POSTMARK" | "WHATSAPP" | "PUSH" | "SLACK" | "WEBHOOK";
  recipient: string;
  recipientName?: string;
  developerName?: string;
  status: "ENTREGADO" | "PENDIENTE" | "FALLIDO" | "PAUSADO" | "REINTENTANDO";
  errorDetails?: string;
  retryCount?: number;
  metadata?: Record<string, any>;
}

const memoryLogs: ServerNotificationLog[] = [];

function computeRelativeTime(targetDate: Date, nowDate: Date = new Date()): string {
  const targetMidnight = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const nowMidnight = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
  const diffMs = targetMidnight.getTime() - nowMidnight.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hoy (9:00 AM)";
  if (diffDays === 1) return "Mañana (9:00 AM)";
  if (diffDays === -1) return "Ayer (Vencida)";
  if (diffDays < -1) return `Hace ${Math.abs(diffDays)} días (Vencida)`;
  if (diffDays <= 30) return `En ${diffDays} días`;
  const diffMonths = Math.round(diffDays / 30);
  return `En ${diffMonths} ${diffMonths === 1 ? "mes" : "meses"}`;
}

function formatScheduledDate(date: Date): string {
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const day = date.getDate().toString().padStart(2, "0");
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

function sanitizeImageUrl(url: any, fallback: string) {
  if (!url || typeof url !== "string" || !url.trim()) return fallback;
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return fallback;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  getLogs() {
    return memoryLogs.slice(-200).reverse();
  }

  addLog(log: ServerNotificationLog) {
    memoryLogs.push(log);
    if (memoryLogs.length > 500) {
      memoryLogs.shift();
    }
    return log;
  }

  updateLog(id: string, updates: Partial<ServerNotificationLog>) {
    const log = memoryLogs.find((l) => l.id === id);
    if (log) {
      Object.assign(log, updates);
    }
  }

  async send(body: any) {
    const {
      to,
      templateAlias,
      templateModel = {},
      fromEmail = "noreply@deviomx.com",
      fromName = "DEVIO",
    } = body;

    if (!to || !templateAlias) {
      throw new BadRequestException("Los campos 'to' y 'templateAlias' son requeridos.");
    }

    if (body.masterMute === true || body.stagingMode === true || process.env.NEXT_PUBLIC_NOTIFICATIONS_MUTED === "true") {
      this.addLog({
        id: `log-pmk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toLocaleString("es-MX", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        triggerKey: `postmark.${templateAlias}`,
        triggerName: `Notificación (${templateAlias})`,
        channel: "POSTMARK",
        recipient: to,
        recipientName: templateModel.nombre || "Usuario Devio",
        developerName: templateModel.desarrolladora || "Devio Inmobiliario",
        status: "PAUSADO",
        errorDetails: "Pausado: Modo Staging / Canales Desactivados en Super Admin.",
        retryCount: 0,
        metadata: { templateAlias, templateModel, bypassedByStaging: true },
      });
      return {
        success: true,
        bypassed: true,
        status: "PAUSADO",
        message: "Notificación pausada por Kill-Switch de Staging (Sin llamadas salientes a Postmark)",
      };
    }

    const postmarkToken =
      process.env.POSTMARK_SERVER_TOKEN || "ec9d2701-f4ec-4433-8135-a0e64a59244d";
    const finalFromEmail =
      process.env.POSTMARK_FROM_EMAIL || fromEmail || "noreply@deviomx.com";
    const finalFromName =
      process.env.POSTMARK_FROM_NAME || fromName || "DEVIO";

    const defaultProjectLogo =
      "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398492782x453733136803679400/lirica.jpeg";
    const defaultDevLogo =
      "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398110026x731242031517065300/grupo_veq_logo.jpeg";

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

    const response = await fetch("https://api.postmarkapp.com/email/withTemplate", {
      method: "POST",
      headers: {
        Accept: "application/json",
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
      const errMsg = data.Message || "Error al enviar correo en Postmark";
      this.addLog({
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

      throw new BadRequestException(errMsg);
    }

    this.addLog({
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

    return {
      success: true,
      messageId: data.MessageID,
      submittedAt: data.SubmittedAt,
      to: data.To,
    };
  }

  async getScheduled() {
    const obligations = await this.prisma.scheduledObligation.findMany({
      where: {
        status: { in: ["PENDING", "PARTIALLY_PAID", "OVERDUE"] },
        sale: {
          status: "ACTIVE",
        },
      },
      include: {
        sale: {
          include: {
            project: {
              include: {
                developer: true,
              },
            },
            unit: true,
            primaryClient: true,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    }).catch(() => []);

    const scheduled: any[] = [];
    const now = new Date();

    for (const ob of obligations) {
      const client = ob.sale?.primaryClient;
      const project = ob.sale?.project;
      const developer = project?.developer;
      const unit = ob.sale?.unit;

      if (!client || !project) continue;

      const dueDate = new Date(ob.dueDate);
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(reminderDate.getDate() - 5);
      reminderDate.setHours(9, 0, 0, 0);

      const isUpcomingReminder = reminderDate.getTime() > now.getTime();
      const notifTargetDate = isUpcomingReminder ? reminderDate : (dueDate.getTime() > now.getTime() ? dueDate : now);

      const triggerKey = isUpcomingReminder
        ? "payments.upcoming_reminder"
        : dueDate.getTime() <= now.getTime()
        ? "payments.overdue_notice"
        : "payments.due_today";

      const triggerName = isUpcomingReminder
        ? "Recordatorio Preventivo de Mensualidad"
        : dueDate.getTime() <= now.getTime()
        ? "Aviso de Pago Vencido / Mora"
        : "Aviso de Vencimiento de Pago";

      const channels: Array<"WHATSAPP" | "POSTMARK" | "PUSH"> = ["WHATSAPP", "POSTMARK", "PUSH"];

      for (const ch of channels) {
        const contact =
          ch === "WHATSAPP"
            ? client.phone || "+52 33 0000 0000"
            : ch === "POSTMARK"
            ? client.email || "cliente@devio.mx"
            : "App Móvil / Web Push";

        const amountFormatted = `$${Number(ob.pendingAmount || ob.originalAmount).toLocaleString("es-MX")} ${ob.currency}`;

        scheduled.push({
          id: `sch-${ob.id}-${ch.toLowerCase()}`,
          triggerKey,
          triggerName,
          category: "COBRANZA",
          channel: ch,
          scheduledFor: notifTargetDate.toISOString(),
          scheduledForFormatted: formatScheduledDate(notifTargetDate),
          relativeTime: computeRelativeTime(notifTargetDate, now),
          recipientName: client.fullName || "Cliente",
          recipientContact: contact,
          recipientRole: "Comprador / Titular",
          developerName: developer?.name || "Desarrollador",
          projectName: project.name || "Proyecto",
          unitName: unit?.unitNumber ? `Unidad ${unit.unitNumber}` : "Unidad",
          sourceEvent: `Venta #${ob.sale.contractNumber || ob.sale.id.slice(0, 8).toUpperCase()}`,
          status: "PROGRAMADA",
          payloadSummary: `${ob.title} por ${amountFormatted} (Vence ${formatScheduledDate(dueDate)})`,
          metadata: {
            monto: amountFormatted,
            fecha_vencimiento: formatScheduledDate(dueDate),
          },
        });
      }
    }

    return {
      success: true,
      scheduled,
    };
  }
}
