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
      additionals,
      soldAddons,
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

    // 6. Handle Co-owners (Supports 2, 3, 4, 5+ co-owners seamlessly)
    const isCoOp = body.isCoOwnership === true || (Array.isArray(coOwners) && coOwners.length > 0 && body.isCoOwnership !== false);
    const createdCoClients: any[] = [];

    if (isCoOp && Array.isArray(coOwners) && coOwners.length > 0) {
      for (let i = 0; i < coOwners.length; i++) {
        const co = coOwners[i];
        if (!co || (!co.email && !co.name)) continue;
        const coEmail = (co.email || "").toLowerCase().trim();
        const coName = (co.name || `Copropietario ${i + 1}`).trim();

        // If this coOwner is the primary client, record reference and continue
        if (
          (primaryEmail && coEmail && coEmail === primaryEmail) ||
          (primaryClient && coEmail && primaryClient.email?.toLowerCase() === coEmail) ||
          (co.isPrimary === true && primaryClient)
        ) {
          createdCoClients.push({ ...co, clientId: primaryClient.id, client: primaryClient });
          continue;
        }

        try {
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
            } else if (!coUser.fullName || coUser.fullName === "Usuario Devio") {
              coUser = await this.prisma.user.update({
                where: { id: coUser.id },
                data: {
                  fullName: coName,
                  phone: co.phone ? String(co.phone).trim() : coUser.phone,
                },
              });
            }

            await this.prisma.membership.upsert({
              where: {
                userId_developerId: {
                  userId: coUser.id,
                  developerId: project.developerId,
                },
              },
              create: {
                userId: coUser.id,
                developerId: project.developerId,
                role: "CLIENT",
              },
              update: {},
            });
          }

          let coClient = null;
          if (coEmail) {
            coClient = await this.prisma.client.findFirst({
              where: { developerId: project.developerId, email: coEmail },
            });
          }
          if (!coClient && coName) {
            coClient = await this.prisma.client.findFirst({
              where: { developerId: project.developerId, fullName: coName },
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
          } else {
            coClient = await this.prisma.client.update({
              where: { id: coClient.id },
              data: {
                userId: coUser?.id || coClient.userId,
                phone: co.phone ? String(co.phone).trim() : coClient.phone,
                taxId: co.rfc ? String(co.rfc).trim() : coClient.taxId,
              },
            });
          }

          const rawPct = Number(co.percentage ?? co.ownershipPct ?? co.ownershipPercentage);
          const pct = !isNaN(rawPct) && rawPct > 0 ? rawPct : (100 / Math.max(2, coOwners.length));

          // Upsert saleCoOwner to avoid duplicate constraint failures
          await this.prisma.saleCoOwner.upsert({
            where: {
              saleId_clientId: {
                saleId: sale.id,
                clientId: coClient.id,
              },
            },
            create: {
              saleId: sale.id,
              clientId: coClient.id,
              ownershipPercentage: pct,
              isMainContact: false,
            },
            update: {
              ownershipPercentage: pct,
            },
          });

          createdCoClients.push({ ...co, clientId: coClient.id, client: coClient, ownershipPercentage: pct });
        } catch (coErr) {
          console.error(`Error registering co-owner ${coName} (${coEmail}):`, coErr);
        }
      }
    }

    // 6.5 Handle Additionals / Add-ons sold with the unit
    const addonsList = Array.isArray(additionals) && additionals.length > 0
      ? additionals
      : Array.isArray(soldAddons) && soldAddons.length > 0
      ? soldAddons
      : [];

    if (addonsList.length > 0) {
      for (const addOn of addonsList) {
        const addOnId = typeof addOn === "string" ? addOn : addOn?.id;
        const addOnName = typeof addOn === "object" ? addOn?.name : undefined;

        if (addOnId && addOnId.length > 10 && !addOnId.startsWith("add-")) {
          await this.prisma.unitAdditional.updateMany({
            where: { id: addOnId },
            data: {
              status: "SOLD",
              unitId: targetUnit.id,
            },
          });
        } else if (addOnName) {
          await this.prisma.unitAdditional.updateMany({
            where: {
              projectId: project.id,
              name: { equals: addOnName, mode: "insensitive" },
            },
            data: {
              status: "SOLD",
              unitId: targetUnit.id,
            },
          });
        }
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

        const rawDateStr = item.dueDate || item.date || item.scheduledDate || item.fechaProgramada;
        let parsedDueDate: Date | null = null;
        if (rawDateStr) {
          if (typeof rawDateStr === "string" && rawDateStr.includes("-")) {
            const parts = rawDateStr.split("-");
            if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
              if (parts[0].length === 4) {
                // YYYY-MM-DD
                parsedDueDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 12, 0, 0);
              } else {
                // DD-MM-YYYY
                parsedDueDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10), 12, 0, 0);
              }
            }
          } else if (typeof rawDateStr === "string" && rawDateStr.includes("/")) {
            const parts = rawDateStr.split("/");
            if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
              // DD/MM/YYYY
              parsedDueDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10), 12, 0, 0);
            }
          }
          if (!parsedDueDate || isNaN(parsedDueDate.getTime())) {
            parsedDueDate = new Date(rawDateStr);
          }
        }
        const dueDate = (parsedDueDate && !isNaN(parsedDueDate.getTime())) ? parsedDueDate : new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000);
        const itemAmount = Number(item.amount || item.total || item.scheduledAmount || 0);

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

    // 8. Handle Initial Payment Receipts
    if (Array.isArray(body.coOwnerPayments) && body.coOwnerPayments.length > 0) {
      for (const cop of body.coOwnerPayments) {
        const amt = Number(cop.amount || 0);
        if (amt > 0) {
          const copEmail = (cop.email || "").toLowerCase().trim();
          const copName = (cop.name || "").trim();
          let payerId: string | null = null;

          if (cop.clientId && cop.clientId.length === 36 && cop.clientId.includes("-") && !cop.clientId.startsWith("cli-") && !cop.clientId.startsWith("co-") && !cop.clientId.startsWith("primary-")) {
            payerId = cop.clientId;
          }

          if (!payerId) {
            if (copEmail && primaryEmail && copEmail === primaryEmail) {
              payerId = primaryClient.id;
            } else if (copEmail) {
              const matched = createdCoClients.find((c) => (c.email || c.client?.email || "").toLowerCase() === copEmail);
              payerId = matched?.clientId || matched?.client?.id || null;
            }
          }

          if (!payerId && copName) {
            if (primaryName && copName.toLowerCase() === primaryName.toLowerCase()) {
              payerId = primaryClient.id;
            } else {
              const matched = createdCoClients.find((c) => (c.name || c.client?.fullName || "").toLowerCase() === copName.toLowerCase());
              payerId = matched?.clientId || matched?.client?.id || null;
            }
          }

          if (!payerId) {
            payerId = primaryClient.id;
          }
          const payerFolio = cop.folio || `REC-INI-${Date.now().toString().slice(-6)}`;
          await this.prisma.paymentReceipt.create({
            data: {
              saleId: sale.id,
              payerClientId: payerId,
              receiptFolio: payerFolio,
              paymentDate: cop.paymentDate ? new Date(cop.paymentDate) : new Date(),
              paymentMethod:
                cop.method === "cheque" || cop.paymentMethod === "cheque"
                  ? "CHECK"
                  : cop.method === "tarjeta" || cop.paymentMethod === "tarjeta"
                  ? "CARD"
                  : cop.method === "efectivo" || cop.paymentMethod === "efectivo"
                  ? "CASH"
                  : cop.method === "deposito" || cop.paymentMethod === "deposito"
                  ? "OTHER"
                  : "TRANSFER",
              amount: amt,
              currency: "MXN",
              equivalentAmountInSaleCurrency: amt,
              transactionReference: cop.reference || payerFolio,
              notes: `Pago de enganche inicial copropietario ${copName}`.trim(),
            },
          });
        }
      }
    } else if (initialPayment && Number(initialPayment.amount) > 0) {
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

  async updateSchedule(saleId: string, body: { schedule: any[] }) {
    let sale = await this.prisma.sale.findFirst({
      where: {
        OR: [
          { id: saleId.length === 36 ? saleId : undefined },
          { contractNumber: saleId },
          { bubbleId: saleId },
        ].filter(Boolean) as any,
      },
      include: { scheduledObligations: true, paymentReceipts: true },
    });

    if (!sale) {
      const unitNum = saleId.replace(/^unit-/, "");
      sale = await this.prisma.sale.findFirst({
        where: { unit: { unitNumber: unitNum } },
        include: { scheduledObligations: true, paymentReceipts: true },
      });
    }

    if (!sale) {
      throw new NotFoundException(`Venta con identificador ${saleId} no encontrada.`);
    }

    const realSaleId = sale.id;

    await this.prisma.$transaction(async (tx) => {
      await tx.scheduledObligation.deleteMany({
        where: { saleId: realSaleId },
      });

      if (Array.isArray(body.schedule) && body.schedule.length > 0) {
        for (let i = 0; i < body.schedule.length; i++) {
          const inst = body.schedule[i];
          const rawDate = inst.scheduledDate || inst.dueDate || inst.fechaProgramada;
          let dueDate = new Date();
          if (rawDate) {
            if (typeof rawDate === "string" && rawDate.includes("/")) {
              const parts = rawDate.split("/");
              if (parts.length === 3) {
                dueDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
              } else {
                dueDate = new Date(rawDate);
              }
            } else {
              dueDate = new Date(rawDate);
            }
          }
          if (isNaN(dueDate.getTime())) dueDate = new Date();

          const origAmt = Number(inst.scheduledAmount || inst.originalAmount || inst.amount) || 0;
          const paidAmt = Number(inst.paidAmount) || 0;
          const pendAmt = inst.pendingAmount !== undefined ? Number(inst.pendingAmount) : Math.max(0, origAmt - paidAmt);

          let status: any = "PENDING";
          if (pendAmt === 0 && origAmt > 0) status = "PAID";
          else if (paidAmt > 0) status = "PARTIAL";

          let type: any = "INSTALLMENT";
          const titleLower = (inst.concept || inst.title || "").toLowerCase();
          if (titleLower.includes("enganche") || titleLower.includes("inicial") || titleLower.includes("anticipo")) type = "DOWN_PAYMENT";
          else if (titleLower.includes("liquidacion") || titleLower.includes("finiquito") || titleLower.includes("escritura")) type = "BALLOON_PAYMENT";

          await tx.scheduledObligation.create({
            data: {
              saleId: realSaleId,
              obligationNumber: i + 1,
              title: inst.concept || inst.title || `Cuota ${i + 1}`,
              type,
              dueDate,
              originalAmount: origAmt,
              pendingAmount: pendAmt,
              paidAmount: paidAmt,
              status,
              currency: "MXN",
            },
          });
        }
      }
    });

    return this.findById(realSaleId);
  }
}
