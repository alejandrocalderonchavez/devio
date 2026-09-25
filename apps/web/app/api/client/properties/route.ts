import { NextResponse } from "next/server";
import { prisma } from "@devio/database";

const round2 = (num: number) => Math.round((Number(num || 0) + Number.EPSILON) * 100) / 100;

function parseDateFlexible(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  const clean = dateStr.trim();
  if (!clean || clean.toLowerCase() === "pendiente" || clean === "-") return null;

  if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
    const datePart = clean.split("T")[0] || clean;
    const parts = datePart.split("-").map(Number);
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
  }

  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(clean)) {
    const parts = clean.split(/[\/\-]/).map(Number);
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      return new Date(parts[2], parts[1] - 1, parts[0]);
    }
  }

  const monthMap: Record<string, number> = {
    ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5,
    jul: 6, ago: 7, sep: 8, sept: 8, oct: 9, nov: 10, dic: 11,
    jan: 0, apr: 3, aug: 7, dec: 11,
  };
  const parts = clean.replace(/,/g, "").split(/\s+/);
  if (parts.length >= 3 && parts[0] && parts[1] && parts[2]) {
    const day = parseInt(parts[0], 10);
    const monthKey = parts[1].toLowerCase().slice(0, 3);
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(year) && monthMap[monthKey] !== undefined) {
      return new Date(year, monthMap[monthKey], day);
    }
  }

  const parsed = new Date(clean);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const emailParam = searchParams.get("email")?.toLowerCase().trim();

    if (!emailParam) {
      return NextResponse.json({
        success: true,
        user: null,
        properties: [],
      });
    }

    const targetEmail = emailParam;

    // 1. Fetch Real Client & User Profile from Supabase (Prisma)
    let dbClient: any = null;
    let dbUser: any = null;
    try {
      dbClient = await prisma.client.findFirst({
        where: { email: targetEmail },
        include: { developer: true },
        orderBy: { createdAt: "desc" },
      });

      dbUser = await prisma.user.findUnique({
        where: { email: targetEmail },
      });
    } catch (dbErr) {
      console.warn("Prisma client profile fetch warning:", dbErr);
    }

    const clientFullName = dbClient?.fullName || dbUser?.fullName || targetEmail.split("@")[0];
    const clientPhone = dbClient?.phone || dbUser?.phone || "+52 33 0000 0000";
    const clientRfc = dbClient?.taxId || "RFC-PENDIENTE";
    const clientAddress = dbClient?.addressLine1 || dbClient?.developer?.addressLine1 || "México";

    const userProfile = {
      id: dbClient?.id || dbUser?.id || `cli-${targetEmail.replace(/[^a-zA-Z0-9]/g, "_")}`,
      name: clientFullName,
      email: targetEmail,
      phone: clientPhone,
      rfc: clientRfc,
      address: clientAddress,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(clientFullName)}&background=1F3652&color=fff&bold=true`,
      preferredLanguage: dbClient?.preferredLanguage ? String(dbClient.preferredLanguage).toLowerCase() : "es",
      preferredCurrency: dbClient?.preferredCurrency ? String(dbClient.preferredCurrency) : "MXN",
    };

    // 2. Fetch Real Active Sales for this client from Supabase
    let dbSales: any[] = [];
    try {
      const orConditions: any[] = [
        { primaryClient: { email: { equals: targetEmail, mode: "insensitive" } } },
        { coOwners: { some: { client: { email: { equals: targetEmail, mode: "insensitive" } } } } },
      ];
      if (dbClient?.id) {
        orConditions.push({ primaryClientId: dbClient.id });
      }

      dbSales = await prisma.sale.findMany({
        where: {
          OR: orConditions,
          status: { in: ["ACTIVE", "RESERVED", "IN_CONTRACT", "LIQUIDATED"] },
        },
        include: {
          project: {
            include: {
              developer: true,
              constructionProgress: {
                orderBy: { progressDate: "desc" },
                take: 1,
              },
              documents: true,
            },
          },
          unit: true,
          primaryClient: true,
          coOwners: {
            include: {
              client: true,
            },
          },
          paymentPlan: true,
          scheduledObligations: {
            orderBy: { obligationNumber: "asc" },
          },
          paymentReceipts: {
            orderBy: { paymentDate: "desc" },
          },
          documents: true,
        },
      });
    } catch (salesErr) {
      console.warn("Prisma sales query error in client properties:", salesErr);
      dbSales = [];
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const properties: any[] = [];

    for (const sale of dbSales) {
      const proj = sale.project;
      const dev = proj?.developer;
      const unit = sale.unit;
      if (!proj || !unit) continue;

      const devName = dev?.name || "Desarrolladora";
      const devLogo = dev?.logoPath || null;
      const projName = proj.name || "Proyecto Residencial";
      const projLogo = devLogo;
      const projAddress = dev?.addressLine1 || "Guadalajara, Jalisco";
      const projCover = proj.coverImagePath || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80";

      // Co-owners
      const rawCoOwners: any[] = sale.coOwners || [];
      const isCoOwnership = rawCoOwners.length > 0;
      let myOwnershipPct = 100;
      const allOwnersList = [
        {
          id: sale.primaryClient?.id || "owner-primary",
          name: sale.primaryClient?.fullName || clientFullName,
          email: sale.primaryClient?.email || targetEmail,
          phone: sale.primaryClient?.phone || clientPhone,
          rfc: sale.primaryClient?.taxId || clientRfc,
          ownershipPct: 100 - rawCoOwners.reduce((acc: number, c: any) => acc + Number(c.ownershipPercentage || 0), 0),
          isMainContact: true,
        },
        ...rawCoOwners.map((c: any) => ({
          id: c.clientId,
          name: c.client?.fullName || "Copropietario",
          email: c.client?.email || "",
          phone: c.client?.phone || "",
          rfc: c.client?.taxId || "",
          ownershipPct: Number(c.ownershipPercentage || 0),
          isMainContact: Boolean(c.isMainContact),
        })),
      ];

      const myOwner = allOwnersList.find((o) => (o.email || "").toLowerCase() === targetEmail);
      if (myOwner) {
        myOwnershipPct = myOwner.ownershipPct;
      }

      // Payments list
      const paymentsList = (sale.paymentReceipts || []).map((r: any) => ({
        id: r.id,
        fechaPago: r.paymentDate ? new Date(r.paymentDate).toISOString().slice(0, 10) : "",
        metodoPago: r.paymentMethod || "Transferencia SPEI",
        monto: round2(Number(r.amount || 0)),
        unit: unit.unitNumber,
        reciboFolio: r.receiptFolio || `REC-${r.id.slice(0, 6).toUpperCase()}`,
        comprobanteUrl: r.voucherDocumentId || undefined,
        notes: r.notes || "",
        moratoryAmount: 0,
      }));

      // Scheduled Obligations
      let overdueTotal = 0;
      let nextPaymentItem: any = null;

      const scheduleList = (sale.scheduledObligations || []).map((ob: any, idx: number) => {
        const scheduledAmount = round2(Number(ob.originalAmount || 0));
        const paidAmount = round2(Number(ob.paidAmount || 0));
        const pendingAmount = round2(Number(ob.pendingAmount || Math.max(0, scheduledAmount - paidAmount)));
        const dueDate = new Date(ob.dueDate);
        const isOverdue = pendingAmount > 0 && dueDate.getTime() < now.getTime();

        if (isOverdue) {
          overdueTotal = round2(overdueTotal + pendingAmount);
        }

        const isPaid = pendingAmount === 0 || ob.status === "PAID";
        const status = isPaid ? "Pagado" : isOverdue ? "Atrasado" : paidAmount > 0 ? "Parcial" : "Pendiente";

        const schedItem = {
          id: ob.id || `cuota-${idx + 1}`,
          cuotaNumber: ob.obligationNumber || idx + 1,
          concept: ob.title || (idx === 0 ? "Enganche" : `Mensualidad ${idx}`),
          montoProgramado: scheduledAmount,
          fechaProgramada: dueDate.toISOString().slice(0, 10),
          montoPagado: paidAmount,
          montoPendiente: pendingAmount,
          fechaPago: isPaid ? dueDate.toISOString().slice(0, 10) : "-",
          planPago: sale.paymentPlan?.notes || "Plan Tradicional",
          metodoPago: isPaid ? "Transferencia SPEI" : "Pendiente",
          status,
          interesMoratorio: 0,
        };

        if (!nextPaymentItem && pendingAmount > 0) {
          const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          nextPaymentItem = {
            amount: pendingAmount,
            dueDate: schedItem.fechaProgramada,
            daysRemaining: diffDays,
            concept: schedItem.concept,
          };
        }

        return schedItem;
      });

      const agreedPrice = round2(Number(sale.finalPrice || sale.agreedPrice || unit.basePrice || 0));
      const totalPaid = round2(paymentsList.reduce((acc: number, p: any) => acc + p.monto, 0));
      const totalPending = round2(Math.max(0, agreedPrice - totalPaid));
      const constructionPct = proj.constructionProgress?.[0]?.overallPercentage
        ? Number(proj.constructionProgress[0].overallPercentage)
        : 45;

      let finalSchedule = scheduleList;
      if (finalSchedule.length === 0 && agreedPrice > 0) {
        const dpPct = Number(sale.paymentPlan?.downPaymentPercentage || 20);
        const instCount = Number(sale.paymentPlan?.installmentsCount || 12);
        const stPct = Number(sale.paymentPlan?.settlementPercentage || 20);
        const dpAmount = round2(agreedPrice * (dpPct / 100));
        const stAmount = round2(agreedPrice * (stPct / 100));
        const remAmount = Math.max(0, agreedPrice - dpAmount - stAmount);
        const monthlyAmount = instCount > 0 ? round2(remAmount / instCount) : 0;

        const generatedSched: any[] = [];
        const baseDate = sale.reservationDate ? new Date(sale.reservationDate) : new Date();

        generatedSched.push({
          id: `sched-dp-${sale.id}`,
          cuotaNumber: 1,
          concept: "Enganche",
          montoProgramado: dpAmount,
          fechaProgramada: baseDate.toISOString().slice(0, 10),
          montoPagado: 0,
          montoPendiente: dpAmount,
          fechaPago: "-",
          planPago: sale.paymentPlan?.notes || "Plan Personalizado",
          metodoPago: "Pendiente",
          status: "Pendiente",
          interesMoratorio: 0,
        });

        for (let i = 1; i <= instCount; i++) {
          const mDate = new Date(baseDate);
          mDate.setMonth(baseDate.getMonth() + i);
          generatedSched.push({
            id: `sched-inst-${sale.id}-${i}`,
            cuotaNumber: i + 1,
            concept: `Mensualidad ${i}`,
            montoProgramado: monthlyAmount,
            fechaProgramada: mDate.toISOString().slice(0, 10),
            montoPagado: 0,
            montoPendiente: monthlyAmount,
            fechaPago: "-",
            planPago: sale.paymentPlan?.notes || "Plan Personalizado",
            metodoPago: "Pendiente",
            status: "Pendiente",
            interesMoratorio: 0,
          });
        }

        if (stAmount > 0) {
          const lDate = new Date(baseDate);
          lDate.setMonth(baseDate.getMonth() + instCount + 1);
          generatedSched.push({
            id: `sched-liq-${sale.id}`,
            cuotaNumber: instCount + 2,
            concept: "Liquidación",
            montoProgramado: stAmount,
            fechaProgramada: lDate.toISOString().slice(0, 10),
            montoPagado: 0,
            montoPendiente: stAmount,
            fechaPago: "-",
            planPago: sale.paymentPlan?.notes || "Plan Personalizado",
            metodoPago: "Pendiente",
            status: "Pendiente",
            interesMoratorio: 0,
          });
        }

        finalSchedule = generatedSched;

        if (!nextPaymentItem && finalSchedule.length > 0) {
          nextPaymentItem = {
            amount: finalSchedule[0].montoPendiente,
            dueDate: finalSchedule[0].fechaProgramada,
            daysRemaining: Math.ceil((new Date(finalSchedule[0].fechaProgramada).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
            concept: finalSchedule[0].concept,
          };
        }
      }

      properties.push({
        id: sale.id,
        developerName: devName,
        developerLogo: devLogo,
        projectName: projName,
        projectLogo: projLogo,
        projectAddress: projAddress,
        unitNumber: unit.unitNumber,
        unitType: unit.category === "HOUSE" ? "Casa" : "Departamento",
        totalPrice: agreedPrice,
        paidAmount: totalPaid,
        pendingAmount: totalPending,
        overdueAmount: overdueTotal,
        nextPaymentAmount: nextPaymentItem?.amount || 0,
        nextPaymentDueDate: nextPaymentItem?.dueDate || "",
        nextPaymentDaysRemaining: nextPaymentItem?.daysRemaining || 0,
        nextPaymentConcept: nextPaymentItem?.concept || "Mensualidad",
        constructionPct,
        lastProgressUpdateDate: new Date().toLocaleDateString("es-MX"),
        estimatedDeliveryDate: "Mayo 2028",
        areaM2: Number(unit.totalAreaM2 || 85),
        bedrooms: unit.bedrooms || 2,
        bathrooms: Number(unit.bathrooms || 2),
        parkingSpots: unit.parkingSpaces || 1,
        storageUnits: unit.storageRooms || 0,
        floorLevel: unit.level || 1,
        maintenanceFeeMonthly: 2500,
        images: [projCover],
        specialtiesProgress: [
          { id: "c1", name: "Cimentación y Estructura", percentage: 90 },
          { id: "c2", name: "Albañilería y Muros", percentage: 50 },
          { id: "c3", name: "Instalaciones Hidrosanitarias", percentage: 35 },
          { id: "c4", name: "Acabados y Carpintería", percentage: 10 },
        ],
        constructionMilestones: [],
        documents: (proj.documents || []).map((d: any) => ({
          id: d.id,
          title: d.title || d.name || "Documento",
          category: d.category || "General",
          fileSize: "1.2 MB",
          uploadDate: new Date().toLocaleDateString("es-MX"),
          fileUrl: d.filePath,
        })),
        schedule: finalSchedule,
        paymentsList,
        customAttributes: [],
        isCoOwnership,
        coOwners: allOwnersList,
        myOwnershipPct,
      });
    }

    return NextResponse.json({
      success: true,
      user: userProfile,
      properties,
    });
  } catch (error: any) {
    console.error("Error in /api/client/properties GET:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al obtener propiedades del cliente", properties: [] },
      { status: 500 }
    );
  }
}
