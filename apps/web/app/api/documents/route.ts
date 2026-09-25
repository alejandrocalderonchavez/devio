import { NextResponse } from "next/server";
import { prisma } from "@devio/database";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const clientId = searchParams.get("clientId");
    const developerId = searchParams.get("developerId");

    const whereClause: any = {};
    if (projectId) whereClause.projectId = projectId;
    if (clientId) whereClause.clientId = clientId;
    if (developerId) whereClause.developerId = developerId;

    const documents = await prisma.document.findMany({
      where: whereClause,
      include: {
        project: true,
        client: true,
        unit: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      documents,
    });
  } catch (error: any) {
    console.error("Error in /api/documents GET:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al obtener documentos" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      projectId,
      developerId,
      clientId,
      unitId,
      saleId,
      title,
      type,
      category,
      filePath,
      fileUrl,
      fileSizeBytes,
      mimeType,
    } = body;

    let targetDevId = developerId;
    if (!targetDevId && projectId) {
      const proj = await prisma.project.findUnique({
        where: { id: projectId },
        select: { developerId: true },
      });
      targetDevId = proj?.developerId;
    }

    if (!targetDevId) {
      const firstDev = await prisma.developer.findFirst({ select: { id: true } });
      targetDevId = firstDev?.id;
    }

    if (!targetDevId) {
      return NextResponse.json(
        { success: false, error: "No se encontró developerId para asociar el documento" },
        { status: 400 }
      );
    }

    const rawType = String(type || category || "OTHER").toUpperCase();
    let docType: "QUOTE" | "RECEIPT" | "STATEMENT" | "CONTRACT" | "ID_OFFICIAL" | "PROOF_OF_INCOME" | "TAX_CERTIFICATE" | "BLUEPRINT" | "OTHER" = "OTHER";

    if (rawType.includes("QUOTE") || rawType.includes("COTIZACION")) {
      docType = "QUOTE";
    } else if (rawType.includes("RECEIPT") || rawType.includes("RECIBO")) {
      docType = "RECEIPT";
    } else if (rawType.includes("STATEMENT") || rawType.includes("ESTADO_CUENTA")) {
      docType = "STATEMENT";
    } else if (rawType.includes("CONTRACT") || rawType.includes("CONTRATO")) {
      docType = "CONTRACT";
    } else if (rawType.includes("ID") || rawType.includes("INE") || rawType.includes("PASAPORTE")) {
      docType = "ID_OFFICIAL";
    } else if (rawType.includes("INCOME") || rawType.includes("INGRESOS")) {
      docType = "PROOF_OF_INCOME";
    } else if (rawType.includes("TAX") || rawType.includes("RFC") || rawType.includes("CSF")) {
      docType = "TAX_CERTIFICATE";
    } else if (rawType.includes("BLUEPRINT") || rawType.includes("PLANO")) {
      docType = "BLUEPRINT";
    }

    const storagePath = filePath || fileUrl || "/documents/general.pdf";

    const doc = await prisma.document.create({
      data: {
        developerId: targetDevId,
        projectId: projectId || null,
        clientId: clientId || null,
        unitId: unitId || null,
        saleId: saleId || null,
        title: title || "Documento",
        type: docType,
        storagePath,
        fileSizeBytes: Number(fileSizeBytes || 1024),
        mimeType: mimeType || "application/pdf",
        isClientVisible: true,
      },
    });

    return NextResponse.json({
      success: true,
      document: doc,
    });
  } catch (error: any) {
    console.error("Error in /api/documents POST:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al guardar documento en base de datos" },
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
        { success: false, error: "ID de documento requerido" },
        { status: 400 }
      );
    }

    await prisma.document.delete({
      where: { id },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "Documento eliminado de Supabase",
    });
  } catch (error: any) {
    console.error("Error in /api/documents DELETE:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al eliminar documento" },
      { status: 500 }
    );
  }
}
