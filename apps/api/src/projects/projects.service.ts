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
      currency,
      addressLine1,
      address,
      neighborhood,
      city,
      state,
      postalCode,
      zipCode,
      developerId,
      developerName,
      userEmail,
      unitsInventory,
      units,
      additionals,
      documents,
      projectDocuments,
      image,
      coverImagePath,
      coverFileName,
      logo,
      logoUrl,
      logoPath,
      logoFileName,
      description,
      googleMapsUrl,
      websiteUrl,
      totalSurfaceM2,
      estimatedDeliveryDate,
      legalName,
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

    const projType =
      (type || "VERTICAL").toUpperCase() === "HORIZONTAL"
        ? "HORIZONTAL"
        : (type || "VERTICAL").toUpperCase() === "COMMERCIAL"
        ? "COMMERCIAL"
        : (type || "VERTICAL").toUpperCase() === "INDUSTRIAL"
        ? "INDUSTRIAL"
        : (type || "VERTICAL").toUpperCase() === "MIXED"
        ? "MIXED"
        : "VERTICAL";

    const baseCurr = (currency || "MXN").toUpperCase() === "USD" ? "USD" : "MXN";

    // 2. Create Project
    const project = await this.prisma.project.create({
      data: {
        id: randomUUID(),
        developerId: targetDevId,
        name: name.trim(),
        description: description || null,
        projectType: projType as any,
        baseCurrency: baseCurr as any,
        status: "ACTIVE",
        addressLine1: googleMapsUrl || addressLine1 || address || null,
        addressLine2: websiteUrl || null,
        neighborhood: neighborhood || null,
        city: city || null,
        state: state || null,
        postalCode: postalCode || zipCode || (totalSurfaceM2 ? String(totalSurfaceM2) : null),
        coverImagePath: coverFileName || coverImagePath || image || null,
        galleryPaths: logoUrl || logo || logoPath || logoFileName ? [logoUrl || logo || logoPath || logoFileName] : [],
      },
    });

    // 3. Create Units if provided
    const unitsList = Array.isArray(units) && units.length > 0 ? units : Array.isArray(unitsInventory) ? unitsInventory : [];
    if (unitsList.length > 0) {
      await this.prisma.unit.createMany({
        data: unitsList.map((u: any, idx: number) => {
          const uNum = String(u.unitNumber || u.unit || `U-${idx + 1}`).trim();
          const uStatus =
            u.status?.toUpperCase() === "VENDIDA" || u.status?.toUpperCase() === "SOLD"
              ? "SOLD"
              : u.status?.toUpperCase() === "BLOQUEADA" || u.status?.toUpperCase() === "BLOCKED"
              ? "BLOCKED"
              : u.status?.toUpperCase() === "APARTADA" || u.status?.toUpperCase() === "RESERVED"
              ? "RESERVED"
              : "AVAILABLE";

          const uCategory =
            u.type === "Casa" || u.category === "HOUSE"
              ? "HOUSE"
              : u.type === "Local" || u.category === "COMMERCIAL_SPACE"
              ? "COMMERCIAL_SPACE"
              : u.type === "Bodega" || u.category === "INDUSTRIAL_WAREHOUSE"
              ? "INDUSTRIAL_WAREHOUSE"
              : u.type === "Terreno" || u.category === "LAND_LOT"
              ? "LAND_LOT"
              : "APARTMENT";

          const price = Number(u.price || u.basePrice) || 3500000;
          const area = Number(u.surfaceM2 || u.areaM2 || u.totalAreaM2 || u.area) || 85;
          const floor = Number(u.level || u.floor) || 1;

          return {
            id: randomUUID(),
            projectId: project.id,
            unitNumber: uNum,
            category: uCategory as any,
            status: uStatus as any,
            basePrice: price,
            totalAreaM2: area,
            level: floor,
            currency: baseCurr as any,
          };
        }),
        skipDuplicates: true,
      });
    }

    // 4. Create Additionals if provided
    if (Array.isArray(additionals) && additionals.length > 0) {
      await this.prisma.unitAdditional.createMany({
        data: additionals.map((a: any, idx: number) => {
          const aType =
            a.type === "Estacionamiento" || a.category === "estacionamiento"
              ? "PARKING"
              : a.type === "Bodega" || a.category === "bodega"
              ? "STORAGE"
              : a.type === "Roof Garden" || a.category === "terraza"
              ? "ROOF_GARDEN"
              : a.type === "Alberca"
              ? "PRIVATE_POOL"
              : "OTHER";

          const aStatus =
            a.status?.toUpperCase() === "VENDIDO"
              ? "SOLD"
              : a.status?.toUpperCase() === "ASIGNADO"
              ? "RESERVED"
              : "AVAILABLE";

          return {
            id: randomUUID(),
            projectId: project.id,
            name: a.name || `Adicional ${idx + 1}`,
            type: aType as any,
            status: aStatus as any,
            price: Number(a.price) || 0,
            currency: baseCurr as any,
          };
        }),
        skipDuplicates: true,
      });
    }

    // 5. Create Documents if provided
    const docsList = Array.isArray(documents) && documents.length > 0 ? documents : Array.isArray(projectDocuments) ? projectDocuments : [];
    if (docsList.length > 0) {
      await this.prisma.document.createMany({
        data: docsList.map((d: any, idx: number) => {
          const rawType = String(d.type || d.category || "OTHER").toUpperCase();
          let docType: "QUOTE" | "RECEIPT" | "STATEMENT" | "CONTRACT" | "OTHER" = "OTHER";

          if (rawType.includes("QUOTE") || rawType.includes("COTIZACION")) {
            docType = "QUOTE";
          } else if (rawType.includes("RECEIPT") || rawType.includes("RECIBO")) {
            docType = "RECEIPT";
          } else if (rawType.includes("STATEMENT") || rawType.includes("ESTADO_CUENTA")) {
            docType = "STATEMENT";
          } else if (rawType.includes("CONTRACT") || rawType.includes("CONTRATO") || rawType.includes("LEGAL")) {
            docType = "CONTRACT";
          }

          const storagePath = d.url || d.fileDataUrl || d.filePath || d.fileName || `/documents/${project.id}/${idx + 1}.pdf`;

          return {
            id: randomUUID(),
            developerId: targetDevId,
            projectId: project.id,
            title: d.title || d.name || `Documento ${idx + 1}`,
            type: docType as any,
            storagePath,
            fileSizeBytes: Number(d.fileSizeBytes || (typeof d.fileSize === "number" ? d.fileSize : 1024)),
            mimeType: d.mimeType || "application/pdf",
            isClientVisible: d.isClientVisible !== false,
          };
        }),
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
            coOwners: { include: { client: true } },
            scheduledObligations: { orderBy: { obligationNumber: "asc" } },
            paymentReceipts: { orderBy: { paymentDate: "desc" } },
          },
        },
        documents: true,
        additionals: {
          include: {
            unit: true,
          },
        },
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
            coOwners: { include: { client: true } },
            scheduledObligations: { orderBy: { obligationNumber: "asc" } },
            paymentReceipts: { orderBy: { paymentDate: "desc" } },
          },
        },
        documents: true,
        additionals: {
          include: {
            unit: true,
          },
        },
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
    const {
      name,
      description,
      googleMapsUrl,
      websiteUrl,
      totalSurfaceM2,
      addressLine1,
      address,
      coverFileName,
      coverImagePath,
      image,
      logo,
      logoUrl,
      logoPath,
      logoFileName,
      status,
      type,
      currency,
      baseCurrency,
      unitsInventory,
    } = body;

    if (!id || id.startsWith("proj-")) {
      return { success: true, message: "Mock project updated" };
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (googleMapsUrl || addressLine1 || address) updateData.addressLine1 = googleMapsUrl || addressLine1 || address;
    if (websiteUrl !== undefined) updateData.addressLine2 = websiteUrl;
    if (totalSurfaceM2 !== undefined) updateData.postalCode = totalSurfaceM2 ? String(totalSurfaceM2) : null;
    if (coverFileName || coverImagePath || image) updateData.coverImagePath = coverFileName || coverImagePath || image;
    if (logoUrl || logo || logoPath || logoFileName) {
      updateData.galleryPaths = [logoUrl || logo || logoPath || logoFileName];
    }
    if (status) updateData.status = status;
    if (type) {
      updateData.projectType =
        type.toUpperCase() === "HORIZONTAL"
          ? "HORIZONTAL"
          : type.toUpperCase() === "COMMERCIAL"
          ? "COMMERCIAL"
          : type.toUpperCase() === "INDUSTRIAL"
          ? "INDUSTRIAL"
          : type.toUpperCase() === "MIXED"
          ? "MIXED"
          : "VERTICAL";
    }
    if (currency || baseCurrency) {
      updateData.baseCurrency = (currency || baseCurrency).toUpperCase() === "USD" ? "USD" : "MXN";
    }

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
