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
        priceHistory: {
          orderBy: { createdAt: "desc" },
        },
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
      const mapCategory = (raw?: string): any => {
        const norm = String(raw || "").toUpperCase().trim();
        if (norm.includes("CASA") || norm.includes("HOUSE") || norm.includes("TOWNHOUSE")) return "HOUSE";
        if (norm.includes("LOCAL") || norm.includes("COMMERCIAL")) return "COMMERCIAL_SPACE";
        if (norm.includes("BODEGA") || norm.includes("WAREHOUSE") || norm.includes("INDUSTRIAL")) return "INDUSTRIAL_WAREHOUSE";
        if (norm.includes("LOTE") || norm.includes("TERRENO") || norm.includes("LAND")) return "LAND_LOT";
        if (norm.includes("OFICINA") || norm.includes("OFFICE")) return "OFFICE";
        return "APARTMENT";
      };

      for (const u of units) {
        const uNum = String(u.unit || u.unitNumber || "").trim();
        if (!uNum) continue;

        const uType = mapCategory(u.type || u.category);
        const uStatus =
          u.status === "VENDIDA" || u.status === "SOLD"
            ? "SOLD"
            : u.status === "BLOQUEADA" || u.status === "BLOCKED"
            ? "BLOCKED"
            : u.status === "APARTADA" || u.status === "RESERVED"
            ? "RESERVED"
            : "AVAILABLE";

        const bedroomsVal = u.bedrooms !== undefined && u.bedrooms !== null && !isNaN(Number(u.bedrooms)) ? parseInt(String(u.bedrooms), 10) : undefined;
        const bathroomsVal = u.bathrooms !== undefined && u.bathrooms !== null && !isNaN(Number(u.bathrooms)) ? parseFloat(String(u.bathrooms)) : undefined;
        const halfBathroomsVal = u.halfBathrooms !== undefined && u.halfBathrooms !== null && !isNaN(Number(u.halfBathrooms)) ? parseInt(String(u.halfBathrooms), 10) : undefined;
        const parkingVal = Number(u.parkingSpots || u.parkingSpaces || 0);
        const storageVal = Number(u.storageUnits || u.storageRooms || 0);
        const terraceVal = u.terraceAreaM2 !== undefined && u.terraceAreaM2 !== null ? Number(u.terraceAreaM2) : u.terraceM2 !== undefined && u.terraceM2 !== null ? Number(u.terraceM2) : undefined;
        const gardenVal = u.gardenAreaM2 !== undefined && u.gardenAreaM2 !== null ? Number(u.gardenAreaM2) : u.gardenM2 !== undefined && u.gardenM2 !== null ? Number(u.gardenM2) : undefined;
        const lotVal = u.lotAreaM2 !== undefined && u.lotAreaM2 !== null ? Number(u.lotAreaM2) : u.lotM2 !== undefined && u.lotM2 !== null ? Number(u.lotM2) : undefined;
        const interiorVal = u.interiorAreaM2 !== undefined && u.interiorAreaM2 !== null ? Number(u.interiorAreaM2) : u.interiorM2 !== undefined && u.interiorM2 !== null ? Number(u.interiorM2) : undefined;
        const constVal = u.constructionAreaM2 !== undefined && u.constructionAreaM2 !== null ? Number(u.constructionAreaM2) : u.constructionM2 !== undefined && u.constructionM2 !== null ? Number(u.constructionM2) : u.constructionArea !== undefined && u.constructionArea !== null ? Number(u.constructionArea) : undefined;
        const blueprintUrl = u.blueprintUrl || u.floorPlan || undefined;
        const renderUrls = Array.isArray(u.renderUrls) ? u.renderUrls : Array.isArray(u.images) ? u.images : [];
        const tower = u.tower || u.torre || undefined;
        const zone = u.zone || u.zona || undefined;

        const customAttrs = {
          ...(typeof u.customAttributes === "object" && u.customAttributes ? u.customAttributes : {}),
          ...(u.deliveryDate ? { deliveryDate: u.deliveryDate } : {}),
          ...(u.orientation ? { orientation: u.orientation } : {}),
          ...(u.viewType ? { viewType: u.viewType } : {}),
        };

        const unitData: any = {
          category: uType,
          status: uStatus,
          basePrice: Number(u.price || 3500000),
          totalAreaM2: Number(u.areaM2 || u.area || 85),
          level: Number(u.floor || u.level || 1),
          ...(bedroomsVal !== undefined ? { bedrooms: bedroomsVal } : {}),
          ...(bathroomsVal !== undefined ? { bathrooms: bathroomsVal } : {}),
          ...(halfBathroomsVal !== undefined ? { halfBathrooms: halfBathroomsVal } : {}),
          parkingSpaces: parkingVal,
          storageRooms: storageVal,
          ...(terraceVal !== undefined ? { terraceAreaM2: terraceVal } : {}),
          ...(gardenVal !== undefined ? { gardenAreaM2: gardenVal } : {}),
          ...(lotVal !== undefined ? { lotAreaM2: lotVal } : {}),
          ...(interiorVal !== undefined ? { interiorAreaM2: interiorVal } : {}),
          ...(constVal !== undefined ? { constructionAreaM2: constVal } : {}),
          ...(blueprintUrl ? { blueprintUrl } : {}),
          ...(renderUrls.length > 0 ? { renderUrls } : {}),
          ...(tower ? { tower } : {}),
          ...(zone ? { zone } : {}),
          customAttributes: Object.keys(customAttrs).length > 0 ? customAttrs : undefined,
        };

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
            ...unitData,
          },
          update: unitData,
        }).catch((err) => console.warn(`Error upserting unit ${uNum}:`, err));
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

    const mapSingleCategory = (raw?: string): any => {
      const norm = String(raw || "").toUpperCase().trim();
      if (norm.includes("CASA") || norm.includes("HOUSE") || norm.includes("TOWNHOUSE")) return "HOUSE";
      if (norm.includes("LOCAL") || norm.includes("COMMERCIAL")) return "COMMERCIAL_SPACE";
      if (norm.includes("BODEGA") || norm.includes("WAREHOUSE") || norm.includes("INDUSTRIAL")) return "INDUSTRIAL_WAREHOUSE";
      if (norm.includes("LOTE") || norm.includes("TERRENO") || norm.includes("LAND")) return "LAND_LOT";
      if (norm.includes("OFICINA") || norm.includes("OFFICE")) return "OFFICE";
      return "APARTMENT";
    };

    const singleType = mapSingleCategory(type);
    const singleStatus =
      status === "VENDIDA" || status === "SOLD"
        ? "SOLD"
        : status === "BLOQUEADA" || status === "BLOCKED"
        ? "BLOCKED"
        : "AVAILABLE";

    const singleBed = body.bedrooms != null && !isNaN(Number(body.bedrooms)) ? parseInt(String(body.bedrooms), 10) : null;
    const singleBath = body.bathrooms != null && !isNaN(Number(body.bathrooms)) ? parseFloat(String(body.bathrooms)) : null;
    const singlePark = Number(body.parkingSpots || body.parkingSpaces || 0);
    const singleStor = Number(body.storageUnits || body.storageRooms || 0);
    const singleTerrace = body.terraceAreaM2 != null ? Number(body.terraceAreaM2) : body.terraceM2 != null ? Number(body.terraceM2) : null;
    const singleGarden = body.gardenAreaM2 != null ? Number(body.gardenAreaM2) : body.gardenM2 != null ? Number(body.gardenM2) : null;
    const singleLot = body.lotAreaM2 != null ? Number(body.lotAreaM2) : body.lotM2 != null ? Number(body.lotM2) : null;
    const singleInterior = body.interiorAreaM2 != null ? Number(body.interiorAreaM2) : body.interiorM2 != null ? Number(body.interiorM2) : null;
    const singleConst = body.constructionAreaM2 != null ? Number(body.constructionAreaM2) : body.constructionM2 != null ? Number(body.constructionM2) : body.constructionArea != null ? Number(body.constructionArea) : null;
    const singleBlueprint = body.blueprintUrl || body.floorPlan || null;
    const singleRenders = Array.isArray(body.renderUrls) ? body.renderUrls : Array.isArray(body.images) ? body.images : [];

    const created = await this.prisma.unit.create({
      data: {
        projectId,
        unitNumber: cleanNum,
        category: singleType as any,
        status: singleStatus as any,
        basePrice: Number(price || 3500000),
        totalAreaM2: Number(areaM2 || 85),
        level: Number(floor || 1),
        bedrooms: singleBed,
        bathrooms: singleBath,
        parkingSpaces: singlePark,
        storageRooms: singleStor,
        terraceAreaM2: singleTerrace,
        gardenAreaM2: singleGarden,
        lotAreaM2: singleLot,
        interiorAreaM2: singleInterior,
        constructionAreaM2: singleConst,
        blueprintUrl: singleBlueprint,
        renderUrls: singleRenders,
        customAttributes: body.customAttributes || (body.deliveryDate ? { deliveryDate: body.deliveryDate } : null),
      },
    });

    return {
      success: true,
      unit: created,
    };
  }

  async update(body: any) {
    const {
      projectId: rawProjectId,
      unitNumber,
      unitId,
      status,
      price,
      areaM2,
      floor,
      previousPrice,
      reason,
      priceHistory,
      userId,
      bedrooms,
      bathrooms,
      parkingSpots,
      parkingSpaces,
      storageUnits,
      storageRooms,
      terraceAreaM2,
      terraceM2,
      gardenAreaM2,
      gardenM2,
      lotAreaM2,
      lotM2,
      interiorAreaM2,
      interiorM2,
      constructionAreaM2,
      constructionM2,
      constructionArea,
      blueprintUrl,
      floorPlan,
      renderUrls,
      images,
      customAttributes,
    } = body;

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
    if (bedrooms !== undefined) updateData.bedrooms = bedrooms != null && !isNaN(Number(bedrooms)) ? parseInt(String(bedrooms), 10) : null;
    if (bathrooms !== undefined) updateData.bathrooms = bathrooms != null && !isNaN(Number(bathrooms)) ? parseFloat(String(bathrooms)) : null;
    if (parkingSpots !== undefined || parkingSpaces !== undefined) updateData.parkingSpaces = Number(parkingSpots ?? parkingSpaces ?? 0);
    if (storageUnits !== undefined || storageRooms !== undefined) updateData.storageRooms = Number(storageUnits ?? storageRooms ?? 0);
    if (terraceAreaM2 !== undefined || terraceM2 !== undefined) updateData.terraceAreaM2 = terraceAreaM2 != null ? Number(terraceAreaM2) : terraceM2 != null ? Number(terraceM2) : null;
    if (gardenAreaM2 !== undefined || gardenM2 !== undefined) updateData.gardenAreaM2 = gardenAreaM2 != null ? Number(gardenAreaM2) : gardenM2 != null ? Number(gardenM2) : null;
    if (lotAreaM2 !== undefined || lotM2 !== undefined) updateData.lotAreaM2 = lotAreaM2 != null ? Number(lotAreaM2) : lotM2 != null ? Number(lotM2) : null;
    if (interiorAreaM2 !== undefined || interiorM2 !== undefined) updateData.interiorAreaM2 = interiorAreaM2 != null ? Number(interiorAreaM2) : interiorM2 != null ? Number(interiorM2) : null;
    if (constructionAreaM2 !== undefined || constructionM2 !== undefined || constructionArea !== undefined) {
      updateData.constructionAreaM2 = constructionAreaM2 != null ? Number(constructionAreaM2) : constructionM2 != null ? Number(constructionM2) : constructionArea != null ? Number(constructionArea) : null;
    }
    if (blueprintUrl !== undefined || floorPlan !== undefined) updateData.blueprintUrl = blueprintUrl || floorPlan || null;
    if (renderUrls !== undefined || images !== undefined) updateData.renderUrls = Array.isArray(renderUrls) ? renderUrls : Array.isArray(images) ? images : [];
    if (customAttributes !== undefined || priceHistory) {
      updateData.customAttributes = {
        ...((targetUnit.customAttributes as object) || {}),
        ...(customAttributes || {}),
        ...(priceHistory ? { priceHistory } : {}),
      };
    }

    await this.prisma.unit.update({
      where: { id: targetUnit.id },
      data: updateData,
    });

    // Record in PriceHistory table if price changed
    const oldPriceNum = previousPrice !== undefined ? Number(previousPrice) : Number(targetUnit.basePrice);
    const newPriceNum = price !== undefined ? Number(price) : Number(targetUnit.basePrice);
    if (price !== undefined && oldPriceNum !== newPriceNum) {
      const historyReason =
        reason ||
        (Array.isArray(priceHistory) && priceHistory[0]?.reason) ||
        "Ajuste de precio";
      await this.prisma.priceHistory
        .create({
          data: {
            unitId: targetUnit.id,
            previousPrice: oldPriceNum,
            newPrice: newPriceNum,
            currency: targetUnit.currency || "MXN",
            reason: historyReason,
            changedByUserId: userId && isUuid(userId) ? userId : null,
          },
        })
        .catch((err) => console.warn("Could not insert PriceHistory row:", err));
    }

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
