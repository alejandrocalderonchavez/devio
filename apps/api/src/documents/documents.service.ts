import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { randomUUID } from "crypto";

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(projectId?: string, clientId?: string, developerId?: string) {
    const whereClause: any = {};
    if (projectId) whereClause.projectId = projectId;
    if (clientId) whereClause.clientId = clientId;
    if (developerId) whereClause.developerId = developerId;

    const documents = await this.prisma.document.findMany({
      where: whereClause,
      include: {
        project: true,
        client: true,
        unit: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      documents,
    };
  }

  async create(body: any) {
    const {
      id,
      projectId,
      developerId,
      clientId,
      clientName,
      unitId,
      unit,
      unitNumber,
      saleId,
      title,
      type,
      category,
      filePath,
      fileUrl,
      url,
      fileSizeBytes,
      fileSize,
      mimeType,
      isClientVisible,
      notes,
    } = body;

    let targetDevId = developerId;
    if (!targetDevId && projectId) {
      const proj = await this.prisma.project.findUnique({
        where: { id: projectId },
        select: { developerId: true },
      });
      targetDevId = proj?.developerId;
    }

    if (!targetDevId) {
      const firstDev = await this.prisma.developer.findFirst({ select: { id: true } });
      targetDevId = firstDev?.id;
    }

    if (!targetDevId) {
      throw new BadRequestException("No se encontró developerId para asociar el documento");
    }

    let targetClientId: string | null = null;
    if (clientId && clientId.length > 10 && !clientId.startsWith("cli-") && !clientId.includes("@")) {
      const c = await this.prisma.client.findUnique({ where: { id: clientId } });
      if (c) targetClientId = c.id;
    } else if (clientId || clientName) {
      const lookupVal = (clientId || clientName).trim();
      const c = await this.prisma.client.findFirst({
        where: {
          developerId: targetDevId,
          OR: [
            { email: { equals: lookupVal, mode: "insensitive" } },
            { fullName: { equals: lookupVal, mode: "insensitive" } },
          ],
        },
      });
      if (c) targetClientId = c.id;
    }

    let targetUnitId: string | null = null;
    if (unitId && unitId.length > 10 && !unitId.startsWith("u-")) {
      const u = await this.prisma.unit.findUnique({ where: { id: unitId } });
      if (u) targetUnitId = u.id;
    } else if (unit || unitNumber) {
      const uNum = String(unit || unitNumber).trim();
      const u = await this.prisma.unit.findFirst({
        where: {
          projectId: projectId || undefined,
          unitNumber: { equals: uNum, mode: "insensitive" },
        },
      });
      if (u) targetUnitId = u.id;
    }

    const rawType = String(type || category || "OTHER").toUpperCase();
    let docType: "QUOTE" | "RECEIPT" | "STATEMENT" | "CONTRACT" | "OTHER" = "OTHER";

    if (rawType.includes("QUOTE") || rawType.includes("COTIZACION")) {
      docType = "QUOTE";
    } else if (rawType.includes("RECEIPT") || rawType.includes("RECIBO")) {
      docType = "RECEIPT";
    } else if (rawType.includes("STATEMENT") || rawType.includes("ESTADO_CUENTA")) {
      docType = "STATEMENT";
    } else if (rawType.includes("CONTRACT") || rawType.includes("CONTRATO")) {
      docType = "CONTRACT";
    }

    const storagePath = filePath || fileUrl || url || "/documents/general.pdf";
    const parsedSizeBytes = Number(fileSizeBytes || (typeof fileSize === "number" ? fileSize : 1024));

    const metadata: any = {
      notes: notes || undefined,
      unit: unit || unitNumber || undefined,
      clientName: clientName || undefined,
      clientId: clientId || undefined,
      localId: id || undefined,
      clientDocId: id || undefined,
    };

    const isUuid = id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const targetId = isUuid ? id : randomUUID();

    const doc = await this.prisma.document.upsert({
      where: { id: targetId },
      update: {
        title: title || "Documento",
        type: docType as any,
        storagePath,
        fileSizeBytes: parsedSizeBytes,
        mimeType: mimeType || "application/pdf",
        isClientVisible: isClientVisible !== false,
        metadata,
      },
      create: {
        id: targetId,
        developerId: targetDevId,
        projectId: projectId || null,
        clientId: targetClientId,
        unitId: targetUnitId,
        saleId: saleId || null,
        title: title || "Documento",
        type: docType as any,
        storagePath,
        fileSizeBytes: parsedSizeBytes,
        mimeType: mimeType || "application/pdf",
        isClientVisible: isClientVisible !== false,
        metadata,
      },
    });

    return {
      success: true,
      document: doc,
    };
  }

  async delete(id: string) {
    if (!id) {
      throw new BadRequestException("ID de documento requerido");
    }

    await this.prisma.document.delete({ where: { id } }).catch(() => {});

    return {
      success: true,
      message: "Documento eliminado de Supabase",
    };
  }
}
