import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

const round2 = (num: number) => Math.round((Number(num || 0) + Number.EPSILON) * 100) / 100;

@Injectable()
export class ClientPortalService {
  constructor(private readonly prisma: PrismaService) {}

  async getProperties(emailParam?: string) {
    if (!emailParam) {
      return {
        success: true,
        user: null,
        properties: [],
      };
    }

    const targetEmail = emailParam.toLowerCase().trim();

    const dbClient = await this.prisma.client.findFirst({
      where: { email: targetEmail },
      include: { developer: true },
      orderBy: { createdAt: "desc" },
    });

    const dbUser = await this.prisma.user.findUnique({
      where: { email: targetEmail },
    });

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
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(clientFullName || "Cliente")}&background=1F3652&color=fff&bold=true`,
      preferredLanguage: "es",
      preferredCurrency: "MXN",
    };

    const orConditions: any[] = [
      { primaryClient: { email: { equals: targetEmail, mode: "insensitive" } } },
      { coOwners: { some: { client: { email: { equals: targetEmail, mode: "insensitive" } } } } },
    ];
    if (dbClient?.id) {
      orConditions.push({ primaryClientId: dbClient.id });
    }

    const dbSales = await this.prisma.sale.findMany({
      where: {
        OR: orConditions,
        status: { in: ["ACTIVE", "RESERVED", "IN_CONTRACT", "LIQUIDATED"] },
      },
      include: {
        project: {
          include: {
            developer: true,
            constructionProgress: { orderBy: { progressDate: "desc" }, take: 1 },
            documents: true,
          },
        },
        unit: true,
        primaryClient: true,
        coOwners: { include: { client: true } },
        paymentPlan: true,
        scheduledObligations: { orderBy: { obligationNumber: "asc" } },
        paymentReceipts: {
          include: {
            payerClient: true,
          },
          orderBy: { paymentDate: "desc" },
        },
        documents: true,
      },
    });

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
      const projLogo =
        (Array.isArray(proj.galleryPaths) && proj.galleryPaths.length > 0 && typeof proj.galleryPaths[0] === "string" && (proj.galleryPaths[0].startsWith("http") || proj.galleryPaths[0].startsWith("data:")))
          ? proj.galleryPaths[0]
          : ((proj as any).logoPath && (proj as any).logoPath.startsWith("http"))
          ? (proj as any).logoPath
          : devLogo;
      const projAddress = dev?.addressLine1 || "Guadalajara, Jalisco";
      const projCover = proj.coverImagePath || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80";

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
          ownershipPct: Math.max(0, 100 - rawCoOwners.reduce((acc: number, c: any) => acc + Number(c.ownershipPercentage || 0), 0)),
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

      const myOwner = allOwnersList.find((o) => (o.email || "").toLowerCase().trim() === targetEmail);
      if (myOwner) {
        myOwnershipPct = myOwner.ownershipPct;
      }
      const myOwnershipRatio = (isCoOwnership && myOwnershipPct > 0 && myOwnershipPct < 100) ? (myOwnershipPct / 100) : 1;

      // Filter receipts belonging to this owner if tagged, or proportion untagged unit receipts
      const allReceipts = sale.paymentReceipts || [];
      const hasTaggedReceipts = isCoOwnership && allReceipts.some((r: any) =>
        r.payerClientId || r.payerClient?.email || r.payerClient?.fullName
      );

      let filteredReceipts: any[] = allReceipts;
      if (isCoOwnership && hasTaggedReceipts) {
        filteredReceipts = allReceipts.filter((r: any) => {
          const pId = r.payerClientId;
          const pEmail = (r.payerClient?.email || "").toLowerCase().trim();
          const pName = (r.payerClient?.fullName || "").toLowerCase().trim();
          const myEmailNorm = targetEmail.toLowerCase().trim();
          const myNameNorm = (myOwner?.name || clientFullName || "").toLowerCase().trim();
          const notes = (r.notes || "").toLowerCase();

          if (pId && (pId === myOwner?.id || pId === dbClient?.id)) return true;
          if (pEmail && (pEmail === myEmailNorm || pEmail.includes(myEmailNorm) || myEmailNorm.includes(pEmail))) return true;
          if (pName && myNameNorm && (pName === myNameNorm || pName.includes(myNameNorm) || myNameNorm.includes(pName))) return true;
          if (notes && (notes.includes(myEmailNorm) || (myNameNorm && notes.includes(myNameNorm)))) return true;
          return false;
        });
      }

      const paymentsList = filteredReceipts.map((r: any) => {
        const rawAmt = Number(r.amount || 0);
        // If receipts were tagged to this owner, rawAmt is already what this owner paid.
        // If receipts were untagged and for the whole unit in co-ownership, scale by myOwnershipRatio.
        const effectiveAmt = round2((isCoOwnership && !hasTaggedReceipts && myOwnershipRatio < 1) ? rawAmt * myOwnershipRatio : rawAmt);
        return {
          id: r.id,
          fechaPago: r.paymentDate ? new Date(r.paymentDate).toISOString().slice(0, 10) : "",
          metodoPago: r.paymentMethod || "Transferencia SPEI",
          monto: effectiveAmt,
          unit: unit.unitNumber,
          reciboFolio: r.receiptFolio || `REC-${r.id.slice(0, 6).toUpperCase()}`,
          comprobanteUrl: r.voucherDocumentId || undefined,
          notes: r.notes || "",
          moratoryAmount: 0,
        };
      });

      const rawAgreedPrice = Number(sale.finalPrice || sale.agreedPrice || unit.basePrice || 0);
      const agreedPrice = round2(rawAgreedPrice * myOwnershipRatio);
      const totalPaid = round2(paymentsList.reduce((acc: number, p: any) => acc + p.monto, 0));
      const totalPending = round2(Math.max(0, agreedPrice - totalPaid));

      let overdueTotal = 0;
      let nextPaymentItem: any = null;
      let remainingClientPaid = totalPaid;

      // Sort obligations in ascending chronological/number order
      const sortedObligations = [...(sale.scheduledObligations || [])].sort((a: any, b: any) => {
        const orderA = a.obligationNumber ?? 0;
        const orderB = b.obligationNumber ?? 0;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });

      const scheduleList = sortedObligations.map((ob: any, idx: number) => {
        const rawScheduledAmount = Number(ob.originalAmount ?? ob.amount ?? 0);
        const scheduledAmount = round2(rawScheduledAmount * myOwnershipRatio);

        let paidAmount = 0;
        if (remainingClientPaid >= scheduledAmount && scheduledAmount > 0) {
          paidAmount = scheduledAmount;
          remainingClientPaid = round2(remainingClientPaid - scheduledAmount);
        } else if (remainingClientPaid > 0) {
          paidAmount = remainingClientPaid;
          remainingClientPaid = 0;
        }

        const pendingAmount = round2(Math.max(0, scheduledAmount - paidAmount));
        const dueDate = new Date(ob.dueDate);
        const isOverdue = pendingAmount > 0 && dueDate.getTime() < now.getTime();

        if (isOverdue) {
          overdueTotal = round2(overdueTotal + pendingAmount);
        }

        const isPaid = (scheduledAmount > 0 && pendingAmount <= 0.01) || (ob.status === "PAID" && pendingAmount <= 0.01);
        const status = isPaid ? "Pagado" : isOverdue ? "Atrasado" : paidAmount > 0 ? "Parcial" : "Pendiente";

        // Accurate concept resolution
        let conceptName = ob.title;
        if (!conceptName || conceptName === "Cuota" || conceptName.startsWith("Mensualidad 0")) {
          const typeStr = String(ob.type || "").toUpperCase();
          if (typeStr.includes("RESERV") || typeStr.includes("APART")) {
            conceptName = "Apartado";
          } else if (typeStr.includes("DOWN") || typeStr.includes("ENGANCHE")) {
            conceptName = "Enganche";
          } else if (typeStr.includes("SETTLE") || typeStr.includes("LIQUIDAC") || typeStr.includes("BALLOON")) {
            conceptName = "Liquidación";
          } else {
            conceptName = `Mensualidad ${ob.obligationNumber || idx + 1}`;
          }
        }

        const schedItem = {
          id: ob.id || `cuota-${idx + 1}`,
          cuotaNumber: ob.obligationNumber || idx + 1,
          concept: conceptName,
          montoProgramado: scheduledAmount,
          fechaProgramada: dueDate.toISOString().slice(0, 10),
          montoPagado: paidAmount,
          montoPendiente: pendingAmount,
          fechaPago: isPaid ? (ob.paymentDate ? new Date(ob.paymentDate).toISOString().slice(0, 10) : dueDate.toISOString().slice(0, 10)) : "Pendiente",
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
      const constructionPct = proj.constructionProgress?.[0]?.overallPercentage
        ? Number(proj.constructionProgress[0].overallPercentage)
        : 45;

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
        specialtiesProgress: [],
        constructionMilestones: [],
        documents: (proj.documents || []).map((d: any) => ({
          id: d.id,
          title: d.title || "Documento",
          category: d.documentType || "General",
          fileSize: "1.2 MB",
          uploadDate: new Date().toLocaleDateString("es-MX"),
          fileUrl: d.filePath,
        })),
        schedule: scheduleList,
        paymentsList,
        customAttributes: [],
        isCoOwnership,
        coOwners: allOwnersList,
        myOwnershipPct,
      });
    }

    return {
      success: true,
      user: userProfile,
      properties,
    };
  }
}
