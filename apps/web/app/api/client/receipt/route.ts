import { NextRequest, NextResponse } from "next/server";
import { getReceiptHTML, ReceiptPDFData } from "../../../../lib/pdf-generator";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = (searchParams.get("email") || "").toLowerCase().trim();
    const folio = searchParams.get("folio") || "";
    const unit = searchParams.get("unit") || "";
    const montoParam = searchParams.get("monto");
    const dateParam = searchParams.get("date");
    const methodParam = searchParams.get("method");
    const conceptParam = searchParams.get("concept");

    // Attempt to load real project data
    let devLogo = "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398110026x731242031517065300/grupo_veq_logo.jpeg";
    let projLogo = "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398492782x453733136803679400/lirica.jpeg";
    let devName = "Grupo VEQ";
    let projName = "Lírica Residencial";
    let clientName = "Cliente Devio";
    let paymentAmount = montoParam ? Number(montoParam) : 250000;
    let paymentMethod = methodParam || "Transferencia SPEI (BBVA)";
    let emissionDate = dateParam || new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
    let comprobanteUrl: string | undefined = undefined;

    const dataFilePath = join(process.cwd(), "public/data/bubble_projects_real.json");
    if (existsSync(dataFilePath)) {
      try {
        const raw = readFileSync(dataFilePath, "utf-8");
        const projects = JSON.parse(raw);
        if (Array.isArray(projects)) {
          for (const proj of projects) {
            for (const sale of proj.sales || []) {
              const saleEmail = (sale.clientEmail || "").toLowerCase().trim();
              if ((email && saleEmail === email) || (unit && sale.unit === unit)) {
                devName = proj.developerName || proj.desarrolladora || devName;
                projName = proj.name || projName;
                devLogo = proj.developerLogo || devLogo;
                projLogo = proj.logo || projLogo;
                clientName = sale.clientName || sale.client || clientName;

                for (const p of sale.payments || []) {
                  const pFolio = p.receiptFolio || p.reciboFolio || p.folio || "";
                  if (pFolio && folio && (pFolio === folio || folio.includes(pFolio) || pFolio.includes(folio))) {
                    paymentAmount = Number(p.amount ?? p.monto ?? paymentAmount);
                    paymentMethod = p.paymentMethod || p.metodoPago || paymentMethod;
                    emissionDate = p.paymentDate || p.fechaPago || emissionDate;
                    if (p.voucherUrl || p.comprobanteUrl) {
                      comprobanteUrl = p.voucherUrl || p.comprobanteUrl;
                    }
                    break;
                  }
                }
              }
            }
          }
        }
      } catch (e) {
        console.error("Error reading projects in receipt route:", e);
      }
    }

    // If real external voucher PDF URL exists, redirect directly to it
    if (comprobanteUrl && comprobanteUrl.startsWith("http")) {
      return NextResponse.redirect(comprobanteUrl);
    }

    const receiptData: ReceiptPDFData = {
      folio: folio || `REC-${unit || "001"}-01`,
      projectName: projName,
      unitNumber: unit || "5.2",
      clientName: clientName,
      paymentMethod: paymentMethod,
      totalAmount: paymentAmount,
      capitalAmount: paymentAmount,
      interestAmount: 0,
      planName: conceptParam || "Pago de Cuota",
      emissionDate: emissionDate,
      developerLogoUrl: devLogo,
      projectLogoUrl: projLogo,
      developerName: devName,
    };

    const innerHTML = getReceiptHTML(receiptData);

    const fullHTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Recibo de Pago Oficial - ${receiptData.folio}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 24px;
      background-color: #F1F5F9;
      font-family: 'Inter', system-ui, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
      box-sizing: border-box;
    }
    .action-bar {
      width: 100%;
      max-width: 760px;
      margin-bottom: 16px;
      display: flex;
      justifyContent: space-between;
      align-items: center;
    }
    .btn-print {
      background-color: #1F3652;
      color: #FFFFFF;
      border: none;
      padding: 10px 18px;
      border-radius: 9999px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(31, 54, 82, 0.2);
    }
    .receipt-wrapper {
      width: 100%;
      max-width: 760px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
      border-radius: 16px;
      overflow: hidden;
      background: #FFFFFF;
    }
    @media print {
      body { background: #FFFFFF; padding: 0; }
      .action-bar { display: none !important; }
      .receipt-wrapper { box-shadow: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="action-bar">
    <span style="font-size: 13px; font-weight: 700; color: #64748B;">Comprobante Digital Oficial</span>
    <button class="btn-print" onclick="window.print()">Imprimir / Guardar PDF</button>
  </div>
  <div class="receipt-wrapper">
    ${innerHTML}
  </div>
</body>
</html>`;

    return new NextResponse(fullHTML, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
