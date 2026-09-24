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

      // If unit was made AVAILABLE, cancel any active sales linked to this unit
      if (mappedStatus === "AVAILABLE") {
        await prisma.sale.updateMany({
          where: {
            unitId: targetUnit.id,
            status: "ACTIVE",
          },
          data: {
            status: "CANCELLED",
          },
        });

        // Also cancel scheduled obligations for cancelled sales
        const cancelledSales = await prisma.sale.findMany({
          where: { unitId: targetUnit.id, status: "CANCELLED" },
          select: { id: true },
        });

        if (cancelledSales.length > 0) {
          const saleIds = cancelledSales.map((s: any) => s.id);
          await prisma.scheduledObligation.updateMany({
            where: {
              saleId: { in: saleIds },
              status: { in: ["PENDING", "PARTIALLY_PAID", "OVERDUE"] },
            },
            data: {
              status: "CANCELLED",
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Unidad ${unitNumber || unitId} actualizada a ${mappedStatus}`,
    });
  } catch (error: any) {
    console.error("Error updating unit via /api/units:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al actualizar unidad" },
      { status: 500 }
    );
  }
}
