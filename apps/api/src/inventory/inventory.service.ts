import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getUnitsByProject(projectId: string, status?: "AVAILABLE" | "RESERVED" | "SOLD" | "BLOCKED") {
    const where: any = { projectId };
    if (status) {
      where.status = status;
    }

    return this.prisma.unit.findMany({
      where,
      orderBy: { unitNumber: "asc" },
    });
  }

  async updateUnitStatus(unitId: string, status: "AVAILABLE" | "RESERVED" | "SOLD" | "BLOCKED") {
    const existing = await this.prisma.unit.findUnique({
      where: { id: unitId },
    });

    if (!existing) {
      throw new NotFoundException(`Unidad con ID ${unitId} no encontrada.`);
    }

    return this.prisma.unit.update({
      where: { id: unitId },
      data: { status },
    });
  }

  async getAdditionalsByProject(projectId: string) {
    return this.prisma.unitAdditional.findMany({
      where: { projectId },
      orderBy: { name: "asc" },
    });
  }
}
