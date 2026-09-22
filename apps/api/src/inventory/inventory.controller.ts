import { Controller, Get, Patch, Param, Query, Body } from "@nestjs/common";
import { InventoryService } from "./inventory.service";

@Controller()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get("projects/:projectId/units")
  async getUnits(
    @Param("projectId") projectId: string,
    @Query("status") status?: "AVAILABLE" | "RESERVED" | "SOLD" | "BLOCKED"
  ) {
    return this.inventoryService.getUnitsByProject(projectId, status);
  }

  @Patch("units/:unitId/status")
  async updateStatus(
    @Param("unitId") unitId: string,
    @Body("status") status: "AVAILABLE" | "RESERVED" | "SOLD" | "BLOCKED"
  ) {
    return this.inventoryService.updateUnitStatus(unitId, status);
  }

  @Get("projects/:projectId/additionals")
  async getAdditionals(@Param("projectId") projectId: string) {
    return this.inventoryService.getAdditionalsByProject(projectId);
  }
}
