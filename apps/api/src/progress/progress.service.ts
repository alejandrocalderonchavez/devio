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
        specialtyDetails: specialtyDetails || null,
        mediaUrls: media,
        isClientVisible: true,
      },
    });

    return {
      success: true,
      progress: record,
    };
  }
}
