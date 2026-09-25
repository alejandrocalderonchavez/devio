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
      projectId,
      developerId,
      clientId,
      unitId,
      saleId,
      title,
      type,
      category,
      filePath,
      fileUrl,
      fileSizeBytes,
      mimeType,
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

    const storagePath = filePath || fileUrl || "/documents/general.pdf";

    const doc = await this.prisma.document.create({
      data: {
        id: randomUUID(),
        developerId: targetDevId,
        projectId: projectId || null,
        clientId: clientId || null,
        unitId: unitId || null,
        saleId: saleId || null,
        title: title || "Documento",
        type: docType as any,
        storagePath,
        fileSizeBytes: Number(fileSizeBytes || 1024),
        mimeType: mimeType || "application/pdf",
        isClientVisible: true,
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
