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
            primaryClient: true,
            unit: true,
            paymentPlan: true,
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
      const mappedSales = (p.sales || []).map((s: any) => {
        const coOwnersList = (s.coOwners || []).map((co: any) => ({
          id: co.clientId || co.id,
          name: co.client?.fullName || "Copropietario",
          email: co.client?.email || "",
          phone: co.client?.phone || "",
          rfc: co.client?.taxId || "",
          ownershipPct: Number(co.ownershipPercentage) || 0,
        }));

        const paidFromReceipts = (s.paymentReceipts || []).reduce((acc: number, r: any) => acc + (Number(r.amount) || 0), 0);
        const paidAmount = paidFromReceipts > 0 ? paidFromReceipts : (s.scheduledObligations || []).reduce((acc: number, o: any) => acc + (Number(o.paidAmount) || 0), 0);
        const totalPrice = Number(s.finalPrice) || Number(s.agreedPrice) || 0;
        const pendingAmount = Math.max(0, totalPrice - paidAmount);

        return {
          id: s.id,
          folio: s.contractNumber || `VTA-${s.id.slice(0, 6).toUpperCase()}`,
          clientId: s.primaryClientId,
          clientName: s.primaryClient?.fullName || "Cliente Devio",
          clientEmail: s.primaryClient?.email || "",
          clientPhone: s.primaryClient?.phone || "",
          clientRfc: s.primaryClient?.taxId || "",
          unit: s.unit?.unitNumber || "U-01",
          paymentPlan: s.paymentPlan?.notes || "Plan Tradicional",
          totalPrice,
          paidAmount,
          pendingAmount,
          saleDate: s.reservationDate ? s.reservationDate.toISOString().slice(0, 10) : s.createdAt.toISOString().slice(0, 10),
          status: s.status === "LIQUIDATED" ? "LIQUIDADA" : s.status === "CANCELLED" ? "CANCELADA" : "ACTIVA",
          coOwners: coOwnersList,
        };
      });

      const mappedUnits = (p.units || []).map((u: any, idx: number) => {
        const matchingSale = mappedSales.find(
          (s: any) => (s.unit === u.unitNumber || s.unitId === u.id) && s.status !== "CANCELADA"
        );
        const clientName = (u.status !== "AVAILABLE" && matchingSale) ? matchingSale.clientName : "-";

        return {
          id: u.id,
          unit: u.unitNumber || `U-${idx + 1}`,
          type: u.category === "HOUSE" ? "Casa" : "Departamento",
          price: Number(u.basePrice) || 3500000,
          areaM2: Number(u.totalAreaM2) || 85,
          floor: u.level || 1,
          status:
            u.status === "AVAILABLE"
              ? "DISPONIBLE"
              : (u.status === "SOLD" || matchingSale)
              ? "VENDIDA"
              : "BLOQUEADA",
          client: clientName,
          saleFolio: u.status !== "AVAILABLE" ? matchingSale?.folio : undefined,
          saleDate: u.status !== "AVAILABLE" ? matchingSale?.saleDate : undefined,
          salePlanName: u.status !== "AVAILABLE" ? matchingSale?.paymentPlan : undefined,
          salePaidAmount: u.status !== "AVAILABLE" ? matchingSale?.paidAmount : undefined,
          salePendingAmount: u.status !== "AVAILABLE" ? matchingSale?.pendingAmount : undefined,
          coOwners: u.status !== "AVAILABLE" ? (matchingSale?.coOwners || []) : [],
        };
      });

      const totalUnits = mappedUnits.length;
      const soldUnits = mappedUnits.filter((u: any) => u.status === "VENDIDA").length;
      const availableUnits = mappedUnits.filter((u: any) => u.status === "DISPONIBLE").length;
      const blockedUnits = Math.max(0, totalUnits - soldUnits - availableUnits);

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
        blockedUnits,
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
