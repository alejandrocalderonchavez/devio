import migratedData from "./migrated-developers.json";
import { ClientProperty, ClientUser, ClientPaymentScheduleItem, ClientPaymentReceiptItem } from "../types/client";

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

  const parsed = new Date(clean);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function resolveClientPropertiesLocal(targetEmail: string): {
  user: ClientUser | null;
  properties: ClientProperty[];
} {
  const cleanEmail = targetEmail.trim().toLowerCase();
  const developersList = (migratedData as any[]) || [];
  const matchedProperties: ClientProperty[] = [];
  let clientInfo: ClientUser | null = null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  for (const dev of developersList) {
    const devName = dev.name || dev.commercialName || "Campero Desarrollos";
    const devLogo = dev.logoPath || dev.logoUrl || dev.logo || undefined;

    for (const proj of dev.projects || []) {
      const projName = proj.name || "Proyecto Residencial";
      const projLogo = proj.logo || proj.logoUrl || proj.logoFileName || devLogo;
      const projAddress = proj.address || dev.addressStreet || "Paseo Valle Real 1050, Zapopan, Jalisco";
      const projCover = proj.coverFileName || proj.image || proj.coverImagePath || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200";

      for (const sale of proj.sales || []) {
        const saleEmail = (sale.clientEmail || "").toLowerCase().trim();
        if (saleEmail === cleanEmail) {
          if (!clientInfo) {
            clientInfo = {
              id: sale.clientId || `cli-${Date.now()}`,
              name: sale.clientName || "Eduardo Arroniz Estefan",
              email: sale.clientEmail || cleanEmail,
              phone: sale.clientPhone || "+52 33 3123 4567",
              rfc: sale.clientRfc || "ARRE800101XYZ",
              address: sale.clientAddress || projAddress,
              avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(sale.clientName || "Cliente")}&background=1F3652&color=fff&bold=true`,
              preferredLanguage: "es",
            };
          }

          const unitInv = (proj.unitsInventory || []).find((u: any) => u.unit === sale.unit);
          const unitType = unitInv?.type || "Local Comercial";
          const areaM2 = unitInv?.areaM2 || 45.5;
          const floor = unitInv?.floor || 1;
          const bedrooms = unitInv?.bedrooms || 0;
          const bathrooms = unitInv?.bathrooms || 1;

          // Process real payments
          const rawPayments = sale.payments || [];
          const paymentsList: ClientPaymentReceiptItem[] = rawPayments.map((p: any, pIdx: number) => ({
            id: p.id || `pay-${sale.id}-${pIdx}`,
            fechaPago: p.paymentDate || p.fechaPago || "",
            metodoPago: p.paymentMethod || p.metodoPago || "Transferencia SPEI",
            monto: round2(Number(p.amount ?? p.monto) || 0),
            unit: sale.unit,
            reciboFolio: p.receiptFolio || p.reciboFolio || `REC-${sale.unit}-00${pIdx + 1}`,
            comprobanteUrl: p.voucherUrl || p.comprobanteUrl || undefined,
            moratoryAmount: round2(Number(p.moratoryAmount) || 0),
          }));

          const totalPaidAvailable = round2(
            paymentsList.length > 0
              ? paymentsList.reduce((acc, p) => acc + (Number(p.monto) || 0), 0)
              : (Number(sale.paidAmount) || 0)
          );

          // Process Schedule with Cascading Amortization
          const rawSchedule = sale.schedule || [];
          let remainingPaid = totalPaidAvailable;

          const sortedSchedule = [...rawSchedule].sort((a: any, b: any) => {
            const dateA = parseDateFlexible(a.scheduledDate || a.fechaProgramada || "")?.getTime() || 0;
            const dateB = parseDateFlexible(b.scheduledDate || b.fechaProgramada || "")?.getTime() || 0;
            return dateA - dateB;
          });

          let overdueTotal = 0;
          let nextPaymentItem: any = null;

          const scheduleList: ClientPaymentScheduleItem[] = sortedSchedule.map((s: any, idx: number) => {
            const sAmount = round2(Number(s.montoProgramado ?? s.scheduledAmount ?? s.monto) || 0);
            const sDate = s.fechaProgramada || s.scheduledDate || "Pendiente";
            const instDate = parseDateFlexible(sDate);
            const isPastDue = Boolean(instDate && instDate < now);

            let pAmount = 0;
            let pendAmount = sAmount;
            let status: "PAGADO" | "PENDIENTE" | "ATRASADO" = "PENDIENTE";
            let pDate = "Pendiente";

            if (round2(remainingPaid) >= round2(sAmount) && sAmount > 0) {
              pAmount = sAmount;
              pendAmount = 0;
              remainingPaid = round2(remainingPaid - sAmount);
              status = "PAGADO";
              pDate = s.paidDate && s.paidDate !== "Pendiente" && s.paidDate !== "Parcial" ? s.paidDate : sDate;
            } else if (remainingPaid > 0.01) {
              pAmount = round2(remainingPaid);
              pendAmount = round2(Math.max(0, sAmount - remainingPaid));
              remainingPaid = 0;
              if (pendAmount <= 0.05) {
                pendAmount = 0;
                status = "PAGADO";
                pDate = sDate;
              } else {
                status = isPastDue ? "ATRASADO" : "PENDIENTE";
                pDate = "Parcial";
              }
            } else {
              pAmount = 0;
              pendAmount = sAmount;
              status = isPastDue ? "ATRASADO" : "PENDIENTE";
              pDate = "Pendiente";
            }

            if (status === "ATRASADO" && pendAmount > 0.05) {
              overdueTotal = round2(overdueTotal + pendAmount);
            }

            if (pendAmount > 0.05 && !nextPaymentItem) {
              let diffDays = 30;
              if (instDate) {
                diffDays = Math.ceil((instDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              }
              nextPaymentItem = {
                amount: pendAmount,
                dueDate: sDate,
                daysRemaining: diffDays,
                concept: s.concept || `Cuota ${idx + 1}`,
                status: status,
              };
            }

            return {
              id: s.id || `inst-${sale.id}-${idx}`,
              cuotaNumber: idx + 1,
              concept: s.concept || (idx === 0 ? "Enganche" : `Cuota ${idx + 1}`),
              amount: sAmount,
              scheduledDate: sDate,
              paidAmount: pAmount,
              saldoPendiente: pendAmount,
              paidDate: pDate !== "Pendiente" && pDate !== "Parcial" ? pDate : undefined,
              paymentMethod: pAmount > 0 ? (s.metodoPago || "Transferencia SPEI") : undefined,
              status: status,
              interestAmount: round2(Number(s.interesMoratorio) || 0),
              receiptNumber: `REC-${sale.unit}-00${idx + 1}`,
            };
          });

          const totalPrice = round2(sale.totalPrice || sale.totalAmount || scheduleList.reduce((acc, s) => acc + s.amount, 0) || 2598308.9);
          const paidAmount = totalPaidAvailable;
          const pendingAmount = round2(Math.max(0, totalPrice - paidAmount));

          if (!nextPaymentItem) {
            nextPaymentItem = {
              amount: 0,
              dueDate: "Al corriente",
              daysRemaining: 0,
              concept: "Sin pagos pendientes",
              status: "PAGADO",
            };
          }

          // Construction progress
          const constructionPct = proj.constructionProgress || proj.constructionPct || 0;
          const specialties = proj.specialtiesProgress || [];
          const milestones = proj.constructionMilestones || [];
          const dynamicDocuments = (proj.clientDocuments || []).filter(
            (d: any) =>
              (d.clientId === sale.clientId || (d.clientName && sale.clientName && d.clientName.toLowerCase() === sale.clientName.toLowerCase()) || d.unit === sale.unit) &&
              d.isVisibleToClient !== false
          );

          matchedProperties.push({
            id: sale.id || `prop-${sale.unit}`,
            clientEmail: cleanEmail,
            developerName: devName,
            developerLogo: devLogo,
            projectName: projName,
            projectLogo: projLogo,
            projectAddress: projAddress,
            unitNumber: sale.unit || "5.2",
            unitType: unitType,
            totalPrice: totalPrice,
            paidAmount: paidAmount,
            pendingAmount: pendingAmount,
            overdueAmount: overdueTotal,
            nextPaymentAmount: nextPaymentItem.amount,
            nextPaymentDueDate: nextPaymentItem.dueDate,
            nextPaymentDaysRemaining: nextPaymentItem.daysRemaining,
            nextPaymentConcept: nextPaymentItem.concept,
            constructionPct: constructionPct,
            lastProgressUpdateDate: proj.lastProgressUpdateDate || "-",
            estimatedDeliveryDate: proj.estimatedDeliveryDate || "Por definir",
            areaM2: areaM2,
            bedrooms: bedrooms,
            bathrooms: bathrooms,
            parkingSpots: unitInv?.parkingSpots || 0,
            storageUnits: 0,
            floorLevel: floor,
            maintenanceFeeMonthly: unitInv?.maintenanceFeeMonthly || 0,
            images: projCover ? [projCover] : [],
            specialtiesProgress: specialties,
            constructionMilestones: milestones,
            documents: dynamicDocuments,
            schedule: scheduleList,
            paymentsList: paymentsList,
            payments: scheduleList,
            customAttributes: unitInv?.customAttributes || [],
          });
        }
      }
    }
  }

  return {
    user: clientInfo,
    properties: matchedProperties,
  };
}
