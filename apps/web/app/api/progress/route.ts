import { NextResponse } from "next/server";
import { prisma } from "@devio/database";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    const whereClause: any = {};
    if (projectId) whereClause.projectId = projectId;

    const progressList = await prisma.constructionProgress.findMany({
      where: whereClause,
      include: {
        project: true,
      },
      orderBy: { progressDate: "desc" },
    });

    return NextResponse.json({
      success: true,
      progress: progressList,
    });
  } catch (error: any) {
    console.error("Error in /api/progress GET:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al obtener avances de obra" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      projectId,
      title,
      description,
      progressDate,
      overallPercentage,
      specialtyDetails,
      mediaUrls,
      images,
    } = body;

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: "projectId es requerido" },
        { status: 400 }
      );
    }

    const pct = Number(overallPercentage ?? 0);
    const pDate = progressDate ? new Date(progressDate) : new Date();
    const media = Array.isArray(mediaUrls) ? mediaUrls : Array.isArray(images) ? images : [];

    const record = await prisma.constructionProgress.create({
      data: {
        projectId,
        title: title || `Avance de Obra - ${pDate.toLocaleDateString("es-MX")}`,
        description: description || "",
        progressDate: pDate,
        overallPercentage: pct,
        specialtyDetails: specialtyDetails || null,
        mediaUrls: media,
        isClientVisible: true,
      },
    });

    return NextResponse.json({
      success: true,
      progress: record,
    });
  } catch (error: any) {
    console.error("Error in /api/progress POST:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al guardar avance de obra en base de datos" },
      { status: 500 }
    );
  }
}
