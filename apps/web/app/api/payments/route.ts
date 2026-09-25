import { NextResponse } from "next/server";
import { prisma } from "@devio/database";

export async function POST(request: Request) {
  try {
    const body = await request.json();
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
      return NextResponse.json(
        { error: "El monto del pago es requerido y debe ser mayor a 0." },
        { status: 400 }
      );
    }

    const cleanUnit = String(unitNumber || "").trim();

    // 1. Find Sale matching the unit
    let sale = await prisma.sale.findFirst({
      where: {
        unit: {
          unitNumber: cleanUnit,
        },
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
      sale = await prisma.sale.findFirst({
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
      return NextResponse.json({
        success: true,
        message: `No active sale found in database for unit ${cleanUnit}, skipping DB payment creation.`,
      });
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

    // 3. Create Payment Receipt in Supabase (payment_receipts table)
    const receipt = await prisma.paymentReceipt.create({
      data: {
        saleId: sale.id,
        payerClientId: sale.primaryClientId,
        receiptFolio,
        paymentDate: parsedDate,
        paymentMethod: validMethod,
        amount: payAmount,
        currency: "MXN",
        equivalentAmountInSaleCurrency: payAmount,
        transactionReference: reference || receiptFolio,
        notes: notes || "Pago registrado en portal/panel de DEVIO",
      },
    });

    // 4. Cascade and Allocate Payment across pending Scheduled Obligations (scheduled_obligations table)
    let remainingToAllocate = payAmount;
    const pendingObligations = sale.scheduledObligations || [];

    for (const ob of pendingObligations) {
      if (remainingToAllocate <= 0) break;

      const obPending = Number(ob.pendingAmount || Math.max(0, Number(ob.originalAmount) - Number(ob.paidAmount)));
      const alloc = Math.min(remainingToAllocate, obPending);
      const newPaid = Number(ob.paidAmount || 0) + alloc;
      const newPending = Math.max(0, obPending - alloc);
      remainingToAllocate -= alloc;

      // Update obligation
      await prisma.scheduledObligation.update({
        where: { id: ob.id },
        data: {
          paidAmount: newPaid,
          pendingAmount: newPending,
          status: newPending === 0 ? "PAID" : "PARTIALLY_PAID",
        },
      });

      // Record allocation
      await prisma.paymentAllocation.create({
        data: {
          paymentReceiptId: receipt.id,
          obligationId: ob.id,
          amountApplied: alloc,
          amountToPrincipal: alloc,
          amountToInterest: 0,
        },
      }).catch((e: any) => console.warn("Allocation creation warning:", e));
    }

    return NextResponse.json({
      success: true,
      receipt: {
        id: receipt.id,
        receiptFolio: receipt.receiptFolio,
        amount: receipt.amount,
        paymentDate: receipt.paymentDate,
      },
    });
  } catch (error: any) {
    console.error("Error in /api/payments POST:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al registrar pago en base de datos" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const saleId = searchParams.get("saleId");
    const unitNumber = searchParams.get("unitNumber");

    const whereClause: any = {};
    if (saleId) whereClause.saleId = saleId;
    if (unitNumber) whereClause.sale = { unit: { unitNumber } };

    const receipts = await prisma.paymentReceipt.findMany({
      where: whereClause,
      include: {
        payerClient: true,
        sale: {
          include: {
            unit: true,
            project: true,
          },
        },
      },
      orderBy: { paymentDate: "desc" },
    });

    return NextResponse.json({
      success: true,
      receipts,
    });
  } catch (error: any) {
    console.error("Error in /api/payments GET:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al obtener pagos" },
      { status: 500 }
    );
  }
}
