import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { randomUUID } from "crypto";

@Injectable()
export class AdditionalsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(projectId?: string) {
    const whereClause: any = {};
    if (projectId) whereClause.projectId = projectId;

    const additionals = await this.prisma.unitAdditional.findMany({
      where: whereClause,
      include: {
        unit: true,
        project: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      additionals,
    };
  }

  async create(body: any) {
    const { projectId, additionals, name, type, price, status, unitId } = body;

    if (!projectId) {
      throw new BadRequestException("projectId es requerido");
    }

    if (Array.isArray(additionals) && additionals.length > 0) {
      for (const item of additionals) {
        const itemType = String(item.type || item.category || "PARKING").toUpperCase();
        const validItemType: "PARKING" | "STORAGE" | "OTHER" =
          itemType.includes("ESTACIONAMIENTO") || itemType.includes("PARKING") || itemType.includes("CAJON")
            ? "PARKING"
            : itemType.includes("BODEGA") || itemType.includes("STORAGE")
            ? "STORAGE"
            : "OTHER";

        const itemStatus: "AVAILABLE" | "ASSIGNED" | "SOLD" =
          item.status === "VENDIDO" || item.status === "SOLD"
            ? "SOLD"
            : item.status === "ASIGNADO" || item.status === "ASSIGNED"
            ? "ASSIGNED"
            : "AVAILABLE";

        if (item.id && !item.id.startsWith("add-") && item.id.length > 10) {
          await this.prisma.unitAdditional.upsert({
            where: { id: item.id },
            create: {
              id: item.id,
              projectId,
              name: item.name || "Adicional",
              type: validItemType,
              status: itemStatus,
              price: Number(item.price || 0),
            },
            update: {
              name: item.name || "Adicional",
              type: validItemType,
              status: itemStatus,
              price: Number(item.price || 0),
            },
          }).catch(() => {});
        } else {
          await this.prisma.unitAdditional.create({
            data: {
              id: randomUUID(),
              projectId,
              name: item.name || "Adicional",
              type: validItemType,
              status: itemStatus,
              price: Number(item.price || 0),
            },
          }).catch(() => {});
        }
      }

      return {
        success: true,
        message: `Se sincronizaron ${additionals.length} adicionales en Supabase.`,
      };
    }

    const singleType = String(type || "PARKING").toUpperCase();
    const validSingleType: "PARKING" | "STORAGE" | "OTHER" =
      singleType.includes("ESTACIONAMIENTO") || singleType.includes("PARKING") || singleType.includes("CAJON")
        ? "PARKING"
        : singleType.includes("BODEGA") || singleType.includes("STORAGE")
        ? "STORAGE"
        : "OTHER";

    const created = await this.prisma.unitAdditional.create({
      data: {
        id: randomUUID(),
        projectId,
        unitId: unitId || null,
        name: name || "Nuevo Adicional",
        type: validSingleType,
        status: status === "VENDIDO" || status === "SOLD" ? "SOLD" : "AVAILABLE",
        price: Number(price || 0),
      },
    });

    return {
      success: true,
      additional: created,
    };
  }

  async delete(id: string) {
    if (!id) {
      throw new BadRequestException("ID de adicional es requerido");
    }

    await this.prisma.unitAdditional.delete({ where: { id } }).catch(() => {});

    return {
      success: true,
      message: "Adicional eliminado de Supabase",
    };
  }
}
