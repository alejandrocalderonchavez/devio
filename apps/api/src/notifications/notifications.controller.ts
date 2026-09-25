import { Controller, Get, Post, Patch, Body } from "@nestjs/common";
import { NotificationsService, ServerNotificationLog } from "./notifications.service";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get("logs")
  getLogs() {
    const logs = this.notificationsService.getLogs();
    return {
      success: true,
      logs,
    };
  }

  @Post("logs")
  addLog(@Body() body: ServerNotificationLog) {
    if (!body || !body.id) {
      return { success: false, error: "Payload de log inválido" };
    }
    const log = this.notificationsService.addLog(body);
    return {
      success: true,
      log,
    };
  }

  @Patch("logs")
  updateLog(@Body() body: { id: string; updates: Partial<ServerNotificationLog> }) {
    if (!body || !body.id) {
      return { success: false, error: "ID de log requerido" };
    }
    this.notificationsService.updateLog(body.id, body.updates);
    return { success: true };
  }

  @Post("send")
  async send(@Body() body: any) {
    return this.notificationsService.send(body);
  }

  @Get("scheduled")
  async getScheduled() {
    return this.notificationsService.getScheduled();
  }
}
