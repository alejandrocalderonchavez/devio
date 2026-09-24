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

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "El monto del pago es requerido y debe ser mayor a 0." },
        { status: 400 }
      );
    }

    // 1. Find unit and sale
    let sale = await prisma.sale.findFirst({
      where: {
        unit: {
          unitNumber: String(unitNumber || ""),
        },
      },
      include: {
        primaryClient: true,
      },
    });

    if (!sale) {
      // Fallback search by project
      sale = await prisma.sale.findFirst({
        include: {
          primaryClient: true,
        },
      });
    }

    if (sale) {
      const receipt = await prisma.paymentReceipt.create({
        data: {
          saleId: sale.id,
          clientId: sale.primaryClientId,
          amount: Number(amount),
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          paymentMethod: (paymentMethod || "SPEI").toUpperCase() as any,
          reference: reference || `REC-${Date.now().toString().slice(-6)}`,
          status: "APPLIED",
        },
      });

      return NextResponse.json({ success: true, receipt });
    }

    return NextResponse.json({ success: true, message: "Payment processed" });
  } catch (error: any) {
    console.error("Error in /api/payments POST:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al registrar pago en base de datos" },
      { status: 500 }
    );
  }
}
