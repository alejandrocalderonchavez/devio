import { NextResponse } from "next/server";
import { prisma } from "@devio/database";
import { ScheduledNotification } from "@/data/super-admin-data";

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

export async function GET() {
  try {
    // 1. Fetch real pending or overdue obligations from the database
    const obligations = await prisma.scheduledObligation.findMany({
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
    }).catch((err: any) => {
      console.warn("Prisma error querying scheduledObligations:", err);
      return [];
    });

    const scheduled: ScheduledNotification[] = [];
    const now = new Date();

    for (const ob of obligations) {
      const client = ob.sale?.primaryClient;
      const project = ob.sale?.project;
      const developer = project?.developer;
      const unit = ob.sale?.unit;

      if (!client || !project) continue;

      const dueDate = new Date(ob.dueDate);
      
      // Target notification date: 5 days before due date at 09:00 AM CDMX
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

    return NextResponse.json({
      success: true,
      scheduled,
    });
  } catch (error: any) {
    console.error("Error generating live scheduled notifications:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al cargar notificaciones programadas", scheduled: [] },
      { status: 500 }
    );
  }
}
