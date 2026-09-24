import { NextRequest, NextResponse } from "next/server";
import { getStatementHTML, StatementPDFData } from "../../../../lib/pdf-generator";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = (searchParams.get("email") || "").toLowerCase().trim();
    const unit = searchParams.get("unit") || "";

    let devLogo = "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398110026x731242031517065300/grupo_veq_logo.jpeg";
    let projLogo = "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398492782x453733136803679400/lirica.jpeg";
    let devName = "Grupo VEQ";
    let projName = "Lírica Residencial";
    let clientName = "Cliente Devio";
    let totalPrice = 2500000;
    let paidAmount = 500000;
    let pendingAmount = 2000000;
    let overdueAmount = 0;
    let schedule: Array<{
      cuotaNumber: number;
      concept: string;
      scheduledDate: string;
      amount: number;
      paidAmount?: number;
      status: string;
    }> = [];

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
                totalPrice = Number(sale.totalPrice || sale.totalAmount || totalPrice);
                paidAmount = Number(sale.paidAmount || paidAmount);
                pendingAmount = Math.max(0, totalPrice - paidAmount);

                schedule = (sale.schedule || []).map((s: any, idx: number) => ({
                  cuotaNumber: idx + 1,
                  concept: s.concept || `Cuota ${idx + 1}`,
                  scheduledDate: s.fechaProgramada || s.scheduledDate || "-",
                  amount: Number(s.montoProgramado ?? s.scheduledAmount ?? s.monto) || 0,
                  paidAmount: Number(s.montoPagado) || undefined,
                  status: s.status || "Pendiente",
                }));
                break;
              }
            }
          }
        }
      } catch (e) {
        console.error("Error reading projects in statement route:", e);
      }
    }

    const statementData: StatementPDFData = {
      developerName: devName,
      projectName: projName,
      unitNumber: unit || "5.2",
      clientName: clientName,
      clientEmail: email,
      totalAmount: totalPrice,
      paidAmount: paidAmount,
      pendingAmount: pendingAmount,
      developerLogoUrl: devLogo,
      projectLogoUrl: projLogo,
      installments: schedule.length > 0 ? schedule.map((s) => ({
        concept: s.concept,
        scheduledDate: s.scheduledDate,
        amount: s.amount,
        paidAmount: s.paidAmount,
        status: s.status,
      })) : [
        { concept: "Enganche", scheduledDate: "15 Abr 2026", amount: 500000, paidAmount: 500000, status: "PAGADO" },
        { concept: "Mensualidad 1", scheduledDate: "15 May 2026", amount: 25000, status: "PENDIENTE" },
        { concept: "Mensualidad 2", scheduledDate: "15 Jun 2026", amount: 25000, status: "PENDIENTE" },
      ],
    };

    const innerHTML = getStatementHTML(statementData);

    const fullHTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Estado de Cuenta Oficial - Unidad ${statementData.unitNumber}</title>
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
    .statement-wrapper {
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
      .statement-wrapper { box-shadow: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="action-bar">
    <span style="font-size: 13px; font-weight: 700; color: #64748B;">Estado de Cuenta Oficial</span>
    <button class="btn-print" onclick="window.print()">Imprimir / Guardar PDF</button>
  </div>
  <div class="statement-wrapper">
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
