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
      const existingInDb = await this.prisma.unitAdditional.findMany({
        where: { projectId },
      });

      const processedIds = new Set<string>();

      for (const item of additionals) {
        const itemType = String(item.type || item.category || "PARKING").toUpperCase();
        const validItemType: "PARKING" | "STORAGE" | "OTHER" =
          itemType.includes("ESTACIONAMIENTO") || itemType.includes("PARKING") || itemType.includes("CAJON")
            ? "PARKING"
            : itemType.includes("BODEGA") || itemType.includes("STORAGE")
            ? "STORAGE"
            : "OTHER";

        const itemStatus: "AVAILABLE" | "ASSIGNED" | "SOLD" =
          item.status === "VENDIDO" || item.status === "SOLD" || item.status === "ASIGNADO" || item.status === "ASSIGNED"
            ? "SOLD"
            : "AVAILABLE";

        const cleanName = String(item.name || "Adicional").trim();

        // 1. Try finding by ID
        let matched = existingInDb.find((e) => e.id === item.id);
        // 2. If not found by ID, try matching by clean name + type
        if (!matched) {
          matched = existingInDb.find(
            (e) => !processedIds.has(e.id) && e.name.trim().toLowerCase() === cleanName.toLowerCase() && e.type === validItemType
          );
        }

        if (matched) {
          processedIds.add(matched.id);
          await this.prisma.unitAdditional.update({
            where: { id: matched.id },
            data: {
              name: cleanName,
              type: validItemType,
              status: itemStatus,
              price: Number(item.price || 0),
            },
          }).catch(() => {});
        } else {
          const newId = (item.id && item.id.length === 36 && !item.id.startsWith("add-")) ? item.id : randomUUID();
          const created = await this.prisma.unitAdditional.create({
            data: {
              id: newId,
              projectId,
              name: cleanName,
              type: validItemType,
              status: itemStatus,
              price: Number(item.price || 0),
            },
          }).catch(() => null);
          if (created) processedIds.add(created.id);
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
