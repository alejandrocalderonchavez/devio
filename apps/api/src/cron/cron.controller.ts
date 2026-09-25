import { Controller, Get, Post, Query } from "@nestjs/common";
import { CronService } from "./cron.service";

@Controller("cron")
export class CronController {
  constructor(private readonly cronService: CronService) {}

  @Get("cobranza")
  async handleCobranzaGet(
    @Query("dryRun") dryRun?: string,
    @Query("projectId") projectId?: string
  ) {
    return this.cronService.handleCobranza(dryRun === "true", projectId);
  }

  @Post("cobranza")
  async handleCobranzaPost(
    @Query("dryRun") dryRun?: string,
    @Query("projectId") projectId?: string
  ) {
    return this.cronService.handleCobranza(dryRun === "true", projectId);
  }
}
