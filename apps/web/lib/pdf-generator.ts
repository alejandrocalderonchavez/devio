/**
 * Devio PDF Generator Engine
 * Generates pixel-perfect PDFs for Receipts, Quotes, and Account Statements
 * using dynamic high-resolution canvas rendering and jsPDF/html2pdf.
 */

declare global {
  interface Window {
    html2pdf?: any;
    html2canvas?: any;
    jspdf?: any;
  }
}

// Helper to load external CDN scripts on demand
export async function loadPDFLibraries(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  if (window.html2canvas && window.jspdf && window.html2pdf) {
    return true;
  }

  const loadScript = (src: string) =>
    new Promise<boolean>((resolve) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });

  try {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js");
    return true;
  } catch (err) {
    console.error("Error loading PDF scripts:", err);
    return false;
  }
}

// Helper to ensure all images in a DOM element finish loading before PDF rasterization
export async function waitForImagesToLoad(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll("img"));
  if (images.length === 0) return;
  await Promise.all(
    images.map((img) => {
      if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.addEventListener("load", () => resolve(), { once: true });
        img.addEventListener("error", () => resolve(), { once: true });
        setTimeout(resolve, 2500);
      });
    })
  );
}

// -----------------------------------------------------------------------------
// 1. RECIBO DE PAGO PDF & PREVIEW
// -----------------------------------------------------------------------------
export interface ReceiptPDFData {
  folio: string;
  projectName: string;
  unitNumber: string;
  clientName: string;
  paymentMethod: string;
  totalAmount: number;
  capitalAmount?: number;
  interestAmount?: number;
  planName?: string;
  emissionDate?: string;
  developerLogoUrl?: string;
  projectLogoUrl?: string;
  developerName?: string;
}

const DEFAULT_DEV_LOGO =
  "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398110026x731242031517065300/grupo_veq_logo.jpeg";
const DEFAULT_PROJ_LOGO =
  "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398492782x453733136803679400/lirica.jpeg";

