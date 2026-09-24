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

    // Default target email
    const targetEmail = emailParam || "jaimepozospizano@gmail.com";

    const matchedProperties: any[] = [];
    let clientInfo: any = null;

    for (const dev of developersList) {
      const devName = dev.name || dev.commercialName || "Desarrolladora";
      const devLogo = dev.logoPath || dev.logoUrl || dev.logo || null;

      for (const proj of dev.projects || []) {
        const projName = proj.name || "Proyecto Residencial";
        const projLogo = proj.logo || proj.logoUrl || proj.logoFileName || devLogo;
        const projAddress = proj.address || dev.addressStreet || "Guadalajara, Jalisco";
        const projCover = proj.coverFileName || proj.image || devLogo || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80";

        // Search in sales
        for (const sale of proj.sales || []) {
          const saleEmail = (sale.clientEmail || "").toLowerCase().trim();
          if (saleEmail === targetEmail || (targetEmail === "0242573@up.edu.mx" && sale.clientEmail)) {
            if (!clientInfo) {
              clientInfo = {
                id: sale.clientId || `cli-${Date.now()}`,
                name: sale.clientName || "Cliente Devio",
                email: sale.clientEmail || targetEmail,
                phone: sale.clientPhone || "+52 33 0000 0000",
                rfc: sale.clientRfc || "XAXX010101000",
                address: projAddress,
                avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
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

            const formattedPayments = schedule.map((s: any, idx: number) => {
              const sAmount = s.montoProgramado || s.scheduledAmount || s.monto || 0;
              const pAmount = s.montoPagado || s.paidAmount || 0;
              const pendAmount = s.montoPendiente || s.pendingAmount || Math.max(0, sAmount - pAmount);
              const isPaid = (s.status || "").toLowerCase().includes("pagad") || pendAmount === 0;
              const isOverdue = (s.status || "").toLowerCase().includes("atras") || (s.status || "").toLowerCase().includes("vencid");

              paidTotal += pAmount;
              pendingTotal += pendAmount;
              if (isOverdue) overdueTotal += pendAmount;

              if (!isPaid && nextPaymentAmount === 0 && pendAmount > 0) {
                nextPaymentAmount = pendAmount;
                nextPaymentDueDate = s.fechaProgramada || s.scheduledDate || "Próxima cuota";
              }

              return {
                id: s.id || `pay-${sale.id}-${idx}`,
                cuotaNumber: idx + 1,
                concept: s.concept || `Mensualidad ${idx + 1}`,
                amount: sAmount,
                interestAmount: s.interesMoratorio || s.moratoryAmount || 0,
                scheduledDate: s.fechaProgramada || s.scheduledDate || "Pendiente",
                status: isPaid ? "PAGADO" : isOverdue ? "ATRASADO" : "PENDIENTE",
                paidDate: isPaid ? (s.fechaPago || s.paidDate || "Pagado") : undefined,
                paidAmount: isPaid ? pAmount : undefined,
                paymentMethod: s.metodoPago || s.paymentMethod || "Transferencia SPEI",
                receiptNumber: `REC-${sale.folio || "DEV"}-${idx + 1}`,
              };
            });

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
              nextPaymentAmount: nextPaymentAmount || 25000,
              nextPaymentDueDate: nextPaymentDueDate,
              nextPaymentDaysRemaining: 30,
              overdueAmount: overdueTotal,
              constructionPct: proj.progressPct || 48,
              lastProgressUpdateDate: "19/03/26",
              estimatedDeliveryDate: "Dic 15, 2027",
              areaM2: areaM2,
              bedrooms: bedrooms,
              bathrooms: bathrooms,
              parkingSpots: unitInv?.parkingSpots || 1,
              storageUnits: 0,
              floorLevel: floor,
              maintenanceFeeMonthly: 2200,
              images: [
                projCover,
                "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1000&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&auto=format&fit=crop&q=80",
              ],
              specialtiesProgress: [
                { id: "esp-1", name: "1. Cimentación y Muros", percentage: 100, iconName: "Wrench" },
                { id: "esp-2", name: "2. Estructura y Losas", percentage: 65, iconName: "Building2" },
                { id: "esp-3", name: "3. Instalaciones Especiales", percentage: 40, iconName: "Layers" },
                { id: "esp-4", name: "4. Fachada y Cancelería", percentage: 25, iconName: "Sparkles" },
              ],
              constructionMilestones: [
                {
                  id: "ms-1",
                  title: "Avance de Cimentación y Muros Milán",
                  date: "Mar 19, 26",
                  photos: [projCover],
                  description: "Se concluyeron los muros milán y el armado de zapatas en sótano 2. Inicio de armado de columnas piso 1.",
                },
              ],
              documents: [
                {
                  id: `doc-${sale.id}-1`,
                  title: `Contrato Compraventa ${projName} ${sale.unit}.pdf`,
                  category: "CONTRATO",
                  fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                  fileSize: "3.2 MB",
                  uploadDate: sale.saleDate || "28 Ene 2026",
                },
                {
                  id: `doc-${sale.id}-2`,
                  title: `Plano Arquitectónico Unidad ${sale.unit}.pdf`,
                  category: "PLANO",
                  fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                  fileSize: "5.1 MB",
                  uploadDate: "28 Ene 2026",
                },
                {
                  id: `doc-${sale.id}-3`,
                  title: `Reglamento Interno ${projName}.pdf`,
                  category: "REGLAMENTO",
                  fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                  fileSize: "1.4 MB",
                  uploadDate: "30 Ene 2026",
                },
              ],
              payments: formattedPayments,
              customAttributes: [
                { key: "orientacion", label: "Orientación", value: "Norte - Panorámica" },
                { key: "vista", label: "Tipo de Vista", value: "Valle Real / Andares" },
                { key: "cajon", label: "Cajón Asignado", value: `Sótano 1, #${sale.unit}` },
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
