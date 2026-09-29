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
    const validMethod = this.mapPaymentMethod(paymentMethod);
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

    // 4. Recalculate all allocations for this sale
    await this.recalculateSaleObligations(sale.id);

    return {
      success: true,
      receipt: {
        id: receipt.id,
        receiptFolio: receipt.receiptFolio,
        amount: receipt.amount,
        paymentDate: receipt.paymentDate,
        paymentMethod: receipt.paymentMethod,
        saleId: sale.id,
        clientName: sale.primaryClient?.fullName || "Cliente",
      },
    };
  }

  async update(id: string, body: any) {
    const receipt = await this.prisma.paymentReceipt.findUnique({
      where: { id },
      include: { sale: true },
    });

    if (!receipt) {
      throw new NotFoundException(`Recibo de pago con id ${id} no encontrado.`);
    }

    const dataToUpdate: any = {};
    if (body.amount !== undefined) {
      const amt = Number(body.amount);
      if (amt <= 0) throw new BadRequestException("El monto debe ser mayor a 0.");
      dataToUpdate.amount = amt;
      dataToUpdate.equivalentAmountInSaleCurrency = amt;
    }
    if (body.paymentDate !== undefined) {
      const parsed = new Date(body.paymentDate);
      if (!isNaN(parsed.getTime())) {
        dataToUpdate.paymentDate = parsed;
      }
    }
    if (body.paymentMethod !== undefined) {
      dataToUpdate.paymentMethod = this.mapPaymentMethod(body.paymentMethod);
    }
    if (body.receiptFolio !== undefined) {
      dataToUpdate.receiptFolio = String(body.receiptFolio).trim();
    }
    if (body.reference !== undefined || body.transactionReference !== undefined) {
      dataToUpdate.transactionReference = String(body.reference || body.transactionReference).trim();
    }
    if (body.notes !== undefined) {
      dataToUpdate.notes = String(body.notes);
    }

    const updated = await this.prisma.paymentReceipt.update({
      where: { id },
      data: dataToUpdate,
    });

    // Recalculate allocations for the sale
    await this.recalculateSaleObligations(receipt.saleId);

    return {
      success: true,
      receipt: updated,
    };
  }

  async remove(id: string) {
    const receipt = await this.prisma.paymentReceipt.findUnique({
      where: { id },
    });

    if (!receipt) {
      return { success: true, message: "Recibo ya eliminado o no encontrado." };
    }

    const saleId = receipt.saleId;

    // Delete allocations first
    await this.prisma.paymentAllocation.deleteMany({
      where: { paymentReceiptId: id },
    });

    // Delete receipt
    await this.prisma.paymentReceipt.delete({
      where: { id },
    });

    // Recalculate obligations for this sale
    await this.recalculateSaleObligations(saleId);

    return { success: true, message: `Recibo ${id} eliminado con éxito.` };
  }

  public mapPaymentMethod(paymentMethod?: string): "TRANSFER" | "CHECK" | "CARD" | "CASH" | "DIRECT_DEBIT" | "OTHER" {
    const rawMethod = String(paymentMethod || "TRANSFER").toUpperCase().trim();
    if (["TRANSFER", "SPEI", "TRANSFERENCIA", "TRANSFERENCIA SPEI", "SPEI INTERBANCARIO"].some((m) => rawMethod.includes(m) || m.includes(rawMethod))) {
      return "TRANSFER";
    }
    if (["CHECK", "CHEQUE"].some((m) => rawMethod.includes(m))) {
      return "CHECK";
    }
    if (["CARD", "TARJETA", "CREDIT_CARD", "DEBIT_CARD"].some((m) => rawMethod.includes(m))) {
      return "CARD";
    }
    if (["CASH", "EFECTIVO"].some((m) => rawMethod.includes(m))) {
      return "CASH";
    }
    if (["DIRECT_DEBIT", "DOMICILIACION"].some((m) => rawMethod.includes(m))) {
      return "DIRECT_DEBIT";
    }
    return "OTHER";
  }

  public async recalculateSaleObligations(saleId: string) {
    // 1. Fetch obligations ordered by obligationNumber
    const obligations = await this.prisma.scheduledObligation.findMany({
      where: { saleId },
      orderBy: { obligationNumber: "asc" },
    });

    if (obligations.length === 0) return;

    // 2. Fetch all receipts for this sale ordered by paymentDate asc
    const receipts = await this.prisma.paymentReceipt.findMany({
      where: { saleId },
      orderBy: { paymentDate: "asc" },
    });

    // 3. Clear existing allocations for all obligations of this sale
    const obligationIds = obligations.map((o) => o.id);
    await this.prisma.paymentAllocation.deleteMany({
      where: { obligationId: { in: obligationIds } },
    });

    // 4. Track remaining balances
    const obBalances = obligations.map((ob) => ({
      id: ob.id,
      originalAmount: Number(ob.originalAmount),
      paidAmount: 0,
      dueDate: ob.dueDate,
    }));

    // 5. Allocate each receipt in chronological order
    for (const rec of receipts) {
      let receiptRemaining = Number(rec.amount);

      for (const ob of obBalances) {
        if (receiptRemaining <= 0) break;
        const pendingForOb = Math.max(0, ob.originalAmount - ob.paidAmount);
        if (pendingForOb <= 0) continue;

        const alloc = Math.min(receiptRemaining, pendingForOb);
        await this.prisma.paymentAllocation.create({
          data: {
            paymentReceiptId: rec.id,
            obligationId: ob.id,
            amountApplied: alloc,
            amountToPrincipal: alloc,
            amountToInterest: 0,
          },
        });

        ob.paidAmount += alloc;
        receiptRemaining -= alloc;
      }
    }

    // 6. Update all obligations in DB
    const now = new Date();
    for (const ob of obBalances) {
      const isPaid = ob.paidAmount >= ob.originalAmount && ob.originalAmount > 0;
      const isOverdue = Boolean(ob.dueDate && new Date(ob.dueDate) < now && ob.paidAmount < ob.originalAmount);
      const newStatus = isPaid ? "PAID" : isOverdue ? "OVERDUE" : ob.paidAmount > 0 ? "PARTIALLY_PAID" : "PENDING";
      const pendingAmount = Math.max(0, ob.originalAmount - ob.paidAmount);

      await this.prisma.scheduledObligation.update({
        where: { id: ob.id },
        data: {
          paidAmount: ob.paidAmount,
          pendingAmount,
          status: newStatus as any,
        },
      });
    }
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
