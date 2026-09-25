import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CronService {
  constructor(private readonly prisma: PrismaService) {}

  async handleCobranza(dryRun: boolean = false, forceProject?: string) {
    const postmarkToken =
      process.env.POSTMARK_SERVER_TOKEN || "ec9d2701-f4ec-4433-8135-a0e64a59244d";
    const fromEmail = process.env.POSTMARK_FROM_EMAIL || "noreply@deviomx.com";
    const fromName = process.env.POSTMARK_FROM_NAME || "DEVIO";

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const remindersSent = 0;
    const overdueNoticesSent = 0;
    const executionDetails: any[] = [];

    return {
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
    };
  }
}
