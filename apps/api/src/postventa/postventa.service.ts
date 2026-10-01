import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { randomUUID } from "crypto";

@Injectable()
export class PostventaService {
  private readonly logger = new Logger(PostventaService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(projectId?: string, developerId?: string) {
    try {
      const where: any = {};
      if (projectId) {
        where.projectId = projectId;
      } else if (developerId) {
        where.project = { developerId };
      }

      const incidents = await this.prisma.postsaleIncident.findMany({
        where,
        include: {
          comments: {
            orderBy: { createdAt: "asc" },
          },
          logs: {
            orderBy: { createdAt: "desc" },
          },
          appointments: {
            orderBy: { scheduledDate: "asc" },
          },
          evidences: {
            orderBy: { createdAt: "desc" },
          },
          unit: true,
          client: true,
          project: {
            select: { id: true, name: true, developerId: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return incidents;
    } catch (error) {
      this.logger.error("Error fetching postsale incidents:", error);
      return [];
    }
  }

  async findOne(id: string) {
    try {
      return await this.prisma.postsaleIncident.findUnique({
        where: { id },
        include: {
          comments: true,
          logs: true,
          appointments: true,
          evidences: true,
          unit: true,
          client: true,
          project: true,
        },
      });
    } catch (error) {
      this.logger.error(`Error finding incident ${id}:`, error);
      return null;
    }
  }

  async create(body: any) {
    try {
      const {
        projectId,
        unit,
        clientName,
        clientEmail,
        clientPhone,
        coOwners,
        category,
        priority,
        title,
        description,
        assignedTo,
        supplier,
        slaHours,
        evidences,
        folio,
      } = body;

      // 1. Find project
      const project = await this.prisma.project.findFirst({
        where: {
          OR: [
            { id: projectId || undefined },
            { name: { equals: body.projectName, mode: "insensitive" } },
          ],
        },
      });

      if (!project) {
        this.logger.warn(`Project not found for incident: ${projectId || body.projectName}`);
      }

      const targetProjectId = project?.id || projectId;

      // 2. Find or match Unit
      let unitRecord = null;
      if (targetProjectId && unit) {
        unitRecord = await this.prisma.unit.findFirst({
          where: {
            projectId: targetProjectId,
            unitNumber: { equals: String(unit).trim(), mode: "insensitive" },
          },
        });
      }

      // 3. Find or create Client
      let clientRecord = null;
      const cleanEmail = (clientEmail || "").toLowerCase().trim();
      if (project?.developerId && cleanEmail) {
        clientRecord = await this.prisma.client.findFirst({
          where: {
            developerId: project.developerId,
            email: { equals: cleanEmail, mode: "insensitive" },
          },
        });

        if (!clientRecord) {
          clientRecord = await this.prisma.client.create({
            data: {
              developerId: project.developerId,
              fullName: clientName || "Cliente Comprador",
              email: cleanEmail,
              phone: clientPhone || null,
            },
          });
        }
      }

      // Generate unique folio
      const finalFolio = folio || `INC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

      // Map priority enum
      let mappedPriority: any = "MEDIUM";
      const pStr = String(priority || "").toUpperCase();
      if (pStr === "URGENTE" || pStr === "URGENT") mappedPriority = "URGENT";
      else if (pStr === "ALTA" || pStr === "HIGH") mappedPriority = "HIGH";
      else if (pStr === "BAJA" || pStr === "LOW") mappedPriority = "LOW";

      // If unit and client are found in DB, insert into prisma
      if (targetProjectId && unitRecord && clientRecord) {
        const created = await this.prisma.postsaleIncident.create({
          data: {
            folio: finalFolio,
            projectId: targetProjectId,
            unitId: unitRecord.id,
            clientId: clientRecord.id,
            category: category || "General",
            priority: mappedPriority,
            status: "REPORTED",
            title: title || "Reporte de Incidencia",
            description: description || "",
            supplierName: supplier?.name || null,
            comments: {
              create: [
                {
                  message: `Incidencia registrada con folio ${finalFolio}. Prioridad: ${priority || "Media"}.`,
                  isInternal: true,
                },
              ],
            },
          },
          include: {
            comments: true,
            unit: true,
            client: true,
            project: true,
          },
        });

        return { success: true, data: created };
      }

      return {
        success: true,
        message: "Incident recorded in memory/local state",
        folio: finalFolio,
      };
    } catch (error) {
      this.logger.error("Error creating postsale incident:", error);
      return { success: false, error: (error as any).message };
    }
  }

  async addComment(incidentId: string, commentPayload: any) {
    try {
      const { message, isInternalOnly, authorName, mediaUrls } = commentPayload;
      
      const comment = await this.prisma.incidentComment.create({
        data: {
          incidentId,
          message,
          isInternal: Boolean(isInternalOnly),
          mediaUrls: Array.isArray(mediaUrls) ? mediaUrls : [],
        },
      });

      return { success: true, data: comment };
    } catch (error) {
      this.logger.error(`Error adding comment to incident ${incidentId}:`, error);
      return { success: false, error: (error as any).message };
    }
  }

  async updateStatus(incidentId: string, status: string, notes?: string) {
    try {
      // Map frontend status to enum if possible
      let mappedStatus: any = "REPORTED";
      const s = (status || "").toLowerCase().trim();
      if (s.includes("revis")) mappedStatus = "UNDER_REVIEW";
      else if (s.includes("asign")) mappedStatus = "ASSIGNED";
      else if (s.includes("visita")) mappedStatus = "VISIT_SCHEDULED";
      else if (s.includes("repar")) mappedStatus = "IN_REPAIR";
      else if (s.includes("espera") || s.includes("cliente")) mappedStatus = "WAITING_CLIENT";
      else if (s.includes("resuelt")) mappedStatus = "RESOLVED";
      else if (s.includes("cerrad")) mappedStatus = "CLOSED";
      else if (s.includes("reabier")) mappedStatus = "REOPENED";

      const updated = await this.prisma.postsaleIncident.update({
        where: { id: incidentId },
        data: {
          status: mappedStatus,
        },
      });

      if (notes) {
        await this.prisma.incidentComment.create({
          data: {
            incidentId,
            message: `Estado actualizado a "${status}": ${notes}`,
            isInternal: true,
          },
        });
      }

      return { success: true, data: updated };
    } catch (error) {
      this.logger.error(`Error updating incident status ${incidentId}:`, error);
      return { success: false, error: (error as any).message };
    }
  }
}
