import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

const isUuid = (str?: string | null) =>
  Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

@Injectable()
export class UnitsService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveProjectId(projectId?: string | null): Promise<string | null> {
    if (projectId && isUuid(projectId)) return projectId;
    const firstProject = await this.prisma.project.findFirst({ select: { id: true } });
    return firstProject?.id || null;
  }

  async findAll(projectIdParam?: string) {
    const resolvedProjId = await this.resolveProjectId(projectIdParam);
    const whereClause: any = {};
    if (resolvedProjId) whereClause.projectId = resolvedProjId;

    const units = await this.prisma.unit.findMany({
      where: whereClause,
      include: {
        sales: {
          where: { status: { not: "CANCELLED" } },
          include: {
            primaryClient: true,
            paymentPlan: true,
            paymentReceipts: true,
            scheduledObligations: true,
          },
        },
      },
      orderBy: { unitNumber: "asc" },
    });

    return {
      success: true,
      units,
    };
  }

  async create(body: any) {
    const { projectId: rawProjectId, units, unitNumber, type, price, areaM2, floor, status } = body;
    const projectId = await this.resolveProjectId(rawProjectId);

    if (!projectId) {
      throw new BadRequestException("Proyecto no encontrado");
    }

    // Bulk create
    if (Array.isArray(units) && units.length > 0) {
      for (const u of units) {
        const uNum = String(u.unit || u.unitNumber || "").trim();
        if (!uNum) continue;

        const uType = (u.type || "Departamento").toUpperCase() === "CASA" ? "HOUSE" : "APARTMENT";
        const uStatus =
          u.status === "VENDIDA" || u.status === "SOLD"
            ? "SOLD"
            : u.status === "BLOQUEADA" || u.status === "BLOCKED"
            ? "BLOCKED"
            : u.status === "APARTADA" || u.status === "RESERVED"
            ? "RESERVED"
            : "AVAILABLE";

        await this.prisma.unit.upsert({
          where: {
            projectId_unitNumber: {
              projectId,
              unitNumber: uNum,
            },
          },
          create: {
            projectId,
            unitNumber: uNum,
            category: uType as any,
            status: uStatus as any,
            basePrice: Number(u.price || 3500000),
            totalAreaM2: Number(u.areaM2 || u.area || 85),
            level: Number(u.floor || u.level || 1),
          },
          update: {
            category: uType as any,
            status: uStatus as any,
            basePrice: Number(u.price || 3500000),
            totalAreaM2: Number(u.areaM2 || u.area || 85),
            level: Number(u.floor || u.level || 1),
          },
        }).catch(() => {});
      }

      return {
        success: true,
        message: `Se sincronizaron ${units.length} unidades en Supabase.`,
      };
    }

    const cleanNum = String(unitNumber || "").trim();
    if (!cleanNum) {
      throw new BadRequestException("Número de unidad es requerido");
    }

    const singleType = (type || "Departamento").toUpperCase() === "CASA" ? "HOUSE" : "APARTMENT";
    const singleStatus =
      status === "VENDIDA" || status === "SOLD"
        ? "SOLD"
        : status === "BLOQUEADA" || status === "BLOCKED"
        ? "BLOCKED"
        : "AVAILABLE";

    const created = await this.prisma.unit.create({
      data: {
        projectId,
        unitNumber: cleanNum,
        category: singleType as any,
        status: singleStatus as any,
        basePrice: Number(price || 3500000),
        totalAreaM2: Number(areaM2 || 85),
        level: Number(floor || 1),
      },
    });

    return {
      success: true,
      unit: created,
    };
  }

  async update(body: any) {
    const { projectId: rawProjectId, unitNumber, unitId, status, price, areaM2, floor } = body;

    if (!unitNumber && !unitId) {
      throw new BadRequestException("unitNumber o unitId es requerido");
    }

    let targetUnit: any = null;
    if (unitId && isUuid(unitId)) {
      targetUnit = await this.prisma.unit.findUnique({ where: { id: unitId } });
    }

    const resolvedProjId = await this.resolveProjectId(rawProjectId);

    if (!targetUnit && resolvedProjId && unitNumber) {
      targetUnit = await this.prisma.unit.findFirst({
        where: {
          projectId: resolvedProjId,
          unitNumber: { equals: String(unitNumber).trim(), mode: "insensitive" },
        },
      });
    }

    if (!targetUnit && unitNumber) {
      targetUnit = await this.prisma.unit.findFirst({
        where: {
          unitNumber: { equals: String(unitNumber).trim(), mode: "insensitive" },
        },
      });
    }

    if (!targetUnit && unitNumber) {
      const cleanSearch = String(unitNumber).replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      const allUnits = await this.prisma.unit.findMany({
        where: resolvedProjId ? { projectId: resolvedProjId } : undefined,
      });
      targetUnit =
        allUnits.find((u: any) => {
          const cleanDb = u.unitNumber.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
          return (
            cleanDb === cleanSearch ||
            cleanDb.replace(/^0+/, "") === cleanSearch.replace(/^0+/, "") ||
            cleanDb === cleanSearch.replace(/^a0*/, "a") ||
            cleanSearch === cleanDb.replace(/^a0*/, "a")
          );
        }) || null;
    }

    if (!targetUnit) {
      throw new NotFoundException("Unidad no encontrada");
    }

    let mappedStatus: "AVAILABLE" | "SOLD" | "BLOCKED" | "RESERVED" = "AVAILABLE";
    if (status === "VENDIDA" || status === "SOLD") {
      mappedStatus = "SOLD";
    } else if (status === "BLOQUEADA" || status === "BLOCKED") {
      mappedStatus = "BLOCKED";
    } else if (status === "APARTADA" || status === "RESERVED") {
      mappedStatus = "RESERVED";
    } else {
      mappedStatus = "AVAILABLE";
    }

    const updateData: any = { status: mappedStatus };
    if (price !== undefined) updateData.basePrice = Number(price);
    if (areaM2 !== undefined) updateData.totalAreaM2 = Number(areaM2);
    if (floor !== undefined) updateData.level = Number(floor);

    await this.prisma.unit.update({
      where: { id: targetUnit.id },
      data: updateData,
    });

    if (mappedStatus === "AVAILABLE") {
      const salesToPurge = await this.prisma.sale.findMany({
        where: { unitId: targetUnit.id },
        select: { id: true },
      });

      if (salesToPurge.length > 0) {
        const saleIds = salesToPurge.map((s: any) => s.id);
        await this.prisma.paymentAllocation.deleteMany({
          where: { obligation: { saleId: { in: saleIds } } },
        }).catch(() => {});
        await this.prisma.paymentReceipt.deleteMany({
          where: { saleId: { in: saleIds } },
        }).catch(() => {});
        await this.prisma.scheduledObligation.deleteMany({
          where: { saleId: { in: saleIds } },
        }).catch(() => {});
        await this.prisma.paymentPlan.deleteMany({
          where: { saleId: { in: saleIds } },
        }).catch(() => {});
        await this.prisma.saleCoOwner.deleteMany({
          where: { saleId: { in: saleIds } },
        }).catch(() => {});
        await this.prisma.sale.deleteMany({
          where: { id: { in: saleIds } },
        }).catch(() => {});
      }
    }

    return {
      success: true,
      message: `Unidad ${unitNumber || unitId} actualizada a ${mappedStatus} y ventas sincronizadas.`,
      unit: targetUnit,
    };
  }

  async delete(id?: string, unitNumber?: string, projectIdParam?: string) {
    const resolvedProjId = await this.resolveProjectId(projectIdParam);
    let targetUnit = null;

    if (id && isUuid(id)) {
      targetUnit = await this.prisma.unit.findUnique({ where: { id } });
    } else if (unitNumber) {
      if (resolvedProjId) {
        targetUnit = await this.prisma.unit.findFirst({
          where: { projectId: resolvedProjId, unitNumber: String(unitNumber).trim() },
        });
      }
      if (!targetUnit) {
        targetUnit = await this.prisma.unit.findFirst({
          where: { unitNumber: String(unitNumber).trim() },
        });
      }
    }

    if (targetUnit) {
      await this.prisma.unit.delete({ where: { id: targetUnit.id } });
    }

    return {
      success: true,
      message: "Unidad eliminada de Supabase",
    };
  }
}
