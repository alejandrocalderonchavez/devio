import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { randomUUID } from "crypto";

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(projectId?: string) {
    const whereClause: any = {};
    if (projectId) whereClause.projectId = projectId;

    const progressList = await this.prisma.constructionProgress.findMany({
      where: whereClause,
      include: { project: true },
      orderBy: { progressDate: "desc" },
    });

    return {
      success: true,
      progress: progressList,
    };
  }

  async create(body: any) {
    const {
      projectId,
      title,
      description,
      progressDate,
      overallPercentage,
      specialtyDetails,
      mediaUrls,
      images,
      targetScope,
      targetUnits,
    } = body;

    if (!projectId) {
      throw new BadRequestException("projectId es requerido");
    }

    const pct = Number(overallPercentage ?? 0);
    const pDate = progressDate ? new Date(progressDate) : new Date();
    const media = Array.isArray(mediaUrls) ? mediaUrls : Array.isArray(images) ? images : [];

    const record = await this.prisma.constructionProgress.create({
      data: {
        id: randomUUID(),
        projectId,
        title: title || `Avance de Obra - ${pDate.toLocaleDateString("es-MX")}`,
        description: description || "",
        progressDate: isNaN(pDate.getTime()) ? new Date() : pDate,
        overallPercentage: pct,
        specialtyDetails: {
          ...(specialtyDetails || {}),
          targetScope: targetScope || "PROJECT",
          targetUnits: Array.isArray(targetUnits) ? targetUnits : undefined,
        },
        mediaUrls: media,
        isClientVisible: true,
      },
    });

    try {
      if (targetScope === "UNITS" && Array.isArray(targetUnits) && targetUnits.length > 0) {
        const units = await this.prisma.unit.findMany({
          where: {
            projectId,
            unitNumber: { in: targetUnits },
          },
        });

        for (const unit of units) {
          const existingAttributes = (unit.customAttributes as Record<string, any>) || {};
          await this.prisma.unit.update({
            where: { id: unit.id },
            data: {
              customAttributes: {
                ...existingAttributes,
                constructionPct: pct,
              },
            },
          });
        }
      } else {
        const units = await this.prisma.unit.findMany({
          where: { projectId },
        });

        for (const unit of units) {
          const existingAttributes = (unit.customAttributes as Record<string, any>) || {};
          await this.prisma.unit.update({
            where: { id: unit.id },
            data: {
              customAttributes: {
                ...existingAttributes,
                constructionPct: pct,
              },
            },
          });
        }
      }
    } catch (err) {
      console.warn("Could not update unit constructionPct:", err);
    }

    return {
      success: true,
      progress: record,
    };
  }
}
