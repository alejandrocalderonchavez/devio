import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { randomUUID } from "crypto";

export interface CreateDeveloperDto {
  userId?: string;
  userEmail?: string;
  name: string; // Nombre comercial
  legalName?: string;
  taxId?: string; // RFC (opcional)
  logoPath?: string;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  addressLine1?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  description?: string;
  teamMembers?: Array<{
    fullName: string;
    email: string;
    phone?: string;
    role: "SUPERADMIN" | "ADMIN" | "SALES_DIRECTOR" | "SALES_MANAGER" | "SALES_AGENT" | "COLLECTION_AGENT" | "LEGAL" | "AUDITOR";
  }>;
}

@Injectable()
export class DevelopersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDeveloperDto) {
    const developerId = randomUUID();

    return this.prisma.$transaction(async (tx: any) => {
      // 1. Crear Desarrolladora
      const developer = await tx.developer.create({
        data: {
          id: developerId,
          name: dto.name,
          legalName: dto.legalName || dto.name,
          taxId: dto.taxId || null,
          logoPath: dto.logoPath || null,
          phone: dto.phone || null,
          email: dto.email || null,
          website: dto.website || null,
          instagram: dto.instagram || null,
          addressLine1: dto.addressLine1 || null,
          neighborhood: dto.neighborhood || null,
          city: dto.city || null,
          state: dto.state || null,
          postalCode: dto.postalCode || null,
          country: dto.country || "MEX",
          description: dto.description || null,
        },
      });

      // 2. Vincular usuario creador como SUPERADMIN
      let ownerUser = null;
      if (dto.userId) {
        ownerUser = await tx.user.findUnique({ where: { id: dto.userId } });
      } else if (dto.userEmail) {
        ownerUser = await tx.user.findUnique({ where: { email: dto.userEmail } });
      }

      if (ownerUser) {
        await tx.membership.create({
          data: {
            id: randomUUID(),
            userId: ownerUser.id,
            developerId: developer.id,
            role: "SUPERADMIN",
          },
        });
      }

      // 3. Crear miembros adicionales del equipo e invitaciones
      if (dto.teamMembers && dto.teamMembers.length > 0) {
        for (const member of dto.teamMembers) {
          let memberUser = await tx.user.findUnique({ where: { email: member.email.toLowerCase().trim() } });
          if (!memberUser) {
            memberUser = await tx.user.create({
              data: {
                id: randomUUID(),
                authUserId: randomUUID(),
                email: member.email.toLowerCase().trim(),
                fullName: member.fullName,
                phone: member.phone || null,
              },
            });
          }

          // Crear o asegurar membresía
          const existingMem = await tx.membership.findUnique({
            where: {
              userId_developerId: {
                userId: memberUser.id,
                developerId: developer.id,
              },
            },
          });

          if (!existingMem) {
            await tx.membership.create({
              data: {
                id: randomUUID(),
                userId: memberUser.id,
                developerId: developer.id,
                role: member.role || "SALES_AGENT",
              },
            });
          }
        }
      }

      return developer;
    });
  }

  async findById(id: string) {
    const developer = await this.prisma.developer.findUnique({
      where: { id },
      include: {
        projects: true,
        memberships: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!developer) {
      throw new NotFoundException(`Desarrolladora con ID ${id} no encontrada.`);
    }

    return developer;
  }

  async findAll() {
    return this.prisma.developer.findMany({
      include: {
        projects: {
          select: {
            id: true,
            name: true,
            projectType: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
