import { NextResponse } from "next/server";
import { prisma } from "@devio/database";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { projectId, unitNumber, unitId, status, price, areaM2, floor, client } = body;

    if (!unitNumber && !unitId) {
      return NextResponse.json(
        { success: false, error: "unitNumber o unitId es requerido" },
        { status: 400 }
      );
    }

    // Find unit
    let targetUnit = null;
    if (unitId && !unitId.startsWith("u-") && unitId.length > 10) {
      targetUnit = await prisma.unit.findUnique({ where: { id: unitId } });
    }

    if (!targetUnit && projectId && unitNumber) {
      targetUnit = await prisma.unit.findFirst({
        where: {
          projectId,
          unitNumber: String(unitNumber).trim(),
        },
      });
    }

    if (!targetUnit && unitNumber) {
      targetUnit = await prisma.unit.findFirst({
        where: {
          unitNumber: String(unitNumber).trim(),
        },
      });
    }

    // Map status string
    let mappedStatus: "AVAILABLE" | "SOLD" | "BLOCKED" | "RESERVED" = "AVAILABLE";
    if (status === "VENDIDA" || status === "SOLD") {
      mappedStatus = "SOLD";
    } else if (status === "BLOQUEADA" || status === "BLOCKED") {
      mappedStatus = "BLOCKED";
    } else if (status === "APARTADA" || status === "RESERVED") {
      mappedStatus = "RESERVED";
    } else {
      mappedStatus = "AVAILABLE";
    }

    const updateData: any = {
      status: mappedStatus,
    };
    if (price !== undefined) updateData.basePrice = Number(price);
    if (areaM2 !== undefined) updateData.totalAreaM2 = Number(areaM2);
    if (floor !== undefined) updateData.level = Number(floor);

    if (targetUnit) {
      await prisma.unit.update({
        where: { id: targetUnit.id },
        data: updateData,
      });

      // If unit was made AVAILABLE, purge any sales and payments associated with this unit
      if (mappedStatus === "AVAILABLE") {
        const salesToPurge = await prisma.sale.findMany({
          where: { unitId: targetUnit.id },
          select: { id: true },
        });

        if (salesToPurge.length > 0) {
          const saleIds = salesToPurge.map((s: any) => s.id);

          // 1. Delete payment allocations
          await prisma.paymentAllocation.deleteMany({
            where: {
              obligation: { saleId: { in: saleIds } },
            },
          }).catch(() => {});

          // 2. Delete payment receipts
          await prisma.paymentReceipt.deleteMany({
            where: { saleId: { in: saleIds } },
          }).catch(() => {});

          // 3. Delete scheduled obligations
          await prisma.scheduledObligation.deleteMany({
            where: { saleId: { in: saleIds } },
          }).catch(() => {});

          // 4. Delete payment plans
          await prisma.paymentPlan.deleteMany({
            where: { saleId: { in: saleIds } },
          }).catch(() => {});

          // 5. Delete co-owners
          await prisma.saleCoOwner.deleteMany({
            where: { saleId: { in: saleIds } },
          }).catch(() => {});

          // 6. Delete sales
          await prisma.sale.deleteMany({
            where: { id: { in: saleIds } },
          }).catch(() => {});
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Unidad ${unitNumber || unitId} actualizada a ${mappedStatus} y pagos sincronizados correctamente.`,
    });
  } catch (error: any) {
    console.error("Error updating unit via /api/units:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al actualizar unidad" },
      { status: 500 }
    );
  }
}