export function getReceiptHTML(data: ReceiptPDFData): string {
  const fechaEmision =
    data.emissionDate ||
    new Date().toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val || 0);

  const hasInterest = (data.interestAmount || 0) > 0;
  const capital = data.capitalAmount ?? (data.totalAmount - (data.interestAmount || 0));

  const devLogo =
    data.developerLogoUrl && (data.developerLogoUrl.startsWith("http") || data.developerLogoUrl.startsWith("data:"))
      ? data.developerLogoUrl
      : DEFAULT_DEV_LOGO;

  const projLogo =
    data.projectLogoUrl && (data.projectLogoUrl.startsWith("http") || data.projectLogoUrl.startsWith("data:"))
      ? data.projectLogoUrl
      : DEFAULT_PROJ_LOGO;

  return `
    <div id="rp-pdf-container" style="
      width: 760px;
      max-width: 100%;
      background: #ffffff;
      margin: 0 auto;
      padding: 36px 40px;
      box-sizing: border-box;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      color: #111827;
      position: relative;
    ">
      <!-- HEADER CON LOGOS REALES -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1F3652; padding-bottom: 18px; margin-bottom: 22px;">
        <div style="display: flex; align-items: center; gap: 14px;">
          <img src="${devLogo}" style="height: 42px; max-width: 140px; object-fit: contain;" alt="${data.developerName || "Desarrolladora"}" onerror="this.onerror=null; this.src='https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398110026x731242031517065300/grupo_veq_logo.jpeg';" />
          <div style="width: 1.5px; height: 32px; background: #CBD5E1;"></div>
          <img src="${projLogo}" style="height: 42px; max-width: 140px; object-fit: contain; border-radius: 4px;" alt="${data.projectName}" onerror="this.onerror=null; this.src='https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398492782x453733136803679400/lirica.jpeg';" />
        </div>

        <div style="text-align: right; font-size: 12px; line-height: 1.6; color: #4b5563;">
          <div><strong style="color: #1F3652;">Folio:</strong> #${data.folio}</div>
          <div><strong style="color: #1F3652;">Fecha Emisión:</strong> ${fechaEmision}</div>
          <div><strong style="color: #1F3652;">Método:</strong> ${data.paymentMethod}</div>
        </div>
      </div>

      <!-- TÍTULO DE RECIBO -->
      <div style="margin-bottom: 20px;">
        <h1 style="font-size: 24px; font-weight: 800; color: #111827; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">
          Recibo de Pago Oficial
        </h1>
        <p style="font-size: 13.5px; color: #1F3652; margin: 4px 0 0 0; font-weight: 600;">
          ${data.projectName} • Unidad ${data.unitNumber}
        </p>
      </div>

      <!-- BANNER ÉXITO -->
      <div style="background: #f0fdf4; border: 1px solid #86efac; border-left: 4px solid #16a34a; border-radius: 7px; padding: 14px 18px; display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
        <div style="width: 28px; height: 28px; background: #16a34a; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: white; font-weight: bold; font-size: 14px;">
          ✓
        </div>
        <div>
          <h2 style="color: #166534; margin: 0; font-size: 14.5px; font-weight: 700;">Confirmación de Transacción Exitosa</h2>
          <p style="color: #166534; margin: 2px 0 0 0; font-size: 11.5px; opacity: 0.85;">El pago ha sido registrado y aplicado correctamente en el sistema.</p>
        </div>
      </div>

      <!-- CARDS RESUMEN -->
      <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 24px;">
        <div style="width: 100%; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px 18px; border-top: 3px solid #1F3652;">
          <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.07em; color: #9ca3af; font-weight: 700; margin-bottom: 4px;">
            Monto Total Pagado
          </div>
          <div style="font-size: 24px; font-weight: 800; color: #1F3652;">
            ${formatMoney(data.totalAmount)}
          </div>
        </div>

        ${
          hasInterest
            ? `
          <div style="width: calc(50% - 6px); background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; border-top: 3px solid #1F3652;">
            <div style="font-size: 9.5px; text-transform: uppercase; color: #9ca3af; font-weight: 700; margin-bottom: 4px;">A Capital</div>
            <div style="font-size: 18px; font-weight: 800; color: #111827;">${formatMoney(capital)}</div>
          </div>
          <div style="width: calc(50% - 6px); background: #fff5f5; border: 1px solid #fca5a5; border-radius: 8px; padding: 12px 16px; border-top: 3px solid #dc2626;">
            <div style="font-size: 9.5px; text-transform: uppercase; color: #dc2626; font-weight: 700; margin-bottom: 4px;">A Interés Moratorio</div>
            <div style="font-size: 18px; font-weight: 800; color: #dc2626;">${formatMoney(data.interestAmount || 0)}</div>
          </div>
        `
            : ""
        }
      </div>

      <!-- TABLA DETALLES -->
      <table style="width: 100%; border-collapse: collapse; font-size: 12.5px; margin-bottom: 20px;">
        <thead>
          <tr>
            <th style="background: #1F3652; color: #ffffff; padding: 10px 12px; text-align: left; text-transform: uppercase; font-size: 10.5px; border-radius: 6px 0 0 0;">
              Detalles del Pagador
            </th>
            <th style="background: #1F3652; color: #ffffff; padding: 10px 12px; text-align: left; text-transform: uppercase; font-size: 10.5px; border-radius: 0 6px 0 0;">
              Información de la Propiedad
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border-bottom: 1px solid #e5e7eb; padding: 12px; vertical-align: top; line-height: 1.6;">
              <strong style="color: #1F3652;">Nombre:</strong> ${data.clientName}<br/>
              <strong style="color: #1F3652;">Estatus:</strong> 
              <span style="background: #dcfce7; color: #166534; font-size: 10.5px; font-weight: 700; padding: 2px 8px; border-radius: 99px;">
                Aplicado
              </span>
            </td>
            <td style="border-bottom: 1px solid #e5e7eb; padding: 12px; vertical-align: top; line-height: 1.6;">
              <strong style="color: #1F3652;">Proyecto:</strong> ${data.projectName}<br/>
              <strong style="color: #1F3652;">Unidad:</strong> ${data.unitNumber}<br/>
              <strong style="color: #1F3652;">Plan Asignado:</strong> ${data.planName || "Esquema Regular"}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- DISCLAIMER -->
      <div style="font-size: 10.5px; color: #9ca3af; text-align: justify; padding: 12px 14px; background: #fafafa; border: 1px dashed #e5e7eb; border-radius: 6px; margin-top: 18px; line-height: 1.5;">
        <p style="margin: 0 0 6px 0;">
          <strong style="color: #6b7280;">Nota importante:</strong> Este documento es un comprobante generado automáticamente por la plataforma tras la confirmación del pago.
        </p>
        <p style="margin: 0; font-size: 0.95em; opacity: 0.85;">
          <strong style="color: #6b7280;">Aviso Legal:</strong> Este documento es estrictamente un recibo de pago emitido con fines informativos y de control interno. No constituye un título valor ni certificación fiscal.
        </p>
      </div>

      <!-- FOOTER -->
      <div style="margin-top: 20px; padding-top: 12px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; font-size: 10.5px; color: #9ca3af;">
        <span>Generado vía <strong style="color: #1F3652; opacity: 0.7;">Devio Platform</strong></span>
        <span>deviomx.com</span>
      </div>
    </div>
  `;
}

