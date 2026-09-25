import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(body: any) {
    const {
      projectId,
      unitNumber,
      amount,
      paymentDate,
      paymentMethod,
      reference,
      notes,
    } = body;

    const payAmount = Number(amount);
    if (!payAmount || payAmount <= 0) {
      throw new BadRequestException("El monto del pago es requerido y debe ser mayor a 0.");
    }

    const cleanUnit = String(unitNumber || "").trim();

    // 1. Find Sale matching the unit
    let sale = await this.prisma.sale.findFirst({
      where: {
        unit: { unitNumber: cleanUnit },
        status: { in: ["ACTIVE", "RESERVED", "IN_CONTRACT"] },
      },
      include: {
        primaryClient: true,
        scheduledObligations: {
          where: {
            status: { in: ["PENDING", "PARTIALLY_PAID", "OVERDUE"] },
          },
          orderBy: { obligationNumber: "asc" },
        },
      },
    });

    if (!sale && projectId) {
      sale = await this.prisma.sale.findFirst({
        where: {
          projectId,
          unit: { unitNumber: cleanUnit },
        },
        include: {
          primaryClient: true,
          scheduledObligations: {
            where: {
              status: { in: ["PENDING", "PARTIALLY_PAID", "OVERDUE"] },
            },
            orderBy: { obligationNumber: "asc" },
          },
        },
      });
    }

    if (!sale) {
      return {
        success: true,
        message: `No active sale found in database for unit ${cleanUnit}, skipping DB payment creation.`,
      };
    }

    // 2. Map Payment Method Enum
    const rawMethod = String(paymentMethod || "TRANSFER").toUpperCase();
    let validMethod: "TRANSFER" | "CHECK" | "CARD" | "CASH" | "DIRECT_DEBIT" | "OTHER" = "TRANSFER";
    if (["TRANSFER", "SPEI", "TRANSFERENCIA"].includes(rawMethod)) {
      validMethod = "TRANSFER";
    } else if (["CHECK", "CHEQUE"].includes(rawMethod)) {
      validMethod = "CHECK";
    } else if (["CARD", "TARJETA"].includes(rawMethod)) {
      validMethod = "CARD";
    } else if (["CASH", "EFECTIVO"].includes(rawMethod)) {
      validMethod = "CASH";
    } else {
      validMethod = "OTHER";
    }

    const receiptFolio = reference || `REC-${Date.now().toString().slice(-6)}`;
    const parsedDate = paymentDate ? new Date(paymentDate) : new Date();

    // 3. Create Payment Receipt
    const receipt = await this.prisma.paymentReceipt.create({
      data: {
        saleId: sale.id,
        payerClientId: sale.primaryClientId,
        receiptFolio,
        paymentDate: isNaN(parsedDate.getTime()) ? new Date() : parsedDate,
        paymentMethod: validMethod,
        amount: payAmount,
        currency: "MXN",
        equivalentAmountInSaleCurrency: payAmount,
        transactionReference: reference || receiptFolio,
        notes: notes || null,
      },
    });

    // 4. Allocate payment amount to pending obligations
    let remaining = payAmount;
    const allocations: any[] = [];

    for (const ob of sale.scheduledObligations) {
      if (remaining <= 0) break;

      const paidSoFarRes = await this.prisma.paymentAllocation.aggregate({
        where: { obligationId: ob.id },
        _sum: { amountApplied: true },
      });
      const paidSoFar = Number(paidSoFarRes._sum?.amountApplied || 0);
      const obTotal = Number(ob.originalAmount);
      const pendingForOb = Math.max(0, obTotal - paidSoFar);

      if (pendingForOb <= 0) continue;

      const allocateThis = Math.min(remaining, pendingForOb);
      const allocation = await this.prisma.paymentAllocation.create({
        data: {
          paymentReceiptId: receipt.id,
          obligationId: ob.id,
          amountApplied: allocateThis,
          amountToPrincipal: allocateThis,
          amountToInterest: 0,
        },
      });

      allocations.push(allocation);
      remaining -= allocateThis;

      // Update obligation status
      const newPaidTotal = paidSoFar + allocateThis;
      const newStatus = newPaidTotal >= obTotal ? "PAID" : "PARTIALLY_PAID";
      await this.prisma.scheduledObligation.update({
        where: { id: ob.id },
        data: {
          status: newStatus,
          paidAmount: newPaidTotal,
          pendingAmount: Math.max(0, obTotal - newPaidTotal),
        },
      });
    }

    return {
      success: true,
      receipt: {
        id: receipt.id,
        receiptFolio: receipt.receiptFolio,
        amount: receipt.amount,
        paymentDate: receipt.paymentDate,
        paymentMethod: receipt.paymentMethod,
        saleId: sale.id,
        clientName: sale.primaryClient.fullName,
      },
      allocationsCount: allocations.length,
      remainingUnallocated: remaining,
    };
  }

  async findAll(saleId?: string) {
    const where: any = {};
    if (saleId) where.saleId = saleId;

    return this.prisma.paymentReceipt.findMany({
      where,
      include: {
        sale: {
          include: {
            unit: true,
            project: true,
            primaryClient: true,
          },
        },
        allocations: {
          include: {
            obligation: true,
          },
        },
      },
      orderBy: { paymentDate: "desc" },
    });
  }
}
