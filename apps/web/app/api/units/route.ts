import { NextResponse } from "next/server";
import { prisma } from "@devio/database";

const isUuid = (str?: string | null) =>
  Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

async function resolveProjectId(projectId?: string | null): Promise<string | null> {
  if (projectId && isUuid(projectId)) return projectId;
  const firstProject = await prisma.project.findFirst({ select: { id: true } });
  return firstProject?.id || null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectIdParam = searchParams.get("projectId");
    const resolvedProjId = await resolveProjectId(projectIdParam);

    const whereClause: any = {};
    if (resolvedProjId) whereClause.projectId = resolvedProjId;

    const units = await prisma.unit.findMany({
      where: whereClause,
      include: {
        sales: {
          where: { status: { not: "CANCELLED" } },
          include: {
            primaryClient: true,
            paymentPlan: true,
            paymentReceipts: true,
            scheduledObligations: true,
          },
        },
      },
      orderBy: { unitNumber: "asc" },
    });

    return NextResponse.json({
      success: true,
      units,
    });
  } catch (error: any) {
    console.error("Error in /api/units GET:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al obtener unidades" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId: rawProjectId, units, unitNumber, type, price, areaM2, floor, status } = body;

    const projectId = await resolveProjectId(rawProjectId);
    if (!projectId) {
      return NextResponse.json(
        { success: false, error: "Proyecto no encontrado" },
        { status: 400 }
      );
    }

    // Bulk create / update units
    if (Array.isArray(units) && units.length > 0) {
      for (const u of units) {
        const uNum = String(u.unit || u.unitNumber || "").trim();
        if (!uNum) continue;

        const uType = (u.type || "Departamento").toUpperCase() === "CASA" ? "HOUSE" : "APARTMENT";
        const uStatus =
          u.status === "VENDIDA" || u.status === "SOLD"
            ? "SOLD"
            : u.status === "BLOQUEADA" || u.status === "BLOCKED"
            ? "BLOCKED"
            : u.status === "APARTADA" || u.status === "RESERVED"
            ? "RESERVED"
            : "AVAILABLE";

        await prisma.unit.upsert({
          where: {
            projectId_unitNumber: {
              projectId,
              unitNumber: uNum,
            },
          },
          create: {
            projectId,
            unitNumber: uNum,
            category: uType as any,
            status: uStatus as any,
            basePrice: Number(u.price || 3500000),
            totalAreaM2: Number(u.areaM2 || u.area || 85),
            level: Number(u.floor || u.level || 1),
          },
          update: {
            category: uType as any,
            status: uStatus as any,
            basePrice: Number(u.price || 3500000),
            totalAreaM2: Number(u.areaM2 || u.area || 85),
            level: Number(u.floor || u.level || 1),
          },
        }).catch(() => {});
      }

      return NextResponse.json({
        success: true,
        message: `Se sincronizaron ${units.length} unidades en Supabase.`,
      });
    }

    // Single unit create
    const cleanNum = String(unitNumber || "").trim();
    if (!cleanNum) {
      return NextResponse.json(
        { success: false, error: "Número de unidad es requerido" },
        { status: 400 }
      );
    }

    const singleType = (type || "Departamento").toUpperCase() === "CASA" ? "HOUSE" : "APARTMENT";
    const singleStatus =
      status === "VENDIDA" || status === "SOLD"
        ? "SOLD"
        : status === "BLOQUEADA" || status === "BLOCKED"
        ? "BLOCKED"
        : "AVAILABLE";

    const created = await prisma.unit.create({
      data: {
        projectId,
        unitNumber: cleanNum,
        category: singleType as any,
        status: singleStatus as any,
        basePrice: Number(price || 3500000),
        totalAreaM2: Number(areaM2 || 85),
        level: Number(floor || 1),
      },
    });

    return NextResponse.json({
      success: true,
      unit: created,
    });
  } catch (error: any) {
    console.error("Error in /api/units POST:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al registrar unidad en base de datos" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { projectId: rawProjectId, unitNumber, unitId, status, price, areaM2, floor } = body;

    if (!unitNumber && !unitId) {
      return NextResponse.json(
        { success: false, error: "unitNumber o unitId es requerido" },
        { status: 400 }
      );
    }

    // Find unit
    let targetUnit: any = null;
    if (unitId && isUuid(unitId)) {
      targetUnit = await prisma.unit.findUnique({ where: { id: unitId } });
    }

    const resolvedProjId = await resolveProjectId(rawProjectId);

    if (!targetUnit && resolvedProjId && unitNumber) {
      targetUnit = await prisma.unit.findFirst({
        where: {
          projectId: resolvedProjId,
          unitNumber: { equals: String(unitNumber).trim(), mode: "insensitive" },
        },
      });
    }

    if (!targetUnit && unitNumber) {
      targetUnit = await prisma.unit.findFirst({
        where: {
          unitNumber: { equals: String(unitNumber).trim(), mode: "insensitive" },
        },
      });
    }

    // Flexible alphanumeric normalization (e.g. "A-02" matches "A2" / "A02")
    if (!targetUnit && unitNumber) {
      const cleanSearch = String(unitNumber).replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      const allUnits = await prisma.unit.findMany({
        where: resolvedProjId ? { projectId: resolvedProjId } : undefined,
      });
      targetUnit =
        allUnits.find((u: any) => {
          const cleanDb = u.unitNumber.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
          return (
            cleanDb === cleanSearch ||
            cleanDb.replace(/^0+/, "") === cleanSearch.replace(/^0+/, "") ||
            cleanDb === cleanSearch.replace(/^a0*/, "a") ||
            cleanSearch === cleanDb.replace(/^a0*/, "a")
          );
        }) || null;
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

      return NextResponse.json({
        success: true,
        message: `Unidad ${unitNumber || unitId} actualizada a ${mappedStatus} y ventas sincronizadas.`,
        unit: targetUnit,
      });
    }

    return NextResponse.json(
      { success: false, error: "Unidad no encontrada" },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("Error in /api/units PATCH:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al actualizar unidad" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const unitNumber = searchParams.get("unitNumber");
    const projectIdParam = searchParams.get("projectId");
    const resolvedProjId = await resolveProjectId(projectIdParam);

    let targetUnit = null;
    if (id && isUuid(id)) {
      targetUnit = await prisma.unit.findUnique({ where: { id } });
    } else if (unitNumber) {
      if (resolvedProjId) {
        targetUnit = await prisma.unit.findFirst({
          where: { projectId: resolvedProjId, unitNumber: String(unitNumber).trim() },
        });
      }
      if (!targetUnit) {
        targetUnit = await prisma.unit.findFirst({
          where: { unitNumber: String(unitNumber).trim() },
        });
      }
    }

    if (targetUnit) {
      await prisma.unit.delete({
        where: { id: targetUnit.id },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Unidad eliminada de Supabase",
    });
  } catch (error: any) {
    console.error("Error in /api/units DELETE:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al eliminar unidad" },
      { status: 500 }
    );
  }
}
