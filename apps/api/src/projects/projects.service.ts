import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { randomUUID } from "crypto";

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(body: any) {
    const {
      name,
      type,
      developerId,
      developerName,
      userEmail,
      unitsInventory,
      units,
      image,
      coverImagePath,
      coverFileName,
    } = body;

    if (!name) {
      throw new BadRequestException("El nombre del proyecto es requerido.");
    }

    // 1. Dynamically resolve developerId
    let targetDevId: string | null = null;

    if (developerId && !developerId.startsWith("dev-") && developerId.length > 10) {
      const devById = await this.prisma.developer.findUnique({ where: { id: developerId } });
      if (devById) targetDevId = devById.id;
    }

    if (!targetDevId && userEmail) {
      const cleanUserEmail = userEmail.toLowerCase().trim();
      const devByUser = await this.prisma.developer.findFirst({
        where: {
          OR: [
            { email: cleanUserEmail },
            { memberships: { some: { user: { email: cleanUserEmail } } } },
          ],
        },
      });
      if (devByUser) targetDevId = devByUser.id;
    }

    if (!targetDevId && developerName && developerName !== "Mi Desarrolladora") {
      const devByName = await this.prisma.developer.findFirst({
        where: { name: { equals: developerName.trim(), mode: "insensitive" } },
      });
      if (devByName) targetDevId = devByName.id;
    }

    if (!targetDevId) {
      const firstDev = await this.prisma.developer.findFirst();
      if (firstDev) {
        targetDevId = firstDev.id;
      } else {
        const newDev = await this.prisma.developer.create({
          data: {
            id: randomUUID(),
            name: developerName || "Mi Desarrolladora",
            email: userEmail || "contacto@devio.mx",
          },
        });
        targetDevId = newDev.id;
      }
    }

    const projType = (type || "VERTICAL").toUpperCase() === "HORIZONTAL" ? "HORIZONTAL" : "VERTICAL";

    // 2. Create Project
    const project = await this.prisma.project.create({
      data: {
        id: randomUUID(),
        developerId: targetDevId,
        name: name.trim(),
        projectType: projType as any,
        status: "ACTIVE",
        coverImagePath: coverFileName || coverImagePath || image || null,
      },
    });

    // 3. Create Units if provided
    const unitsList = unitsInventory || units;
    if (Array.isArray(unitsList) && unitsList.length > 0) {
      await this.prisma.unit.createMany({
        data: unitsList.map((u: any, idx: number) => ({
          id: randomUUID(),
          projectId: project.id,
          unitNumber: String(u.unit || u.unitNumber || `U-${idx + 1}`),
          category: u.type === "Casa" ? "HOUSE" : "APARTMENT",
          status: u.status === "VENDIDA" ? "SOLD" : u.status === "BLOQUEADA" ? "BLOCKED" : "AVAILABLE",
          basePrice: Number(u.price) || 3500000,
          totalAreaM2: Number(u.areaM2 || u.area) || 85,
          level: Number(u.floor || u.level) || 1,
        })),
        skipDuplicates: true,
      });
    }

    return {
      success: true,
      project: {
        id: project.id,
        name: project.name,
        type: project.projectType,
        status: project.status,
      },
    };
  }

  async findAll(developerId?: string) {
    const where: any = {};
    if (developerId && !developerId.startsWith("dev-") && developerId.length > 10) {
      where.developerId = developerId;
    }

    const projects = await this.prisma.project.findMany({
      where,
      include: {
        units: true,
        sales: {
          include: {
            primaryClient: true,
            unit: true,
            paymentPlan: true,
            scheduledObligations: true,
            paymentReceipts: true,
          },
        },
        documents: true,
        additionals: true,
        constructionProgress: { orderBy: { progressDate: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      projects,
    };
  }

  async findById(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        units: true,
        sales: {
          include: {
            primaryClient: true,
            unit: true,
            paymentPlan: true,
            scheduledObligations: true,
            paymentReceipts: true,
          },
        },
        documents: true,
        additionals: true,
        constructionProgress: { orderBy: { progressDate: "desc" } },
      },
    });

    if (!project) {
      throw new NotFoundException(`Proyecto con ID ${id} no encontrado.`);
    }

    return {
      success: true,
      project,
    };
  }

  async update(id: string, body: any) {
    const { name, coverFileName, image, status, type, unitsInventory } = body;

    if (!id || id.startsWith("proj-")) {
      return { success: true, message: "Mock project updated" };
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (coverFileName || image) updateData.coverImagePath = coverFileName || image;
    if (status) updateData.status = status;
    if (type) updateData.projectType = type.toUpperCase() === "HORIZONTAL" ? "HORIZONTAL" : "VERTICAL";

    const updated = await this.prisma.project.update({
      where: { id },
      data: updateData,
    });

    if (Array.isArray(unitsInventory)) {
      for (const u of unitsInventory) {
        if (u.id && u.id.length > 10 && !u.id.startsWith("u-")) {
          await this.prisma.unit.update({
            where: { id: u.id },
            data: {
              unitNumber: String(u.unit),
              basePrice: Number(u.price) || 0,
              totalAreaM2: Number(u.areaM2 || u.area) || 0,
              status: u.status === "VENDIDA" ? "SOLD" : u.status === "BLOQUEADA" ? "BLOCKED" : "AVAILABLE",
            },
          }).catch(() => {});
        }
      }
    }

    return { success: true, project: updated };
  }

  async delete(id: string) {
    if (id && id.length > 10 && !id.startsWith("proj-")) {
      await this.prisma.project.delete({ where: { id } });
    }
    return { success: true };
  }
}
