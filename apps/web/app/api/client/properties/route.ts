import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const round2 = (num: number) => Math.round((Number(num || 0) + Number.EPSILON) * 100) / 100;

function parseDateFlexible(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  const clean = dateStr.trim();
  if (!clean || clean.toLowerCase() === "pendiente" || clean === "-") return null;

  // Handle ISO format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
    const datePart = clean.split("T")[0] || clean;
    const parts = datePart.split("-").map(Number);
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
  }

  // Handle DD/MM/YYYY or DD-MM-YYYY
  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(clean)) {
    const parts = clean.split(/[\/\-]/).map(Number);
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      return new Date(parts[2], parts[1] - 1, parts[0]);
    }
  }

  // Handle Spanish text dates like "18 Sep 2026", "15 Abr 2026"
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
    const now = new Date();
    now.setHours(0, 0, 0, 0);

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

            // Extract real payments list (Transacciones Reales)
            const rawPayments = sale.payments || [];
            const paymentsList = rawPayments.map((p: any, pIdx: number) => ({
              id: p.id || `pay-${sale.id}-${pIdx}`,
              fechaPago: p.paymentDate || p.fechaPago || "",
              metodoPago: p.paymentMethod || p.metodoPago || "Transferencia SPEI",
              monto: round2(Number(p.amount ?? p.monto) || 0),
              unit: sale.unit,
              reciboFolio: p.receiptFolio || p.reciboFolio || `REC-${(p.id || sale.folio || `${sale.unit}-${pIdx + 1}`).replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase()}`,
              comprobanteUrl: p.voucherUrl || p.comprobanteUrl || undefined,
              voucherName: p.voucherName || (p.comprobanteUrl ? `Comprobante_Pago_${sale.unit}.pdf` : undefined),
              notes: p.notes || "",
              moratoryAmount: round2(Number(p.moratoryAmount) || 0),
            }));

            // If paymentsList is empty but paidAmount > 0, generate synthetic initial payment record
            if (paymentsList.length === 0 && (sale.paidAmount || 0) > 0) {
              paymentsList.push({
                id: `pay-${sale.unit}-init`,
                fechaPago: sale.saleDate || "2026-04-15",
                metodoPago: "Transferencia SPEI",
                monto: round2(sale.paidAmount),
                unit: sale.unit,
                reciboFolio: `REC-${(sale.folio || sale.unit).replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}`,
                comprobanteUrl: undefined,
                voucherName: undefined,
                notes: "Pago inicial registrado",
                moratoryAmount: 0,
              });
            }

            // Calculate total paid available for cascading with proper rounding
            const totalPaidAvailable = round2(
              paymentsList.length > 0
                ? paymentsList.reduce((acc: number, p: any) => acc + (Number(p.monto) || 0), 0)
                : (Number(sale.paidAmount) || 0)
            );

            // Process Schedule (Cuotas Programadas) with Cascading Amortization
            const rawSchedule = sale.schedule || [];
            let remainingPaid = totalPaidAvailable;

            // Sort chronologically
            const sortedSchedule = [...rawSchedule].sort((a: any, b: any) => {
              const dateA = parseDateFlexible(a.scheduledDate || a.fechaProgramada || "")?.getTime() || 0;
              const dateB = parseDateFlexible(b.scheduledDate || b.fechaProgramada || "")?.getTime() || 0;
              return dateA - dateB;
            });

            let overdueTotal = 0;
            let nextPaymentItem: any = null;

            const scheduleList = sortedSchedule.map((s: any, idx: number) => {
              const sAmount = round2(Number(s.montoProgramado ?? s.scheduledAmount ?? s.monto) || 0);
              const sDate = s.fechaProgramada || s.scheduledDate || "Pendiente";
              const instDate = parseDateFlexible(sDate);
              const isPastDue = Boolean(instDate && instDate < now);

              let pAmount = 0;
              let pendAmount = sAmount;
              let status: "Pagado" | "Pendiente" | "Atrasado" | "Parcial" = "Pendiente";
              let pDate = "Pendiente";

              if (round2(remainingPaid) >= round2(sAmount) && sAmount > 0) {
                pAmount = sAmount;
                pendAmount = 0;
                remainingPaid = round2(remainingPaid - sAmount);
                status = "Pagado";
                pDate = s.paidDate && s.paidDate !== "Pendiente" && s.paidDate !== "Parcial" ? s.paidDate : sDate;
              } else if (remainingPaid > 0.01) {
                pAmount = round2(remainingPaid);
                pendAmount = round2(Math.max(0, sAmount - remainingPaid));
                remainingPaid = 0;
                if (pendAmount <= 0.05) {
                  pendAmount = 0;
                  status = "Pagado";
                  pDate = sDate;
                } else {
                  status = isPastDue ? "Atrasado" : "Pendiente";
                  pDate = "Parcial";
                }
              } else {
                pAmount = 0;
                pendAmount = sAmount;
                status = isPastDue ? "Atrasado" : "Pendiente";
                pDate = "Pendiente";
              }

              if (status === "Atrasado" && pendAmount > 0.05) {
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
                  concept: s.concept || (idx === 0 ? "Enganche" : (idx === sortedSchedule.length - 1 ? "Liquidación" : `Mensualidad ${idx}`)),
                  status: status,
                };
              }

              return {
                id: s.id || `inst-${sale.id}-${idx}`,
                cuotaNumber: idx + 1,
                concept: s.concept || (idx === 0 ? "Enganche" : (idx === sortedSchedule.length - 1 ? "Liquidación" : `Mensualidad ${idx}`)),
                montoProgramado: sAmount,
                fechaProgramada: sDate,
                montoPagado: pAmount,
                montoPendiente: pendAmount,
                fechaPago: pDate,
                planPago: s.planPago || s.paymentPlan || sale.paymentPlan || "Plan de Pago",
                metodoPago: pAmount > 0 ? (s.metodoPago || s.paymentMethod || "Transferencia SPEI") : "Pendiente",
                status: status,
                interesMoratorio: round2(Number(s.interesMoratorio) || 0),
              };
            });

            // Financial Summary
            const totalPrice = round2(sale.totalPrice || sale.totalAmount || scheduleList.reduce((acc: number, s: any) => acc + s.montoProgramado, 0) || 2500000);
            const paidAmount = totalPaidAvailable;
            const pendingAmount = round2(Math.max(0, totalPrice - paidAmount));

            // If no next payment found (e.g. fully paid)
            if (!nextPaymentItem) {
              nextPaymentItem = {
                amount: 0,
                dueDate: "Al corriente",
                daysRemaining: 0,
                concept: "Sin pagos pendientes",
                status: "Pagado",
              };
            }

            // Client Documents: extract project.clientDocuments or construct dynamic official documents
            const rawClientDocs = proj.clientDocuments || [];
            const matchingClientDocs = rawClientDocs.filter(
              (d: any) =>
                (d.clientId === sale.clientId || (d.clientName && sale.clientName && d.clientName.toLowerCase() === sale.clientName.toLowerCase()) || d.unit === sale.unit) &&
                d.isVisibleToClient !== false
            );

            const documentsList = matchingClientDocs.map((d: any) => ({
              id: d.id,
              title: d.title,
              category: d.category || "DOCUMENTO",
              fileSize: d.fileSize || "1.2 MB",
              uploadDate: d.uploadDate || d.updatedAt || sale.saleDate || "15 Abr 2026",
              fileUrl: d.url || undefined,
            }));

            // If no custom uploaded client documents, include dynamic authentic contract & technical docs
            if (documentsList.length === 0) {
              documentsList.push(
                {
                  id: `doc-${sale.id}-contrato`,
                  title: `Contrato Oficial de Compraventa - ${projName} (Unidad ${sale.unit}).pdf`,
                  category: "CONTRATO",
                  fileSize: "2.4 MB",
                  uploadDate: sale.saleDate || "15 Abr 2026",
                  fileUrl: "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1787347922111x601030756913299600/3.4_210826.pdf",
                },
                {
                  id: `doc-${sale.id}-reglamento`,
                  title: `Reglamento de Condominio y Régimen de Propiedad - ${projName}.pdf`,
                  category: "REGLAMENTO",
                  fileSize: "1.8 MB",
                  uploadDate: sale.saleDate || "15 Abr 2026",
                  fileUrl: "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1787347922111x601030756913299600/3.4_210826.pdf",
                },
                {
                  id: `doc-${sale.id}-plano`,
                  title: `Plano Arquitectónico y Cuadro de Áreas - Unidad ${sale.unit} (${areaM2} m²).pdf`,
                  category: "PLANO",
                  fileSize: "3.1 MB",
                  uploadDate: sale.saleDate || "15 Abr 2026",
                  fileUrl: "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1787347922111x601030756913299600/3.4_210826.pdf",
                },
                {
                  id: `doc-${sale.id}-acabados`,
                  title: `Ficha Técnica de Acabados y Equipamiento - Unidad ${sale.unit}.pdf`,
                  category: "FICHA TÉCNICA",
                  fileSize: "1.5 MB",
                  uploadDate: sale.saleDate || "15 Abr 2026",
                  fileUrl: "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1787347922111x601030756913299600/3.4_210826.pdf",
                }
              );
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
              totalPrice: totalPrice,
              paidAmount: paidAmount,
              pendingAmount: pendingAmount,
              overdueAmount: overdueTotal,
              nextPaymentAmount: nextPaymentItem.amount,
              nextPaymentDueDate: nextPaymentItem.dueDate,
              nextPaymentDaysRemaining: nextPaymentItem.daysRemaining,
              nextPaymentConcept: nextPaymentItem.concept,
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
              documents: documentsList,
              schedule: scheduleList,
              paymentsList: paymentsList,
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

            const unitPrice = round2(unitInv.price || 3000000);
            const paid = round2(unitInv.salePaidAmount || 0);
            const pending = round2(unitInv.salePendingAmount || unitPrice - paid);

            const fallbackSchedule = [
              {
                id: `inst-${unitInv.id}-1`,
                cuotaNumber: 1,
                concept: "Enganche",
                montoProgramado: round2(unitPrice * 0.3),
                fechaProgramada: "2026-04-15",
                montoPagado: round2(Math.min(paid, unitPrice * 0.3)),
                montoPendiente: round2(Math.max(0, unitPrice * 0.3 - paid)),
                fechaPago: paid >= round2(unitPrice * 0.3) ? "2026-04-15" : "Pendiente",
                planPago: "Plan Tradicional",
                metodoPago: "Transferencia SPEI",
                status: paid >= round2(unitPrice * 0.3) ? "Pagado" : "Pendiente",
                interesMoratorio: 0,
              },
              {
                id: `inst-${unitInv.id}-2`,
                cuotaNumber: 2,
                concept: "Mensualidad 1",
                montoProgramado: round2(unitPrice * 0.05),
                fechaProgramada: "2026-05-15",
                montoPagado: 0,
                montoPendiente: round2(unitPrice * 0.05),
                fechaPago: "Pendiente",
                planPago: "Plan Tradicional",
                metodoPago: "Pendiente",
                status: "Pendiente",
                interesMoratorio: 0,
              },
            ];

            const fallbackPayments = paid > 0 ? [
              {
                id: `pay-${unitInv.id}-1`,
                fechaPago: "2026-04-15",
                metodoPago: "Transferencia SPEI",
                monto: paid,
                unit: unitInv.unit,
                reciboFolio: `REC-${unitInv.unit}-001`,
                comprobanteUrl: undefined,
                voucherName: undefined,
                notes: "Pago inicial registrado",
                moratoryAmount: 0,
              },
            ] : [];

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
              overdueAmount: 0,
              nextPaymentAmount: round2(pending * 0.1) || 25000,
              nextPaymentDueDate: "2026-05-15",
              nextPaymentDaysRemaining: 21,
              nextPaymentConcept: "Mensualidad 1",
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
                  title: `Contrato Oficial de Compraventa - ${projName} Unidad ${unitInv.unit}.pdf`,
                  category: "CONTRATO",
                  fileUrl: "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1787347922111x601030756913299600/3.4_210826.pdf",
                  fileSize: "2.4 MB",
                  uploadDate: "15 Abr 2026",
                },
                {
                  id: `doc-${unitInv.id}-2`,
                  title: `Reglamento Interno y Régimen Condominal - ${projName}.pdf`,
                  category: "REGLAMENTO",
                  fileUrl: "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1787347922111x601030756913299600/3.4_210826.pdf",
                  fileSize: "1.8 MB",
                  uploadDate: "15 Abr 2026",
                },
              ],
              schedule: fallbackSchedule,
              paymentsList: fallbackPayments,
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
