import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { randomUUID } from "crypto";

export interface CreateDeveloperDto {
  userId?: string;
  userEmail?: string;
  name: string;
  legalName?: string;
  taxId?: string;
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

  async findByQuery(email?: string, id?: string) {
    const salesIncludeClause = {
      include: {
        primaryClient: true,
        unit: true,
        paymentPlan: true,
        scheduledObligations: true,
        paymentReceipts: true,
        coOwners: {
          include: {
            client: true,
          },
        },
      },
    };

    if (email || id) {
      const whereClause: any = {};
      if (id && id.length > 10 && !id.startsWith("dev-")) whereClause.id = id;
      if (email) whereClause.email = email.toLowerCase().trim();

      const dev = await this.prisma.developer.findFirst({
        where: whereClause,
        include: {
          projects: {
            include: {
              units: true,
              sales: salesIncludeClause,
              documents: true,
              additionals: true,
              constructionProgress: {
                orderBy: { progressDate: "desc" },
              },
            },
          },
          memberships: {
            include: {
              user: true,
            },
          },
        },
      });

      if (dev) {
        return { success: true, developer: dev };
      }
    }

    const dbDevs = await this.prisma.developer.findMany({
      include: {
        projects: {
          include: {
            units: true,
            sales: salesIncludeClause,
            documents: true,
            additionals: true,
            constructionProgress: {
              orderBy: { progressDate: "desc" },
            },
          },
        },
        memberships: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, developers: dbDevs };
  }

  async updateDeveloper(body: any) {
    const {
      id,
      userEmail,
      email,
      name,
      tradeName,
      businessName,
      legalName,
      rfc,
      taxId,
      addressStreet,
      addressLine1,
      addressCol,
      neighborhood,
      city,
      state,
      zipCode,
      postalCode,
      phone,
      billingEmail,
      contactEmail,
      logoUrl,
      logoPath,
      teamMembers,
    } = body;

    const devName = tradeName || name || businessName || "Mi Desarrolladora";
    const devLegal = legalName || businessName || devName;
    const devRfc = rfc || taxId || "";
    const devEmail = contactEmail || billingEmail || email || "";
    const devLogo = logoUrl || logoPath || null;
    const devStreet = addressStreet || addressLine1 || "";
    const devCol = addressCol || neighborhood || "";
    const devCity = city || "Guadalajara";
    const devState = state || "Jalisco";
    const devZip = zipCode || postalCode || "";
    const primaryUserEmail = (userEmail || devEmail || "").toLowerCase().trim();

    let devRecord: any = null;

    if (id && id.length > 10 && !id.startsWith("dev-")) {
      devRecord = await this.prisma.developer.findUnique({ where: { id } }).catch(() => null);
    }

    if (!devRecord && primaryUserEmail) {
      const user = await this.prisma.user.findUnique({
        where: { email: primaryUserEmail },
        include: {
          memberships: {
            include: { developer: true },
          },
        },
      }).catch(() => null);

      if (user?.memberships && user.memberships.length > 0 && user.memberships[0]?.developer) {
        devRecord = user.memberships[0].developer;
      }
    }

    if (!devRecord && devEmail) {
      devRecord = await this.prisma.developer.findFirst({
        where: { email: devEmail.toLowerCase().trim() },
      }).catch(() => null);
    }

    if (!devRecord) {
      devRecord = await this.prisma.developer.create({
        data: {
          name: devName,
          legalName: devLegal,
          taxId: devRfc || null,
          email: devEmail || null,
          phone: phone || null,
          addressLine1: devStreet || null,
          neighborhood: devCol || null,
          city: devCity || null,
          state: devState || null,
          postalCode: devZip || null,
          logoPath: devLogo,
        },
      });
    } else {
      devRecord = await this.prisma.developer.update({
        where: { id: devRecord.id },
        data: {
          name: devName,
          legalName: devLegal,
          taxId: devRfc || null,
          email: devEmail || null,
          phone: phone || null,
          addressLine1: devStreet || null,
          neighborhood: devCol || null,
          city: devCity || null,
          state: devState || null,
          postalCode: devZip || null,
          logoPath: devLogo,
        },
      });
    }

    if (primaryUserEmail) {
      let user = await this.prisma.user.findUnique({ where: { email: primaryUserEmail } }).catch(() => null);
      if (!user) {
        user = await this.prisma.user.create({
          data: {
            authUserId: randomUUID(),
            email: primaryUserEmail,
            fullName: devName,
            phone: phone || null,
          },
        }).catch(() => null);
      }

      if (user) {
        await this.prisma.membership.upsert({
          where: {
            userId_developerId: {
              userId: user.id,
              developerId: devRecord.id,
            },
          },
          update: { role: "SUPER_ADMIN" },
          create: {
            userId: user.id,
            developerId: devRecord.id,
            role: "SUPER_ADMIN",
          },
        }).catch(() => {});
      }
    }

    if (Array.isArray(teamMembers) && teamMembers.length > 0) {
      for (const tm of teamMembers) {
        if (tm.email) {
          const tmEmail = tm.email.toLowerCase().trim();
          let user = await this.prisma.user.findUnique({ where: { email: tmEmail } }).catch(() => null);
          if (!user) {
            user = await this.prisma.user.create({
              data: {
                authUserId: randomUUID(),
                email: tmEmail,
                fullName: tm.fullName || tm.name || "Miembro del Equipo",
                phone: tm.phone || null,
              },
            }).catch(() => null);
          }

          if (user) {
            const roleEnum = tm.role?.toLowerCase().includes("super")
              ? "SUPER_ADMIN"
              : tm.role?.toLowerCase().includes("director") || tm.role?.toLowerCase().includes("admin")
              ? "ADMIN"
              : "COMMERCIAL";

            await this.prisma.membership.upsert({
              where: {
                userId_developerId: {
                  userId: user.id,
                  developerId: devRecord.id,
                },
              },
              update: { role: roleEnum as any },
              create: {
                userId: user.id,
                developerId: devRecord.id,
                role: roleEnum as any,
              },
            }).catch(() => {});
          }
        }
      }
    }

    return { success: true, developer: devRecord };
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
          include: {
            units: {
              select: {
                id: true,
                unitNumber: true,
                status: true,
                basePrice: true,
              },
            },
          },
        },
        memberships: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
