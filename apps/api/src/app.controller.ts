import { Controller, Get } from "@nestjs/common";
import type { ApiHealth } from "@devio/types";
import { AppService } from "./app.service";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("health")
  getHealth(): ApiHealth {
    return this.appService.getHealth();
  }
}

