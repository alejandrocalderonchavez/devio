import { NextResponse } from "next/server";
import { prisma } from "@devio/database";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    const whereClause: any = {};
    if (projectId) whereClause.projectId = projectId;

    const additionals = await prisma.unitAdditional.findMany({
      where: whereClause,
      include: {
        unit: true,
        project: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      additionals,
    });
  } catch (error: any) {
    console.error("Error in /api/additionals GET:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al obtener adicionales" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, additionals, name, type, price, status, unitId } = body;

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: "projectId es requerido" },
        { status: 400 }
      );
    }

    // Bulk create or single create
    if (Array.isArray(additionals) && additionals.length > 0) {
      // Upsert/replace additionals for project
      for (const item of additionals) {
        const itemType = String(item.type || item.category || "PARKING").toUpperCase();
        const validItemType: "PARKING" | "STORAGE" | "OTHER" =
          itemType.includes("ESTACIONAMIENTO") || itemType.includes("PARKING") || itemType.includes("CAJON")
            ? "PARKING"
            : itemType.includes("BODEGA") || itemType.includes("STORAGE")
            ? "STORAGE"
            : "OTHER";

        const itemStatus: "AVAILABLE" | "ASSIGNED" | "SOLD" =
          item.status === "VENDIDO" || item.status === "SOLD"
            ? "SOLD"
            : item.status === "ASIGNADO" || item.status === "ASSIGNED"
            ? "ASSIGNED"
            : "AVAILABLE";

        if (item.id && !item.id.startsWith("add-") && item.id.length > 10) {
          await prisma.unitAdditional.upsert({
            where: { id: item.id },
            create: {
              id: item.id,
              projectId,
              name: item.name || "Adicional",
              type: validItemType,
              status: itemStatus,
              price: Number(item.price || 0),
            },
            update: {
              name: item.name || "Adicional",
              type: validItemType,
              status: itemStatus,
              price: Number(item.price || 0),
            },
          }).catch(() => {});
        } else {
          await prisma.unitAdditional.create({
            data: {
              projectId,
              name: item.name || "Adicional",
              type: validItemType,
              status: itemStatus,
              price: Number(item.price || 0),
            },
          }).catch(() => {});
        }
      }

      return NextResponse.json({
        success: true,
        message: `Se sincronizaron ${additionals.length} adicionales en Supabase.`,
      });
    }

    // Single create
    const singleType = String(type || "PARKING").toUpperCase();
    const validSingleType: "PARKING" | "STORAGE" | "OTHER" =
      singleType.includes("ESTACIONAMIENTO") || singleType.includes("PARKING") || singleType.includes("CAJON")
        ? "PARKING"
        : singleType.includes("BODEGA") || singleType.includes("STORAGE")
        ? "STORAGE"
        : "OTHER";

    const created = await prisma.unitAdditional.create({
      data: {
        projectId,
        unitId: unitId || null,
        name: name || "Nuevo Adicional",
        type: validSingleType,
        status: status === "VENDIDO" || status === "SOLD" ? "SOLD" : "AVAILABLE",
        price: Number(price || 0),
      },
    });

    return NextResponse.json({
      success: true,
      additional: created,
    });
  } catch (error: any) {
    console.error("Error in /api/additionals POST:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al guardar adicional en base de datos" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID de adicional es requerido" },
        { status: 400 }
      );
    }

    await prisma.unitAdditional.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Adicional eliminado de Supabase",
    });
  } catch (error: any) {
    console.error("Error in /api/additionals DELETE:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al eliminar adicional" },
      { status: 500 }
    );
  }
}
