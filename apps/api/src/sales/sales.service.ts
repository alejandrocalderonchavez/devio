import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { randomUUID } from "crypto";

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(body: any) {
    const {
      projectId,
      unitNumber,
      unitId,
      client,
      coOwners,
      financials,
      schedule,
      initialPayment,
      folio,
    } = body;

    if (!projectId) {
      throw new BadRequestException("El ID del proyecto es requerido.");
    }

    // 1. Find project and its developer
    let project = await this.prisma.project.findFirst({
      where: {
        OR: [
          { id: projectId.length === 36 ? projectId : undefined },
          { name: projectId },
        ].filter(Boolean) as any,
      },
      include: {
        developer: true,
        units: true,
      },
    });

    if (!project) {
      project = await this.prisma.project.findFirst({
        include: {
          developer: true,
          units: true,
        },
      });
    }

    if (!project) {
      throw new NotFoundException("No se encontró ningún proyecto registrado en la base de datos.");
    }

    // 2. Find or create Unit
    let targetUnit = project.units.find(
      (u: any) => u.unitNumber.toLowerCase() === String(unitNumber || "").toLowerCase() || u.id === unitId
    );

    const agreedPrice = Number(financials?.totalSale || financials?.netTotalSale || financials?.unitPrice || 3500000);

    if (!targetUnit) {
      targetUnit = await this.prisma.unit.create({
        data: {
          projectId: project.id,
          unitNumber: String(unitNumber || "U-01"),
          basePrice: agreedPrice,
          totalAreaM2: 85,
          status: "SOLD",
        },
      });
    } else {
      await this.prisma.unit.update({
        where: { id: targetUnit.id },
        data: { status: "SOLD" },
      });
    }

    // 3. Find or create User in `users` table for Primary Client
    const primaryEmail = (client?.email || "").toLowerCase().trim();
    const primaryName = (client?.name || "Cliente Devio").trim();
    const primaryPhone = client?.phone ? String(client.phone).trim() : null;
    const primaryRfc = client?.rfc ? String(client.rfc).trim() : null;

    let primaryUser = null;
    if (primaryEmail) {
      primaryUser = await this.prisma.user.findUnique({
        where: { email: primaryEmail },
      });

      if (!primaryUser) {
        primaryUser = await this.prisma.user.create({
          data: {
            authUserId: randomUUID(),
            email: primaryEmail,
            fullName: primaryName,
            phone: primaryPhone,
            preferredLanguage: "ES",
            preferredCurrency: "MXN",
          },
        });
      } else if (!primaryUser.fullName || primaryUser.fullName === "Usuario Devio") {
        primaryUser = await this.prisma.user.update({
          where: { id: primaryUser.id },
          data: {
            fullName: primaryName,
            phone: primaryPhone || primaryUser.phone,
          },
        });
      }

      await this.prisma.membership.upsert({
        where: {
          userId_developerId: {
            userId: primaryUser.id,
            developerId: project.developerId,
          },
        },
        create: {
          userId: primaryUser.id,
          developerId: project.developerId,
          role: "CLIENT",
        },
        update: {},
      });
    }

    // 4. Find or create Client in `clients` table
    let primaryClient = null;
    if (primaryEmail) {
      primaryClient = await this.prisma.client.findFirst({
        where: {
          developerId: project.developerId,
          email: primaryEmail,
        },
      });
    }

    if (!primaryClient) {
      primaryClient = await this.prisma.client.create({
        data: {
          developerId: project.developerId,
          userId: primaryUser?.id || null,
          fullName: primaryName,
          email: primaryEmail || null,
          phone: primaryPhone,
          taxId: primaryRfc,
        },
      });
    } else {
      primaryClient = await this.prisma.client.update({
        where: { id: primaryClient.id },
        data: {
          userId: primaryUser?.id || primaryClient.userId,
          fullName: primaryName,
          phone: primaryPhone || primaryClient.phone,
          taxId: primaryRfc || primaryClient.taxId,
        },
      });
    }

    // 5. Create Sale
    const saleFolio = folio || `VTA-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const sale = await this.prisma.sale.create({
      data: {
        projectId: project.id,
        unitId: targetUnit.id,
        primaryClientId: primaryClient.id,
        contractNumber: saleFolio,
        status: "ACTIVE",
        agreedPrice: agreedPrice,
        discountAmount: Number(financials?.discount || 0),
        finalPrice: agreedPrice,
        baseCurrency: "MXN",
        reservationDate: new Date(),
      },
    });

    // 6. Handle Co-owners
    if (Array.isArray(coOwners) && coOwners.length > 0) {
      for (const co of coOwners) {
        if (!co.email && !co.name) continue;
        const coEmail = (co.email || "").toLowerCase().trim();
        const coName = (co.name || "Co-propietario").trim();

        let coUser = null;
        if (coEmail) {
          coUser = await this.prisma.user.findUnique({ where: { email: coEmail } });
          if (!coUser) {
            coUser = await this.prisma.user.create({
              data: {
                authUserId: randomUUID(),
                email: coEmail,
                fullName: coName,
                phone: co.phone ? String(co.phone).trim() : null,
                preferredLanguage: "ES",
                preferredCurrency: "MXN",
              },
            });
          }
        }

        let coClient = null;
        if (coEmail) {
          coClient = await this.prisma.client.findFirst({
            where: { developerId: project.developerId, email: coEmail },
          });
        }
        if (!coClient) {
          coClient = await this.prisma.client.create({
            data: {
              developerId: project.developerId,
              userId: coUser?.id || null,
              fullName: coName,
              email: coEmail || null,
              phone: co.phone ? String(co.phone).trim() : null,
              taxId: co.rfc ? String(co.rfc).trim() : null,
            },
          });
        }

        await this.prisma.saleCoOwner.create({
          data: {
            saleId: sale.id,
            clientId: coClient.id,
            ownershipPercentage: Number(co.percentage || (100 / (coOwners.length + 1))),
          },
        });
      }
    }

    // 7. Handle Scheduled Obligations
    if (Array.isArray(schedule) && schedule.length > 0) {
      for (let i = 0; i < schedule.length; i++) {
        const item = schedule[i];
        const rawType = (item.concept || item.type || "INSTALLMENT").toUpperCase();
        let obType: "RESERVATION" | "DOWN_PAYMENT" | "INSTALLMENT" | "SETTLEMENT" | "ADDITIONAL" | "INTEREST" | "OTHER" = "INSTALLMENT";
        if (rawType.includes("APARTADO") || rawType.includes("RESERV")) obType = "RESERVATION";
        else if (rawType.includes("ENGANCHE") || rawType.includes("DOWN")) obType = "DOWN_PAYMENT";
        else if (rawType.includes("LIQUIDAC") || rawType.includes("FINIQUITO") || rawType.includes("SETTLE")) obType = "SETTLEMENT";

        const dueDate = item.dueDate ? new Date(item.dueDate) : new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000);
        const itemAmount = Number(item.amount || item.total || 0);

        if (itemAmount > 0) {
          await this.prisma.scheduledObligation.create({
            data: {
              saleId: sale.id,
              title: item.concept || item.title || `Cuota ${i + 1}`,
              type: obType,
              obligationNumber: i + 1,
              dueDate: isNaN(dueDate.getTime()) ? new Date() : dueDate,
              originalAmount: itemAmount,
              pendingAmount: item.paid ? 0 : itemAmount,
              paidAmount: item.paid ? itemAmount : 0,
              currency: "MXN",
              status: item.paid ? "PAID" : "PENDING",
            },
          });
        }
      }
    }

    // 8. Handle Initial Payment Receipt
    if (initialPayment && Number(initialPayment.amount) > 0) {
      const initAmount = Number(initialPayment.amount);
      const initFolio = `REC-INI-${Date.now().toString().slice(-6)}`;
      await this.prisma.paymentReceipt.create({
        data: {
          saleId: sale.id,
          payerClientId: primaryClient.id,
          receiptFolio: initFolio,
          paymentDate: new Date(),
          paymentMethod: "TRANSFER",
          amount: initAmount,
          currency: "MXN",
          equivalentAmountInSaleCurrency: initAmount,
          transactionReference: initialPayment.reference || initFolio,
          notes: "Pago inicial de apartado / enganche al registrar la venta",
        },
      });
    }

    return {
      success: true,
      sale: {
        id: sale.id,
        contractNumber: sale.contractNumber,
        status: sale.status,
        finalPrice: sale.finalPrice,
        unitNumber: targetUnit.unitNumber,
        clientName: primaryClient.fullName,
        clientEmail: primaryClient.email,
      },
    };
  }

  async findAll(developerId?: string, projectId?: string) {
    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (developerId) where.project = { developerId };

    return this.prisma.sale.findMany({
      where,
      include: {
        unit: true,
        project: true,
        primaryClient: true,
        coOwners: { include: { client: true } },
        scheduledObligations: { orderBy: { obligationNumber: "asc" } },
        paymentReceipts: { orderBy: { paymentDate: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        unit: true,
        project: true,
        primaryClient: true,
        coOwners: { include: { client: true } },
        scheduledObligations: { orderBy: { obligationNumber: "asc" } },
        paymentReceipts: { orderBy: { paymentDate: "desc" } },
      },
    });

    if (!sale) {
      throw new NotFoundException(`Venta con ID ${id} no encontrada.`);
    }

    return sale;
  }
}
