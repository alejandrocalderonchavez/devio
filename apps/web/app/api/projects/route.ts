import { NextResponse } from "next/server";
import { prisma } from "@devio/database";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const developerId = searchParams.get("developerId");

    const whereClause: any = {};
    if (developerId && developerId.length > 10 && !developerId.startsWith("dev-")) {
      whereClause.developerId = developerId;
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        units: true,
        sales: {
          include: {
            coOwners: {
              include: {
                client: true,
              },
            },
            paymentReceipts: true,
            scheduledObligations: true,
          },
        },
        additionals: true,
        documents: true,
        constructionProgress: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const mappedProjects = projects.map((p: any) => {
      const mappedUnits = (p.units || []).map((u: any, idx: number) => ({
        id: u.id,
        unit: u.unitNumber || `U-${idx + 1}`,
        type: u.category === "HOUSE" ? "Casa" : "Departamento",
        price: Number(u.basePrice) || 3500000,
        areaM2: Number(u.totalAreaM2) || 85,
        floor: u.level || 1,
        status:
          u.status === "SOLD"
            ? "VENDIDA"
            : u.status === "AVAILABLE"
            ? "DISPONIBLE"
            : "BLOQUEADA",
        client: "-",
      }));

      const totalUnits = mappedUnits.length;
      const soldUnits = mappedUnits.filter((u: any) => u.status === "VENDIDA").length;
      const availableUnits = mappedUnits.filter((u: any) => u.status === "DISPONIBLE").length;

      const mappedSales = (p.sales || []).map((s: any) => ({
        id: s.id,
        unit: s.unitId,
        client: s.primaryClientId,
        status: s.status === "LIQUIDATED" ? "LIQUIDADA" : s.status === "CANCELLED" ? "CANCELADA" : "ACTIVA",
        salePrice: Number(s.finalPrice) || Number(s.agreedPrice) || 0,
        paidAmount: (s.paymentReceipts || []).reduce((acc: number, r: any) => acc + (Number(r.amount) || 0), 0),
        folio: s.contractNumber || `VTA-${s.id.slice(0, 6)}`,
        coOwners: (s.coOwners || []).map((co: any) => ({
          id: co.id,
          name: co.client?.name || "",
          email: co.client?.email || "",
          phone: co.client?.phone || "",
          rfc: co.client?.taxId || "",
          ownershipPct: Number(co.ownershipPercentage) || 0,
        })),
      }));

      return {
        id: p.id,
        name: p.name,
        type: p.projectType.toUpperCase(),
        status: p.status,
        image: p.coverImagePath || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
        coverFileName: p.coverImagePath || null,
        totalUnits,
        soldUnits,
        availableUnits,
        blockedUnits: Math.max(0, totalUnits - soldUnits - availableUnits),
        unitsInventory: mappedUnits,
        sales: mappedSales,
        additionals: (p.additionals || []).map((a: any) => ({
          id: a.id,
          name: a.name,
          type: a.type,
          price: Number(a.price),
          status: a.status === "AVAILABLE" ? "DISPONIBLE" : "VENDIDO",
        })),
        documents: (p.documents || []).map((d: any) => ({
          id: d.id,
          name: d.title,
          category: d.category,
          fileUrl: d.filePath,
        })),
      };
    });

    return NextResponse.json({ success: true, projects: mappedProjects });
  } catch (error: any) {
    console.error("Error in /api/projects GET:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al obtener proyectos" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type, developerId, unitsInventory, image, coverFileName } = body;

    if (!name) {
      return NextResponse.json(
        { error: "El nombre del proyecto es requerido." },
        { status: 400 }
      );
    }

    // 1. Find a developer or use the first developer in DB
    let targetDevId = developerId;
    if (!targetDevId || targetDevId.startsWith("dev-")) {
      const firstDev = await prisma.developer.findFirst();
      if (firstDev) {
        targetDevId = firstDev.id;
      } else {
        const newDev = await prisma.developer.create({
          data: { name: "Mi Desarrolladora", email: "contacto@devio.mx" },
        });
        targetDevId = newDev.id;
      }
    }

    const projType = (type || "VERTICAL").toUpperCase() === "HORIZONTAL" ? "HORIZONTAL" : "VERTICAL";

    // 2. Create Project
    const project = await prisma.project.create({
      data: {
        developerId: targetDevId,
        name: name.trim(),
        projectType: projType as any,
        status: "ACTIVE",
        coverImagePath: coverFileName || image || null,
      },
    });

    // 3. Create Units if provided
    if (Array.isArray(unitsInventory) && unitsInventory.length > 0) {
      await prisma.unit.createMany({
        data: unitsInventory.map((u: any, idx: number) => ({
          projectId: project.id,
          unitNumber: String(u.unit || u.unitNumber || `U-${idx + 1}`),
          category: u.type === "Casa" ? "HOUSE" : "APARTMENT",
          status: u.status === "VENDIDA" ? "SOLD" : u.status === "BLOQUEADA" ? "BLOCKED" : "AVAILABLE",
          basePrice: Number(u.price) || 3500000,
          totalAreaM2: Number(u.areaM2 || u.area) || 85,
          level: Number(u.floor || u.level) || 1,
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        type: project.projectType,
        status: project.status,
      },
    });
  } catch (error: any) {
    console.error("Error in /api/projects POST:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al crear proyecto en base de datos" },
      { status: 500 }
    );
  }
}
