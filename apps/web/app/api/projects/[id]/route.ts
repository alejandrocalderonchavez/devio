import { NextResponse } from "next/server";
import { prisma } from "@devio/database";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, coverFileName, image, status, type, unitsInventory } = body;

    if (!id || id.startsWith("proj-")) {
      return NextResponse.json({ success: true, message: "Mock project updated" });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (coverFileName || image) updateData.coverImagePath = coverFileName || image;
    if (status) updateData.status = status;
    if (type) updateData.projectType = type.toUpperCase() === "HORIZONTAL" ? "HORIZONTAL" : "VERTICAL";

    const updated = await prisma.project.update({
      where: { id },
      data: updateData,
    });

    // Update units if provided
    if (Array.isArray(unitsInventory)) {
      for (const u of unitsInventory) {
        if (u.id && u.id.length > 10 && !u.id.startsWith("u-")) {
          await prisma.unit.update({
            where: { id: u.id },
            data: {
              unitNumber: String(u.unit),
              basePrice: Number(u.price) || 0,
              totalAreaM2: Number(u.areaM2 || u.area) || 0,
              status: u.status === "VENDIDA" ? "SOLD" : u.status === "BLOQUEADA" ? "BLOCKED" : "AVAILABLE",
            },
          }).catch(() => {});
        }
      }
    }

    return NextResponse.json({ success: true, project: updated });
  } catch (error: any) {
    console.error("Error in /api/projects/[id] PUT:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al actualizar proyecto" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (id && id.length > 10 && !id.startsWith("proj-")) {
      await prisma.project.delete({
        where: { id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in /api/projects/[id] DELETE:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al eliminar proyecto" },
      { status: 500 }
    );
  }
}
