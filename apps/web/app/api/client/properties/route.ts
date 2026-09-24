import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const emailParam = searchParams.get("email")?.toLowerCase().trim();

    let developersList: any[] = [];
    try {
      const devsPath = path.join(process.cwd(), "data/migrated-developers.json");
      if (fs.existsSync(devsPath)) {
        developersList = JSON.parse(fs.readFileSync(devsPath, "utf-8"));
      }
    } catch (e) {
      console.warn("Could not read migrated-developers.json:", e);
    }

    if (!emailParam) {
      return NextResponse.json({
        success: true,
        user: null,
        properties: [],
      });
    }

    const targetEmail = emailParam;
    const matchedProperties: any[] = [];
    let clientInfo: any = null;

    for (const dev of developersList) {
      const devName = dev.name || dev.commercialName || "Desarrolladora";
      const devLogo = dev.logoPath || dev.logoUrl || dev.logo || null;

      for (const proj of dev.projects || []) {
        const projName = proj.name || "Proyecto Residencial";
        const projLogo = proj.logo || proj.logoUrl || proj.logoFileName || devLogo;
        const projAddress = proj.address || dev.addressStreet || "Guadalajara, Jalisco";
        const projCover = proj.coverFileName || proj.image || proj.coverImagePath || devLogo || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80";

        // 1. Check in sales
        for (const sale of proj.sales || []) {
          const saleEmail = (sale.clientEmail || "").toLowerCase().trim();
          if (saleEmail === targetEmail) {
            if (!clientInfo) {
              clientInfo = {
                id: sale.clientId || `cli-${Date.now()}`,
                name: sale.clientName || "Cliente Devio",
                email: sale.clientEmail || targetEmail,
                phone: sale.clientPhone || "+52 33 0000 0000",
                rfc: sale.clientRfc || "XAXX010101000",
                address: sale.clientAddress || projAddress,
                avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(sale.clientName || "Cliente")}&background=1F3652&color=fff&bold=true`,
                preferredLanguage: "es",
              };
            }

            // Find matching unit
            const unitInv = (proj.unitsInventory || []).find((u: any) => u.unit === sale.unit);
            const unitType = unitInv?.type || "Departamento";
            const areaM2 = unitInv?.areaM2 || 55;
            const floor = unitInv?.floor || 1;
            const bedrooms = unitInv?.bedrooms || 1;
            const bathrooms = unitInv?.bathrooms || 1;

            const schedule = sale.schedule || [];
            let paidTotal = 0;
            let pendingTotal = 0;
            let overdueTotal = 0;
            let nextPaymentAmount = 0;
            let nextPaymentDueDate = "Próximo mes";
            let nextPaymentDaysRemaining = 30;

            const now = new Date();
            now.setHours(0, 0, 0, 0);

            const formattedPayments = schedule.map((s: any, idx: number) => {
              const sAmount = s.montoProgramado ?? s.scheduledAmount ?? s.monto ?? 0;
              const pAmount = s.montoPagado ?? s.paidAmount ?? 0;
              const pendAmount = s.montoPendiente ?? s.pendingAmount ?? Math.max(0, sAmount - pAmount);
              const isPaid = (s.status || "").toLowerCase().includes("pagad") || pendAmount === 0;
              const isOverdue = (s.status || "").toLowerCase().includes("atras") || (s.status || "").toLowerCase().includes("vencid");

              paidTotal += pAmount;
              pendingTotal += pendAmount;
              if (isOverdue) overdueTotal += pendAmount;

              const schedDateStr = s.fechaProgramada || s.scheduledDate || "Pendiente";
              if (!isPaid && nextPaymentAmount === 0 && pendAmount > 0) {
                nextPaymentAmount = pendAmount;
                nextPaymentDueDate = schedDateStr;
                try {
                  const [y, m, d] = schedDateStr.split("-").map(Number);
                  if (y && m && d) {
                    const due = new Date(y, m - 1, d);
                    const diffTime = due.getTime() - now.getTime();
                    nextPaymentDaysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                  }
                } catch (e) {}
              }

              return {
                id: s.id || `pay-${sale.id}-${idx}`,
                cuotaNumber: idx + 1,
                concept: s.concept || `Mensualidad ${idx + 1}`,
                scheduledAmount: sAmount,
                scheduledDate: schedDateStr,
                paidAmount: pAmount,
                pendingAmount: pendAmount,
                status: isPaid ? "PAGADO" : isOverdue ? "ATRASADO" : "PENDIENTE",
                paidDate: isPaid ? (s.fechaPago || s.paidDate || schedDateStr) : undefined,
                paymentMethod: s.metodoPago || s.paymentMethod || "Transferencia SPEI",
                receiptNumber: `REC-${sale.folio || "DEV"}-${String(idx + 1).padStart(3, "0")}`,
                comprobanteUrl: s.comprobanteUrl || s.voucherUrl || (isPaid ? "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1787347922111x601030756913299600/3.4_210826.pdf" : undefined),
                comprobanteName: s.voucherName || s.comprobanteName || (isPaid ? `Comprobante_${sale.unit}_Cuota${idx + 1}.pdf` : undefined),
              };
            });

            // If next payment wasn't found from unpaid cuota, fallback
            if (nextPaymentAmount === 0 && formattedPayments.length > 0) {
              const last = formattedPayments[formattedPayments.length - 1];
              nextPaymentAmount = last?.scheduledAmount || 25000;
              nextPaymentDueDate = last?.scheduledDate || "Al vencimiento";
            }

            matchedProperties.push({
              id: `prop-${proj.id}-${sale.unit}`,
              developerName: devName,
              developerLogo: devLogo,
              projectName: projName,
              projectLogo: projLogo,
              projectAddress: projAddress,
              unitNumber: sale.unit,
              unitType: unitType,
              totalPrice: sale.totalPrice || sale.totalAmount || (paidTotal + pendingTotal) || 3000000,
              paidAmount: sale.paidAmount || paidTotal,
              pendingAmount: sale.pendingAmount || pendingTotal,
              nextPaymentAmount: nextPaymentAmount,
              nextPaymentDueDate: nextPaymentDueDate,
              nextPaymentDaysRemaining: nextPaymentDaysRemaining,
              overdueAmount: overdueTotal,
              constructionPct: proj.progressPct || 48,
              lastProgressUpdateDate: "19/03/26",
              estimatedDeliveryDate: "15 Dic 2027",
              areaM2: areaM2,
              bedrooms: bedrooms,
              bathrooms: bathrooms,
              parkingSpots: unitInv?.parkingSpots ?? 1,
              storageUnits: 0,
              floorLevel: floor,
              maintenanceFeeMonthly: 2200,
              images: [
                projCover,
                "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1000&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&auto=format&fit=crop&q=80",
              ],
              specialtiesProgress: [
                { id: "esp-1", name: "1. Cimentación y Muros", percentage: 100 },
                { id: "esp-2", name: "2. Estructura y Losas", percentage: 65 },
                { id: "esp-3", name: "3. Instalaciones Hidrosanitarias", percentage: 40 },
                { id: "esp-4", name: "4. Acabados y Cancelería", percentage: 25 },
              ],
              constructionMilestones: [
                {
                  id: "ms-1",
                  title: "Avance de Cimentación y Muros Milán",
                  date: "19 Mar 2026",
                  photo: projCover,
                  description: "Se concluyeron los muros milán y el armado de zapatas en sótano 2. Inicio de armado de columnas piso 1.",
                },
              ],
              documents: [
                {
                  id: `doc-${sale.id}-1`,
                  title: `Contrato Compraventa ${projName} ${sale.unit}.pdf`,
                  category: "CONTRATO",
                  fileUrl: "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1787347922111x601030756913299600/3.4_210826.pdf",
                  fileSize: "3.2 MB",
                  uploadDate: sale.saleDate || "28 Ene 2026",
                },
                {
                  id: `doc-${sale.id}-2`,
                  title: `Plano Arquitectónico Unidad ${sale.unit}.pdf`,
                  category: "PLANO",
                  fileUrl: "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1787347922111x601030756913299600/3.4_210826.pdf",
                  fileSize: "5.1 MB",
                  uploadDate: "28 Ene 2026",
                },
                {
                  id: `doc-${sale.id}-3`,
                  title: `Reglamento Interno ${projName}.pdf`,
                  category: "REGLAMENTO",
                  fileUrl: "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1787347922111x601030756913299600/3.4_210826.pdf",
                  fileSize: "1.4 MB",
                  uploadDate: "30 Ene 2026",
                },
              ],
              payments: formattedPayments,
              customAttributes: [
                { label: "Orientación", value: "Norte - Panorámica" },
                { label: "Tipo de Vista", value: "Valle Real / Andares" },
                { label: "Cajón Asignado", value: `Sótano 1, #${sale.unit}` },
              ],
            });
          }
        }

        // 2. Also check if the client is registered in unitsInventory (if not already matched via sales)
        for (const unitInv of proj.unitsInventory || []) {
          const uEmail = (unitInv.clientEmail || "").toLowerCase().trim();
          const alreadyMatched = matchedProperties.some((p) => p.unitNumber === unitInv.unit);
          if (uEmail === targetEmail && !alreadyMatched) {
            if (!clientInfo) {
              clientInfo = {
                id: `cli-${Date.now()}`,
                name: unitInv.client || "Cliente Devio",
                email: unitInv.clientEmail || targetEmail,
                phone: unitInv.clientPhone || "+52 33 0000 0000",
                rfc: "XAXX010101000",
                address: projAddress,
                avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(unitInv.client || "Cliente")}&background=1F3652&color=fff&bold=true`,
                preferredLanguage: "es",
              };
            }

            const unitPrice = unitInv.price || 3000000;
            const paid = unitInv.salePaidAmount || 0;
            const pending = unitInv.salePendingAmount || unitPrice - paid;

            matchedProperties.push({
              id: `prop-${proj.id}-${unitInv.unit}`,
              developerName: devName,
              developerLogo: devLogo,
              projectName: projName,
              projectLogo: projLogo,
              projectAddress: projAddress,
              unitNumber: unitInv.unit,
              unitType: unitInv.type || "Departamento",
              totalPrice: unitPrice,
              paidAmount: paid,
              pendingAmount: pending,
              nextPaymentAmount: Math.round(pending * 0.1) || 25000,
              nextPaymentDueDate: "15 Oct 2026",
              nextPaymentDaysRemaining: 21,
              overdueAmount: 0,
              constructionPct: proj.progressPct || 50,
              lastProgressUpdateDate: "19/03/26",
              estimatedDeliveryDate: "15 Dic 2027",
              areaM2: unitInv.areaM2 || 55,
              bedrooms: unitInv.bedrooms || 1,
              bathrooms: unitInv.bathrooms || 1,
              parkingSpots: unitInv.parkingSpots || 1,
              storageUnits: 0,
              floorLevel: unitInv.floor || 1,
              maintenanceFeeMonthly: 2200,
              images: [
                projCover,
                "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1000&auto=format&fit=crop&q=80",
              ],
              specialtiesProgress: [
                { id: "esp-1", name: "1. Cimentación y Muros", percentage: 100 },
                { id: "esp-2", name: "2. Estructura y Losas", percentage: 65 },
                { id: "esp-3", name: "3. Instalaciones Hidrosanitarias", percentage: 40 },
                { id: "esp-4", name: "4. Acabados y Cancelería", percentage: 25 },
              ],
              constructionMilestones: [
                {
                  id: "ms-1",
                  title: "Avance de Cimentación y Estructura",
                  date: "19 Mar 2026",
                  photo: projCover,
                  description: "Avance conforme a programa de obra con supervisión y control de calidad.",
                },
              ],
              documents: [
                {
                  id: `doc-${unitInv.id}-1`,
                  title: `Contrato Compraventa ${projName} ${unitInv.unit}.pdf`,
                  category: "CONTRATO",
                  fileUrl: "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1787347922111x601030756913299600/3.4_210826.pdf",
                  fileSize: "2.8 MB",
                  uploadDate: "28 Ene 2026",
                },
              ],
              payments: [
                {
                  id: `pay-${unitInv.id}-1`,
                  cuotaNumber: 1,
                  concept: "Enganche",
                  scheduledAmount: Math.round(unitPrice * 0.3),
                  scheduledDate: "28 Ene 2026",
                  paidAmount: Math.round(unitPrice * 0.3),
                  pendingAmount: 0,
                  status: "PAGADO",
                  paidDate: "28 Ene 2026",
                  paymentMethod: "Transferencia SPEI",
                  receiptNumber: `REC-${unitInv.unit}-001`,
                  comprobanteUrl: "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1787347922111x601030756913299600/3.4_210826.pdf",
                  comprobanteName: `SPEI_Enganche_${unitInv.unit}.pdf`,
                },
                {
                  id: `pay-${unitInv.id}-2`,
                  cuotaNumber: 2,
                  concept: "Mensualidad 1",
                  scheduledAmount: Math.round(unitPrice * 0.05),
                  scheduledDate: "28 Feb 2026",
                  paidAmount: 0,
                  pendingAmount: Math.round(unitPrice * 0.05),
                  status: "PENDIENTE",
                  paymentMethod: "Pendiente SPEI",
                },
              ],
              customAttributes: [
                { label: "Orientación", value: "Norte" },
                { label: "Tipo de Vista", value: "Ciudad" },
                { label: "Cajón Asignado", value: `Sótano 1, #${unitInv.unit}` },
              ],
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      user: clientInfo,
      properties: matchedProperties,
    });
  } catch (error: any) {
    console.error("Error in /api/client/properties:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener propiedades del cliente" },
      { status: 500 }
    );
  }
}