export function openReceiptInNewTab(data: ReceiptPDFData) {
  if (typeof window === "undefined") return;
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const html = getReceiptHTML(data);
  const fullDocument = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <title>Recibo de Pago - Unidad ${data.unitNumber} (${data.folio})</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm;
        }
        body {
          margin: 0;
          padding: 30px 16px;
          background-color: #F1F5F9;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .top-toolbar {
          width: 760px;
          max-width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .action-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }
        .btn-print {
          background-color: #1F3652;
          color: #ffffff;
        }
        .btn-print:hover {
          background-color: #152538;
        }
        .document-wrapper {
          width: 760px;
          max-width: 100%;
          background: #ffffff;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        @media print {
          body {
            background: #ffffff;
            padding: 0;
          }
          .top-toolbar {
            display: none !important;
          }
          .document-wrapper {
            box-shadow: none;
            border-radius: 0;
            width: 100%;
          }
        }
      </style>
    </head>
    <body>
      <div class="top-toolbar">
        <span style="font-size: 13px; color: #64748B; font-weight: 600;">Vista Previa de Recibo Oficial</span>
        <div style="display: flex; gap: 8px;">
          <button class="action-btn btn-print" onclick="window.print()">
            🖨️ Imprimir / Guardar en PDF
          </button>
        </div>
      </div>
      <div class="document-wrapper">
        ${html}
      </div>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(fullDocument);
  printWindow.document.close();
}

