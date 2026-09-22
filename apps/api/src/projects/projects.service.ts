import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { randomUUID } from "crypto";

export interface CreateProjectFullPayloadDto {
  developerId?: string;
  developerName?: string;
  name: string;
  code?: string;
  description?: string;
  projectType: "VERTICAL" | "HORIZONTAL" | "COMMERCIAL" | "INDUSTRIAL" | "MIXED";
  baseCurrency?: "MXN" | "USD";
  defaultLanguage?: "ES" | "EN";
  coverImagePath?: string;
  galleryPaths?: string[];
  units?: Array<{
    unitNumber: string;
    totalAreaM2: number;
    basePrice: number;
    status?: "AVAILABLE" | "RESERVED" | "SOLD" | "BLOCKED";
    category?: "APARTMENT" | "HOUSE" | "COMMERCIAL_SPACE" | "INDUSTRIAL_WAREHOUSE" | "LAND_LOT" | "OFFICE" | "OTHER";
    level?: number;
    tower?: string;
    bedrooms?: number;
    bathrooms?: number;
    parkingSpaces?: number;
    customAttributes?: Record<string, any>;
  }>;
  additionals?: Array<{
    name: string;
    type?: "PARKING" | "STORAGE" | "OTHER";
    price: number;
    status?: "AVAILABLE" | "ASSIGNED" | "SOLD";
    notes?: string;
  }>;
  documents?: Array<{
    title: string;
    type?: "QUOTE" | "RECEIPT" | "STATEMENT" | "CONTRACT" | "OTHER";
    storagePath: string;
    fileSizeBytes?: number;
  }>;
}

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProjectFullPayloadDto) {
    const projectId = randomUUID();

    return this.prisma.$transaction(async (tx: any) => {
      // 1. Obtener o asegurar desarrolladora
      let targetDeveloperId = dto.developerId;
      if (!targetDeveloperId) {
        const firstDev = await tx.developer.findFirst({
          orderBy: { createdAt: "desc" },
        });
        if (firstDev) {
          targetDeveloperId = firstDev.id;
        } else {
          const newDev = await tx.developer.create({
            data: {
              id: randomUUID(),
              name: dto.developerName || "Desarrolladora Principal",
              legalName: dto.developerName || "Desarrolladora Principal S.A. de C.V.",
            },
          });
          targetDeveloperId = newDev.id;
        }
      }

      // 2. Crear Proyecto
      const project = await tx.project.create({
        data: {
          id: projectId,
          developerId: targetDeveloperId,
          name: dto.name,
          code: dto.code || null,
          description: dto.description || null,
          projectType: dto.projectType || "VERTICAL",
          status: "ACTIVE",
          baseCurrency: dto.baseCurrency || "MXN",
          defaultLanguage: dto.defaultLanguage || "ES",
          coverImagePath: dto.coverImagePath || null,
          galleryPaths: dto.galleryPaths || [],
        },
      });

      // 3. Crear Unidades en lote
      if (dto.units && dto.units.length > 0) {
        await tx.unit.createMany({
          data: dto.units.map((u) => ({
            id: randomUUID(),
            projectId: project.id,
            unitNumber: u.unitNumber,
            basePrice: u.basePrice,
            currency: dto.baseCurrency || "MXN",
            totalAreaM2: u.totalAreaM2,
            status: u.status || "AVAILABLE",
            category: u.category || "APARTMENT",
            level: u.level || null,
            tower: u.tower || null,
            bedrooms: u.bedrooms || null,
            bathrooms: u.bathrooms || null,
            parkingSpaces: u.parkingSpaces || 0,
            customAttributes: u.customAttributes || {},
          })),
        });
      }

      // 4. Crear Adicionales en lote
      if (dto.additionals && dto.additionals.length > 0) {
        await tx.unitAdditional.createMany({
          data: dto.additionals.map((add) => ({
            id: randomUUID(),
            projectId: project.id,
            name: add.name,
            type: add.type || "PARKING",
            price: add.price,
            currency: dto.baseCurrency || "MXN",
            status: add.status || "AVAILABLE",
          })),
        });
      }

      // 5. Crear Documentos iniciales
      if (dto.documents && dto.documents.length > 0) {
        for (const doc of dto.documents) {
          await tx.document.create({
            data: {
              id: randomUUID(),
              developerId: targetDeveloperId,
              projectId: project.id,
              title: doc.title,
              type: doc.type || "CONTRACT",
              storagePath: doc.storagePath,
              fileSizeBytes: doc.fileSizeBytes || 0,
            },
          });
        }
      }

      return project;
    });
  }

  async findAll(developerId?: string) {
    const where = developerId ? { developerId } : {};

    const projects = await this.prisma.project.findMany({
      where,
      include: {
        units: {
          select: {
            id: true,
            status: true,
            basePrice: true,
          },
        },
        additionals: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return projects.map((p: any) => {
      const totalUnits = p.units.length;
      const availableUnits = p.units.filter((u: any) => u.status === "AVAILABLE").length;
      const reservedUnits = p.units.filter((u: any) => u.status === "RESERVED").length;
      const soldUnits = p.units.filter((u: any) => u.status === "SOLD").length;
      const blockedUnits = p.units.filter((u: any) => u.status === "BLOCKED").length;

      const prices = p.units.map((u: any) => Number(u.basePrice)).filter((price: number) => price > 0);
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

      return {
        id: p.id,
        developerId: p.developerId,
        name: p.name,
        code: p.code,
        projectType: p.projectType,
        status: p.status,
        baseCurrency: p.baseCurrency,
        coverImagePath: p.coverImagePath,
        totalUnits,
        availableUnits,
        reservedUnits,
        soldUnits,
        blockedUnits,
        minPrice,
        maxPrice,
      };
    });
  }

  async findById(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        developer: true,
        units: {
          orderBy: { unitNumber: "asc" },
        },
        additionals: true,
        documents: true,
      },
    });

    if (!project) {
      throw new NotFoundException(`Proyecto con ID ${id} no encontrado.`);
    }

    return project;
  }
}
