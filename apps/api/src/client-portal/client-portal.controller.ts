import { Controller, Get, Query } from "@nestjs/common";
import { ClientPortalService } from "./client-portal.service";

@Controller("client")
export class ClientPortalController {
  constructor(private readonly clientPortalService: ClientPortalService) {}

  @Get("properties")
  async getProperties(@Query("email") email?: string) {
    return this.clientPortalService.getProperties(email);
  }
}
