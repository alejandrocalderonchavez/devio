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
      floorPlans,
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
    const resolvedCover =
      coverImagePath && (coverImagePath.startsWith("http") || coverImagePath.startsWith("data:") || coverImagePath.startsWith("/"))
        ? coverImagePath
        : image && (image.startsWith("http") || image.startsWith("data:") || image.startsWith("/"))
        ? image
        : coverFileName && (coverFileName.startsWith("http") || coverFileName.startsWith("data:") || coverFileName.startsWith("/"))
        ? coverFileName
        : null;

    const resolvedLogo =
      logoUrl && (logoUrl.startsWith("http") || logoUrl.startsWith("data:") || logoUrl.startsWith("/"))
        ? logoUrl
        : logo && (logo.startsWith("http") || logo.startsWith("data:") || logo.startsWith("/"))
        ? logo
        : logoPath && (logoPath.startsWith("http") || logoPath.startsWith("data:") || logoPath.startsWith("/"))
        ? logoPath
        : logoFileName && (logoFileName.startsWith("http") || logoFileName.startsWith("data:") || logoFileName.startsWith("/"))
        ? logoFileName
        : null;

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
        coverImagePath: resolvedCover,
        galleryPaths: resolvedLogo ? [resolvedLogo] : [],
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
              : u.type === "Oficina" || u.category === "OFFICE"
              ? "OFFICE"
              : "APARTMENT";

          const price = Number(u.price || u.basePrice) || 3500000;
          const area = Number(u.surfaceM2 || u.areaM2 || u.totalAreaM2 || u.area) || 85;
          const floor = u.floor != null ? Number(u.floor) : u.level != null ? Number(u.level) : 1;

          const bedrooms = u.bedrooms != null && !isNaN(Number(u.bedrooms)) ? parseInt(String(u.bedrooms), 10) : null;
          const bathrooms = u.bathrooms != null && !isNaN(Number(u.bathrooms)) ? parseFloat(String(u.bathrooms)) : null;
          const halfBathrooms = u.halfBathrooms != null && !isNaN(Number(u.halfBathrooms)) ? parseInt(String(u.halfBathrooms), 10) : null;
          const parkingSpaces = u.parkingSpots != null ? Number(u.parkingSpots) : u.parkingSpaces != null ? Number(u.parkingSpaces) : 0;
          const storageRooms = u.storageUnits != null ? Number(u.storageUnits) : u.storageRooms != null ? Number(u.storageRooms) : 0;

          const terraceAreaM2 = u.terraceAreaM2 != null ? Number(u.terraceAreaM2) : u.terraceM2 != null ? Number(u.terraceM2) : null;
          const gardenAreaM2 = u.gardenAreaM2 != null ? Number(u.gardenAreaM2) : u.gardenM2 != null ? Number(u.gardenM2) : null;
          const lotAreaM2 = u.lotAreaM2 != null ? Number(u.lotAreaM2) : u.lotM2 != null ? Number(u.lotM2) : null;
          const interiorAreaM2 = u.interiorAreaM2 != null ? Number(u.interiorAreaM2) : u.interiorM2 != null ? Number(u.interiorM2) : null;
          const constructionAreaM2 = u.constructionAreaM2 != null ? Number(u.constructionAreaM2) : u.constructionM2 != null ? Number(u.constructionM2) : u.constructionArea != null ? Number(u.constructionArea) : null;

          const blueprintUrl = u.blueprintUrl || u.floorPlan || null;
          const renderUrls = Array.isArray(u.renderUrls) ? u.renderUrls : Array.isArray(u.images) ? u.images : [];

          const customAttributes = {
            ...(typeof u.customAttributes === "object" && u.customAttributes ? u.customAttributes : {}),
            ...(u.deliveryDate ? { deliveryDate: u.deliveryDate } : {}),
            ...(u.orientation ? { orientation: u.orientation } : {}),
            ...(u.viewType ? { viewType: u.viewType } : {}),
          };

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
            bedrooms,
            bathrooms,
            halfBathrooms,
            parkingSpaces,
            storageRooms,
            terraceAreaM2,
            gardenAreaM2,
            lotAreaM2,
            interiorAreaM2,
            constructionAreaM2,
            blueprintUrl,
            renderUrls,
            customAttributes: Object.keys(customAttributes).length > 0 ? customAttributes : null,
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

    // 6. Create Floor Plans if provided
    const floorPlansList = Array.isArray(floorPlans) && floorPlans.length > 0 ? floorPlans : [];
    if (floorPlansList.length > 0) {
      const isUuidStr = (s?: string) => Boolean(s && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s));
      await this.prisma.document.createMany({
        data: floorPlansList.map((fp: any, idx: number) => ({
          id: fp.id && isUuidStr(fp.id) ? fp.id : randomUUID(),
          developerId: targetDevId,
          projectId: project.id,
          title: fp.name || `Planta de Conjunto ${idx + 1}`,
          type: "BLUEPRINT",
          storagePath: fp.imageUrl || fp.url || `/floor-plans/${project.id}/${idx + 1}.png`,
          fileSizeBytes: 1024,
          mimeType: "image/png",
          isClientVisible: true,
          metadata: {
            isFloorPlan: true,
            id: fp.id,
            name: fp.name,
            imageUrl: fp.imageUrl || fp.url,
          },
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
        units: {
          include: {
            priceHistory: { orderBy: { createdAt: "desc" } },
          },
        },
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
        documents: {
          include: {
            client: true,
            unit: true,
          },
        },
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
        units: {
          include: {
            priceHistory: { orderBy: { createdAt: "desc" } },
          },
        },
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
        documents: {
          include: {
            client: true,
            unit: true,
          },
        },
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
      legalName,
      description,
      googleMapsUrl,
      websiteUrl,
      totalSurfaceM2,
      estimatedDeliveryDate,
      addressLine1,
      address,
      neighborhood,
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
      floorPlans,
    } = body;

    if (!id || id.startsWith("proj-")) {
      return { success: true, message: "Mock project updated" };
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (legalName !== undefined) updateData.code = legalName ? legalName.trim() : null;
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (googleMapsUrl !== undefined || addressLine1 !== undefined || address !== undefined) {
      updateData.addressLine1 = googleMapsUrl || addressLine1 || address || null;
    }
    if (websiteUrl !== undefined) updateData.addressLine2 = websiteUrl || null;
    if (estimatedDeliveryDate !== undefined || neighborhood !== undefined) {
      updateData.neighborhood = estimatedDeliveryDate || neighborhood || null;
    }
    if (totalSurfaceM2 !== undefined) {
      updateData.postalCode = totalSurfaceM2 ? String(totalSurfaceM2) : null;
    }
    if (coverFileName || coverImagePath || image) {
      const resolvedCover =
        coverImagePath && (coverImagePath.startsWith("http") || coverImagePath.startsWith("data:") || coverImagePath.startsWith("/"))
          ? coverImagePath
          : image && (image.startsWith("http") || image.startsWith("data:") || image.startsWith("/"))
          ? image
          : coverFileName && (coverFileName.startsWith("http") || coverFileName.startsWith("data:") || coverFileName.startsWith("/"))
          ? coverFileName
          : null;
      if (resolvedCover) updateData.coverImagePath = resolvedCover;
    }
    if (logoUrl || logo || logoPath || logoFileName) {
      const resolvedLogo =
        logoUrl && (logoUrl.startsWith("http") || logoUrl.startsWith("data:") || logoUrl.startsWith("/"))
          ? logoUrl
          : logo && (logo.startsWith("http") || logo.startsWith("data:") || logo.startsWith("/"))
          ? logo
          : logoPath && (logoPath.startsWith("http") || logoPath.startsWith("data:") || logoPath.startsWith("/"))
          ? logoPath
          : logoFileName && (logoFileName.startsWith("http") || logoFileName.startsWith("data:") || logoFileName.startsWith("/"))
          ? logoFileName
          : null;
      if (resolvedLogo) updateData.galleryPaths = [resolvedLogo];
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

    if (Array.isArray(floorPlans)) {
      const isUuidStr = (s?: string) => Boolean(s && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s));
      // Replace existing floor plan documents for this project
      await this.prisma.document.deleteMany({
        where: {
          projectId: id,
          type: "BLUEPRINT",
        },
      }).catch(() => {});

      if (floorPlans.length > 0) {
        await this.prisma.document.createMany({
          data: floorPlans.map((fp: any, idx: number) => ({
            id: fp.id && isUuidStr(fp.id) ? fp.id : randomUUID(),
            developerId: updated.developerId,
            projectId: id,
            title: fp.name || `Planta de Conjunto ${idx + 1}`,
            type: "BLUEPRINT",
            storagePath: fp.imageUrl || fp.url || `/floor-plans/${id}/${idx + 1}.png`,
            fileSizeBytes: 1024,
            mimeType: "image/png",
            isClientVisible: true,
            metadata: {
              isFloorPlan: true,
              id: fp.id,
              name: fp.name,
              imageUrl: fp.imageUrl || fp.url,
            },
          })),
          skipDuplicates: true,
        }).catch(() => {});
      }
    }

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