export async function generateReceiptPDF(data: ReceiptPDFData): Promise<{ success: boolean; base64?: string }> {
  if (typeof window === "undefined") return { success: false };
  await loadPDFLibraries();

  const html = getReceiptHTML(data);

  // Render ghost node
  const ghost = document.createElement("div");
  ghost.style.position = "fixed";
  ghost.style.top = "-9999px";
  ghost.style.left = "0";
  ghost.style.width = "800px";
  ghost.style.background = "#fff";
  ghost.innerHTML = html;
  document.body.appendChild(ghost);

  try {
    // Wait for all images in ghost to finish loading
    await waitForImagesToLoad(ghost);

    const element = ghost.querySelector("#rp-pdf-container");
    const opt = {
      margin: 0,
      filename: `Recibo_${data.unitNumber}_${data.folio}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, allowTaint: true, width: 800 },
      jsPDF: { unit: "pt", format: "a4", orientation: "portrait" },
    };

    if (window.html2pdf) {
      await window.html2pdf().set(opt).from(element).save();
    }
    return { success: true };
  } catch (err) {
    console.error("Error generating receipt PDF:", err);
    return { success: false };
  } finally {
    ghost.remove();
  }
}

// -----------------------------------------------------------------------------
// 2. COTIZACIÓN COMERCIAL PDF
// -----------------------------------------------------------------------------
export interface QuotePDFData {
  quoteFolio: string;
  projectName: string;
  unitNumber: string;
  unitType: string;
  superficieM2: number;
  deliveryDate?: string;
  listPrice: number;
  discountPct?: number;
  discountAmount?: number;
  totalQuoteAmount: number;
  planName: string;
  downPaymentAmount: number;
  downPaymentPct?: number;
  installmentsCount: number;
  installmentAmount: number;
  settlementAmount: number;
  settlementPct?: number;
  additionals?: Array<{ name: string; price: number }>;
  isCoOwnership?: boolean;
  coOwners?: Array<{
    name: string;
    email?: string;
    phone?: string;
    rfc?: string;
    ownershipPct?: number;
  }>;
  client: {
    name: string;
    email?: string;
    phone?: string;
    rfc?: string;
    ownershipPct?: number;
  };
  advisor: {
    name: string;
    role?: string;
    email?: string;
    phone?: string;
  };
  unitImageUrl?: string;
  projectCoverUrl?: string;
  floorPlanUrl?: string;
  developerLogoUrl?: string;
  projectLogoUrl?: string;
  developerName?: string;
  characteristics?: Array<{ label: string; value: string }>;
  notes?: string;
  brandColor?: string;
}

export function getQuoteHTML(data: QuotePDFData): string {
  const brand = data.brandColor || "#1F3652";
  const emissionDate = new Date().toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val || 0);

  const devLogo =
    data.developerLogoUrl && (data.developerLogoUrl.startsWith("http") || data.developerLogoUrl.startsWith("data:"))
      ? data.developerLogoUrl
      : DEFAULT_DEV_LOGO;

  const projLogo =
    data.projectLogoUrl && (data.projectLogoUrl.startsWith("http") || data.projectLogoUrl.startsWith("data:"))
      ? data.projectLogoUrl
      : DEFAULT_PROJ_LOGO;

  // Fallback for unit image: if unit has no photo, use project cover / image
  const unitPhoto =
    data.unitImageUrl && (data.unitImageUrl.startsWith("http") || data.unitImageUrl.startsWith("data:"))
      ? data.unitImageUrl
      : data.projectCoverUrl && (data.projectCoverUrl.startsWith("http") || data.projectCoverUrl.startsWith("data:"))
      ? data.projectCoverUrl
      : data.projectLogoUrl && (data.projectLogoUrl.startsWith("http") || data.projectLogoUrl.startsWith("data:"))
      ? data.projectLogoUrl
      : DEFAULT_PROJ_LOGO;

  // Co-ownership calculation
  const isCoprop = data.isCoOwnership || (data.coOwners && data.coOwners.length > 0);
  const coOwnersList = data.coOwners || [];

  return `
    <div id="cot-pdf-container" style="
      width: 794px;
      min-height: 1080px;
      max-width: 794px;
      overflow: hidden;
      background: #ffffff;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 10px;
      color: #1F2937;
      box-sizing: border-box;
      position: relative;
    ">
      <!-- TOP GRADIENT BAND -->
      <div style="height: 5px; background: linear-gradient(90deg, #1B3047 0%, #2F80ED 100%); flex-shrink: 0;"></div>

      <!-- HEADER WITH OFFICIAL LOGOS -->
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1.5px solid #E2E8F0; padding: 12px 20px; background: #FFFFFF; flex-shrink: 0; gap: 16px;">
        <!-- Left Logo: Developer -->
        <div style="display: flex; align-items: center; gap: 10px; flex-shrink: 0; max-width: 170px;">
          <img src="${devLogo}" style="max-height: 42px; max-width: 150px; object-fit: contain;" crossorigin="anonymous" alt="${data.developerName || "Desarrollador"}" />
        </div>

        <!-- Center: Title & Main Info -->
        <div style="flex: 1; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <div style="font-size: 8px; font-weight: 800; color: #2F80ED; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 2px;">
            Cotización Comercial Oficial
          </div>
          <div style="font-size: 18px; font-weight: 900; color: #1B3047; letter-spacing: -0.3px; line-height: 1.1;">
            Propuesta de Unidad
          </div>
          <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 5px; flex-wrap: wrap;">
            <span style="background: #F1F5F9; color: #1E293B; font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 4px; border: 1px solid #E2E8F0;">
              Folio: <strong>${data.quoteFolio}</strong>
            </span>
            <span style="background: #EFF6FF; color: #1D4ED8; font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 4px; border: 1px solid #BFDBFE;">
              Unidad: <strong>${data.unitNumber}</strong> (${data.unitType})
            </span>
            <span style="font-size: 9px; color: #64748B; font-weight: 600;">
              Emisión: ${emissionDate}
            </span>
          </div>
        </div>

        <!-- Right Logo: Project -->
        <div style="display: flex; align-items: center; justify-content: flex-end; gap: 10px; flex-shrink: 0; max-width: 170px;">
          <img src="${projLogo}" style="max-height: 42px; max-width: 150px; object-fit: contain; border-radius: 4px;" crossorigin="anonymous" alt="${data.projectName}" />
        </div>
      </div>

      <!-- MAIN CONTENT BODY -->
      <div style="display: flex; flex: 1; min-height: 0;">
        <!-- LEFT COLUMN (Visuals, Clients, Advisor) -->
        <div style="width: 290px; flex-shrink: 0; border-right: 1.5px solid #E2E8F0; background: #F8FAFC; display: flex; flex-direction: column; padding: 14px; gap: 10px; box-sizing: border-box;">
          
          <!-- Unit / Project Photo Render -->
          <div style="width: 100%; height: 180px; border-radius: 8px; overflow: hidden; position: relative; background: #E2E8F0; border: 1px solid #CBD5E1; box-shadow: 0 1px 3px rgba(0,0,0,0.05); flex-shrink: 0;">
            <img src="${unitPhoto}" style="width: 100%; height: 100%; object-fit: cover;" crossorigin="anonymous" alt="Render Unidad ${data.unitNumber}" />
            <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(15, 23, 42, 0.85)); padding: 14px 10px 8px; color: #FFFFFF;">
              <div style="font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; opacity: 0.9;">${data.unitType}</div>
              <div style="font-size: 16px; font-weight: 900; line-height: 1.1;">Unidad ${data.unitNumber}</div>
            </div>
          </div>

          <!-- Floor Plan (Planta Arquitectónica / Conjunto) if available -->
          ${
            data.floorPlanUrl
              ? `
            <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; padding: 8px; display: flex; flex-direction: column; gap: 4px;">
              <div style="font-size: 8px; font-weight: 800; color: #1B3047; text-transform: uppercase; letter-spacing: 0.04em; display: flex; align-items: center; gap: 4px;">
                <span style="width: 5px; height: 5px; background: #2F80ED; border-radius: 50%;"></span> Planta Asignada
              </div>
              <div style="height: 110px; border-radius: 4px; overflow: hidden; background: #FAFAFA; display: flex; align-items: center; justify-content: center; border: 1px dashed #CBD5E1;">
                <img src="${data.floorPlanUrl}" style="max-width: 100%; max-height: 100%; object-fit: contain;" crossorigin="anonymous" alt="Planta Arquitectónica" />
              </div>
            </div>
          `
              : ""
          }

          <!-- Client / Copropiedad Card -->
          <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; padding: 10px 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; border-bottom: 1px solid #F1F5F9; padding-bottom: 4px;">
              <div style="font-size: 8.5px; font-weight: 800; color: #1B3047; text-transform: uppercase; letter-spacing: 0.04em; display: flex; align-items: center; gap: 5px;">
                <span style="width: 6px; height: 6px; background: ${isCoprop ? "#00C48C" : "#2F80ED"}; border-radius: 50%;"></span>
                ${isCoprop ? `Titulares en Copropiedad (${1 + coOwnersList.length})` : "Prospecto / Cliente"}
              </div>
              ${
                isCoprop
                  ? `<span style="font-size: 7.5px; font-weight: 800; background: rgba(0, 196, 140, 0.12); color: #00875A; padding: 1px 5px; border-radius: 4px;">Copropiedad</span>`
                  : ""
              }
            </div>

            <!-- Primary Client -->
            <div style="font-size: 9px; line-height: 1.45; color: #334155; margin-bottom: ${isCoprop && coOwnersList.length > 0 ? "6px" : "0"};">
              <div style="display: flex; justify-content: space-between;">
                <strong style="color: #0F172A; font-size: 9.5px;">${data.client.name}</strong>
                ${isCoprop && data.client.ownershipPct ? `<span style="font-weight: 800; color: #1B3047;">${data.client.ownershipPct}%</span>` : ""}
              </div>
              ${data.client.email ? `<div style="color: #64748B; font-size: 8.5px;">✉ ${data.client.email}</div>` : ""}
              ${data.client.phone ? `<div style="color: #64748B; font-size: 8.5px;">☎ ${data.client.phone}</div>` : ""}
              ${data.client.rfc ? `<div style="color: #64748B; font-size: 8px;">RFC: ${data.client.rfc}</div>` : ""}
            </div>

            <!-- Co-owners list if any -->
            ${
              isCoprop && coOwnersList.length > 0
                ? coOwnersList
                    .map(
                      (co, idx) => `
                <div style="border-top: 1px dashed #E2E8F0; padding-top: 5px; margin-top: 5px; font-size: 8.5px; line-height: 1.4; color: #334155;">
                  <div style="display: flex; justify-content: space-between;">
                    <strong style="color: #1E293B;">${co.name || `Copropietario ${idx + 2}`}</strong>
                    <span style="font-weight: 800; color: #00875A;">${co.ownershipPct || 0}%</span>
                  </div>
                  ${co.email ? `<div style="color: #64748B; font-size: 8px;">✉ ${co.email}</div>` : ""}
                  ${co.phone ? `<div style="color: #64748B; font-size: 8px;">☎ ${co.phone}</div>` : ""}
                </div>
              `
                    )
                    .join("")
                : ""
            }
          </div>

          <!-- Advisor Card -->
          <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; padding: 10px 12px;">
            <div style="font-size: 8.5px; font-weight: 800; color: #1B3047; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 5px; display: flex; align-items: center; gap: 5px;">
              <span style="width: 6px; height: 6px; background: #64748B; border-radius: 50%;"></span> Asesor Comercial
            </div>
            <div style="font-size: 9px; line-height: 1.45; color: #334155;">
              <strong style="color: #0F172A; font-size: 9.5px;">${data.advisor.name}</strong>
              <div style="color: #64748B; font-size: 8.5px;">${data.advisor.role || "Asesor de Ventas"}</div>
              ${data.advisor.email ? `<div style="color: #64748B; font-size: 8.5px;">✉ ${data.advisor.email}</div>` : ""}
              ${data.advisor.phone ? `<div style="color: #64748B; font-size: 8.5px;">☎ ${data.advisor.phone}</div>` : ""}
            </div>
          </div>

          <!-- Validity notice -->
          <div style="margin-top: auto; font-size: 8px; color: #94A3B8; text-align: center; line-height: 1.3;">
            Propuesta sujeta a disponibilidad • Vigencia de 30 días naturales
          </div>
        </div>

        <!-- RIGHT COLUMN (Characteristics, Payment Plan, Pricing) -->
        <div style="flex: 1; display: flex; flex-direction: column; padding: 14px 18px; gap: 12px; box-sizing: border-box; background: #FFFFFF;">
          
          <!-- Características de la Unidad (Complete Grid) -->
          <div>
            <div style="font-size: 9.5px; font-weight: 800; color: #1B3047; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
              <span style="width: 6px; height: 6px; background: #1B3047; border-radius: 2px;"></span>
              Características de la Unidad
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;">
              <!-- Superficie Total -->
              <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 6px 8px;">
                <div style="font-size: 7.5px; color: #64748B; font-weight: 700; text-transform: uppercase;">Superficie Total</div>
                <div style="font-size: 11.5px; font-weight: 800; color: #0F172A; margin-top: 1px;">${data.superficieM2} m²</div>
              </div>

              <!-- Entrega estimada si existe -->
              ${
                data.deliveryDate
                  ? `
                <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 6px 8px;">
                  <div style="font-size: 7.5px; color: #64748B; font-weight: 700; text-transform: uppercase;">Entrega Estimada</div>
                  <div style="font-size: 11px; font-weight: 800; color: #0F172A; margin-top: 1px;">${data.deliveryDate}</div>
                </div>
              `
                  : ""
              }

              <!-- Dynamic characteristics mapped from unit -->
              ${(data.characteristics || [])
                .map(
                  (c) => `
                <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 6px 8px;">
                  <div style="font-size: 7.5px; color: #64748B; font-weight: 700; text-transform: uppercase;">${c.label}</div>
                  <div style="font-size: 11px; font-weight: 800; color: #0F172A; margin-top: 1px;">${c.value}</div>
                </div>
              `
                )
                .join("")}
            </div>
          </div>

          <!-- Precios y Descuentos -->
          <div style="border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; background: #FFFFFF;">
            <div style="display: flex; justify-content: space-between; align-items: center; background: #F8FAFC; padding: 7px 12px;">
              <span style="font-size: 9px; font-weight: 700; color: #475569;">Precio de Lista</span>
              <strong style="font-size: 12px; color: #0F172A; font-weight: 800;">${formatMoney(data.listPrice)}</strong>
            </div>
            ${
              (data.discountPct || 0) > 0
                ? `
              <div style="display: flex; justify-content: space-between; align-items: center; background: #ECFDF5; border-top: 1px solid #A7F3D0; padding: 6px 12px;">
                <span style="font-size: 9px; font-weight: 800; color: #059669;">Descuento Especial (${data.discountPct}%)</span>
                <strong style="font-size: 12px; color: #059669; font-weight: 800;">-${formatMoney(data.discountAmount || 0)}</strong>
              </div>
            `
                : ""
            }
          </div>

          <!-- Plan de Pagos Comercial -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <div style="font-size: 9.5px; font-weight: 800; color: #1B3047; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px;">
                <span style="width: 6px; height: 6px; background: #2F80ED; border-radius: 2px;"></span>
                Plan de Pago: <span style="color: #2F80ED;">${data.planName}</span>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;">
              <!-- Enganche -->
              <div style="background: #F0F4F8; border: 1.5px solid #CBD5E1; border-radius: 8px; padding: 9px 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                  <span style="font-size: 8.5px; font-weight: 800; color: #1E293B;">Enganche</span>
                  <span style="background: #1B3047; color: #FFFFFF; padding: 1px 5px; border-radius: 4px; font-size: 7.5px; font-weight: 800;">
                    ${data.downPaymentPct || 20}%
                  </span>
                </div>
                <div style="font-size: 14px; font-weight: 900; color: #1B3047;">${formatMoney(data.downPaymentAmount)}</div>
                <div style="font-size: 7.5px; color: #64748B; margin-top: 2px; font-weight: 600;">Pago Inicial al firmar</div>
              </div>

              <!-- Mensualidades -->
              <div style="background: #FFFFFF; border: 1.5px solid #E2E8F0; border-radius: 8px; padding: 9px 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                  <span style="font-size: 8.5px; font-weight: 800; color: #1E293B;">${data.installmentsCount} Cuotas</span>
                  <span style="background: #E2E8F0; color: #475569; padding: 1px 5px; border-radius: 4px; font-size: 7.5px; font-weight: 700;">Mensual</span>
                </div>
                <div style="font-size: 14px; font-weight: 900; color: #2F80ED;">${formatMoney(data.installmentAmount)} <span style="font-size: 9px; font-weight: 600;">c/u</span></div>
                <div style="font-size: 7.5px; color: #64748B; margin-top: 2px; font-weight: 600;">Total diferido: ${formatMoney(data.installmentAmount * data.installmentsCount)}</div>
              </div>

              <!-- Liquidación -->
              <div style="background: #ECFDF5; border: 1.5px solid #6EE7B7; border-radius: 8px; padding: 9px 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                  <span style="font-size: 8.5px; font-weight: 800; color: #065F46;">Liquidación</span>
                  <span style="background: #10B981; color: #FFFFFF; padding: 1px 5px; border-radius: 4px; font-size: 7.5px; font-weight: 800;">
                    ${data.settlementPct || 30}%
                  </span>
                </div>
                <div style="font-size: 14px; font-weight: 900; color: #065F46;">${formatMoney(data.settlementAmount)}</div>
                <div style="font-size: 7.5px; color: #047857; margin-top: 2px; font-weight: 600;">Contra entrega / Escritura</div>
              </div>
            </div>
          </div>

          <!-- Adicionales si existen -->
          ${
            (data.additionals || []).length > 0
              ? `
            <div>
              <div style="font-size: 8.5px; font-weight: 800; color: #1B3047; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px;">
                Adicionales Seleccionados
              </div>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px;">
                ${data.additionals!
                  .map(
                    (ad) => `
                  <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 5px 8px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 8.5px; font-weight: 600; color: #334155;">${ad.name}</span>
                    <strong style="font-size: 9px; color: #1B3047; font-weight: 800;">${formatMoney(ad.price)}</strong>
                  </div>
                `
                  )
                  .join("")}
              </div>
            </div>
          `
              : ""
          }

          <!-- Total Final Box -->
          <div style="background: linear-gradient(135deg, #1B3047 0%, #111F30 100%); border-radius: 9px; padding: 12px 18px; display: flex; justify-content: space-between; align-items: center; color: #FFFFFF; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); margin-top: auto;">
            <div>
              <div style="font-size: 8.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #93C5FD;">Monto Total de la Propuesta</div>
              <div style="font-size: 10.5px; font-weight: 600; opacity: 0.85; margin-top: 1px;">Precios expresados en Moneda Nacional (MXN)</div>
            </div>
            <div style="font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: #FFFFFF;">
              ${formatMoney(data.totalQuoteAmount)}
            </div>
          </div>
        </div>
      </div>

      <!-- FOOTER -->
      <div style="border-top: 1.5px solid #E2E8F0; padding: 8px 20px; display: flex; justify-content: space-between; align-items: center; font-size: 8px; color: #94A3B8; background: #FFFFFF; flex-shrink: 0;">
        <span>Esta cotización tiene vigencia de 30 días naturales a partir de su emisión. Precios y disponibilidad sujetos a cambios sin previo aviso.</span>
        <span>Generado con <strong>Devio Real Estate Platform</strong></span>
      </div>
    </div>
  `;
}

export function openQuoteInNewTab(data: QuotePDFData) {
  if (typeof window === "undefined") return;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const html = getQuoteHTML(data);

  const fullDocument = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Cotización ${data.unitNumber} - ${data.projectName}</title>
      <style>
        @page {
          size: letter portrait;
          margin: 10mm;
        }
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          padding: 24px;
          background: #F1F5F9;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .top-toolbar {
          width: 794px;
          max-width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .action-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }
        .btn-print {
          background-color: #1F3652;
          color: #ffffff;
        }
        .btn-print:hover {
          background-color: #152538;
        }
        .document-wrapper {
          width: 794px;
          max-width: 100%;
          background: #ffffff;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        @media print {
          body {
            background: #ffffff;
            padding: 0;
          }
          .top-toolbar {
            display: none !important;
          }
          .document-wrapper {
            box-shadow: none;
            border-radius: 0;
            width: 100%;
          }
        }
      </style>
    </head>
    <body>
      <div class="top-toolbar">
        <span style="font-size: 13px; color: #64748B; font-weight: 600;">Vista Previa de Cotización Comercial</span>
        <div style="display: flex; gap: 8px;">
          <button class="action-btn btn-print" onclick="window.print()">
            🖨️ Imprimir / Guardar en PDF
          </button>
        </div>
      </div>
      <div class="document-wrapper">
        ${html}
      </div>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(fullDocument);
  printWindow.document.close();
}

export async function generateQuotePDF(data: QuotePDFData): Promise<{ success: boolean; base64?: string }> {
  if (typeof window === "undefined") return { success: false };
  await loadPDFLibraries();

  const html = getQuoteHTML(data);

  // Render ghost node
  const ghost = document.createElement("div");
  ghost.style.position = "fixed";
  ghost.style.top = "-9999px";
  ghost.style.left = "0";
  ghost.style.width = "800px";
  ghost.style.background = "#fff";
  ghost.innerHTML = html;
  document.body.appendChild(ghost);

  try {
    // Wait for all images to finish loading
    await waitForImagesToLoad(ghost);

    const element = ghost.querySelector("#cot-pdf-container");
    const opt = {
      margin: 0,
      filename: `Cotizacion_${data.unitNumber}_${data.quoteFolio}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, allowTaint: true, scrollY: 0, width: 794 },
      jsPDF: { unit: "pt", format: "letter", orientation: "portrait" },
    };

    if (window.html2pdf) {
      await window.html2pdf().set(opt).from(element).save();
    }
    return { success: true };
  } catch (err) {
    console.error("Error generating quote PDF:", err);
    return { success: false };
  } finally {
    ghost.remove();
  }
}
