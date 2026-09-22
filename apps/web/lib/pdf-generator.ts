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

// -----------------------------------------------------------------------------
// 1. RECIBO DE PAGO PDF
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

export async function generateReceiptPDF(data: ReceiptPDFData): Promise<{ success: boolean; base64?: string }> {
  if (typeof window === "undefined") return { success: false };
  await loadPDFLibraries();

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

  const html = `
    <div id="rp-pdf-container" style="
      width: 760px;
      background: #ffffff;
      margin: 0 auto;
      padding: 36px 40px;
      box-sizing: border-box;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      color: #111827;
      position: relative;
    ">
      <!-- HEADER -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1F3652; padding-bottom: 18px; margin-bottom: 24px;">
        <div style="width: 58%;">
          <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 16px; height: 48px;">
            ${
              data.developerLogoUrl
                ? `<img src="${data.developerLogoUrl}" style="height: 100%; max-width: 140px; object-fit: contain;" crossorigin="anonymous" />`
                : `<div style="font-size: 16px; font-weight: 800; color: #1F3652;">${data.developerName || "DEVIO"}</div>`
            }
            <div style="width: 1px; height: 32px; background: #e5e7eb;"></div>
            ${
              data.projectLogoUrl
                ? `<img src="${data.projectLogoUrl}" style="height: 100%; max-width: 140px; object-fit: contain;" crossorigin="anonymous" />`
                : `<div style="font-size: 14px; font-weight: 700; color: #6b7280;">${data.projectName}</div>`
            }
          </div>
          <h1 style="font-size: 24px; font-weight: 800; color: #111827; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">
            Recibo de Pago
          </h1>
          <p style="font-size: 13px; color: #1F3652; margin: 4px 0 0 0; font-weight: 600;">
            ${data.projectName} / Unidad ${data.unitNumber}
          </p>
        </div>

        <div style="width: 40%; text-align: right; font-size: 12.5px; line-height: 1.8; color: #4b5563;">
          <div><strong style="color: #1F3652;">Folio:</strong> #${data.folio}</div>
          <div><strong style="color: #1F3652;">Fecha Emisión:</strong> ${fechaEmision}</div>
          <div><strong style="color: #1F3652;">Método:</strong> ${data.paymentMethod}</div>
        </div>
      </div>

      <!-- BANNER ÉXITO -->
      <div style="background: #f0fdf4; border: 1px solid #86efac; border-left: 4px solid #16a34a; border-radius: 7px; padding: 14px 18px; display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
        <div style="width: 28px; height: 28px; background: #16a34a; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: white; font-weight: bold;">
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
        <span>Generado vía <strong style="color: #1F3652; opacity: 0.6;">Devio Platform</strong></span>
        <span>deviomx.com</span>
      </div>
    </div>
  `;

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
  client: {
    name: string;
    email?: string;
    phone?: string;
    rfc?: string;
  };
  advisor: {
    name: string;
    role?: string;
    email?: string;
    phone?: string;
  };
  unitImageUrl?: string;
  floorPlanUrl?: string;
  developerLogoUrl?: string;
  projectLogoUrl?: string;
  developerName?: string;
  characteristics?: Array<{ label: string; value: string }>;
  notes?: string;
  brandColor?: string;
}

export async function generateQuotePDF(data: QuotePDFData): Promise<{ success: boolean; base64?: string }> {
  if (typeof window === "undefined") return { success: false };
  await loadPDFLibraries();

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

  const totalAdditionals = (data.additionals || []).reduce((acc, a) => acc + (a.price || 0), 0);

  const html = `
    <div id="cot-pdf-container" style="
      width: 760px;
      height: 1050px;
      overflow: hidden;
      background: #ffffff;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      font-size: 10px;
      color: #1f2937;
      box-sizing: border-box;
      position: relative;
    ">
      <!-- TOP COLOR BAND -->
      <div style="height: 4px; background: ${brand}; flex-shrink: 0;"></div>

      <!-- HEADER -->
      <div style="display: flex; align-items: stretch; border-bottom: 1px solid #e5e7eb; min-height: 68px; flex-shrink: 0;">
        <div style="width: 140px; flex-shrink: 0; border-right: 1px solid #e5e7eb; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px 12px; gap: 4px;">
          ${
            data.projectLogoUrl
              ? `<img src="${data.projectLogoUrl}" style="max-width: 110px; max-height: 44px; object-fit: contain;" crossorigin="anonymous" />`
              : `<div style="font-size: 13px; font-weight: 800; color: ${brand};">${data.projectName}</div>`
          }
          <div style="font-size: 7.5px; font-weight: 700; color: #9ca3af; text-align: center;">${data.projectName}</div>
        </div>

        <div style="flex: 1; padding: 10px 16px; display: flex; flex-direction: column; justify-content: center; gap: 2px;">
          <div style="font-size: 7.5px; font-weight: 700; color: ${brand}; text-transform: uppercase; letter-spacing: 0.05em;">
            Cotización Comercial
          </div>
          <div style="font-size: 17px; font-weight: 800; color: #111827; margin: 0; line-height: 1.1;">
            Propuesta de Unidad
          </div>
          <div style="display: flex; gap: 12px; margin-top: 4px; font-size: 9.5px; color: #6b7280;">
            <div><b style="color: #111827;">Unidad:</b> ${data.unitNumber}</div>
            <div><b style="color: #111827;">Tipo:</b> ${data.unitType}</div>
            <div><b style="color: #111827;">Folio:</b> ${data.quoteFolio}</div>
            <div><b style="color: #111827;">Emisión:</b> ${emissionDate}</div>
          </div>
        </div>

        <div style="width: 140px; flex-shrink: 0; border-left: 1px solid #e5e7eb; display: flex; flex-direction: column; align-items: flex-end; justify-content: center; padding: 10px 12px;">
          <div style="font-size: 7px; color: #9ca3af; margin-bottom: 2px;">Desarrolladora</div>
          ${
            data.developerLogoUrl
              ? `<img src="${data.developerLogoUrl}" style="max-width: 110px; max-height: 36px; object-fit: contain;" crossorigin="anonymous" />`
              : `<div style="font-size: 11px; font-weight: 700; color: #374151;">${data.developerName || "Desarrollador"}</div>`
          }
        </div>
      </div>

      <!-- BODY -->
      <div style="display: flex; flex: 1; min-height: 0;">
        <!-- COLUMNA IZQUIERDA -->
        <div style="width: 272px; flex-shrink: 0; border-right: 1px solid #e5e7eb; display: flex; flex-direction: column; background: #f8fafc;">
          <div style="width: 272px; height: 260px; flex-shrink: 0; overflow: hidden; position: relative; background: #e2e8f0;">
            ${
              data.unitImageUrl
                ? `<img src="${data.unitImageUrl}" style="width: 100%; height: 100%; object-fit: cover;" crossorigin="anonymous" />`
                : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 11px; font-weight: 600;">Sin fotografía de render</div>`
            }
            <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.75)); padding: 20px 12px 10px; color: #fff;">
              <div style="font-size: 8px; font-weight: 600; opacity: 0.85;">${data.unitType}</div>
              <div style="font-size: 18px; font-weight: 800;">Unidad ${data.unitNumber}</div>
            </div>
          </div>

          <div style="flex: 1; display: flex; flex-direction: column; padding: 10px; gap: 8px;">
            <!-- Contact Card Cliente -->
            <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 7px; padding: 8px 10px;">
              <div style="font-size: 8px; font-weight: 700; color: ${brand}; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                <div style="width: 5px; height: 5px; background: ${brand}; border-radius: 50%;"></div> Prospecto / Cliente
              </div>
              <div style="font-size: 9px; line-height: 1.5; color: #374151;">
                <div><span style="color: #9ca3af; font-weight: 600;">Nombre:</span> ${data.client.name}</div>
                ${data.client.email ? `<div><span style="color: #9ca3af; font-weight: 600;">Email:</span> ${data.client.email}</div>` : ""}
                ${data.client.phone ? `<div><span style="color: #9ca3af; font-weight: 600;">Tel:</span> ${data.client.phone}</div>` : ""}
              </div>
            </div>

            <!-- Contact Card Asesor -->
            <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 7px; padding: 8px 10px;">
              <div style="font-size: 8px; font-weight: 700; color: ${brand}; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                <div style="width: 5px; height: 5px; background: ${brand}; border-radius: 50%;"></div> Asesor Comercial
              </div>
              <div style="font-size: 9px; line-height: 1.5; color: #374151;">
                <div><span style="color: #9ca3af; font-weight: 600;">Nombre:</span> ${data.advisor.name}</div>
                ${data.advisor.role ? `<div><span style="color: #9ca3af; font-weight: 600;">Puesto:</span> ${data.advisor.role}</div>` : ""}
                ${data.advisor.phone ? `<div><span style="color: #9ca3af; font-weight: 600;">Tel:</span> ${data.advisor.phone}</div>` : ""}
              </div>
            </div>

            <div style="font-size: 7.5px; color: #9ca3af; text-align: center; margin-top: auto;">
              Vigencia 30 días · ${emissionDate}
            </div>
          </div>
        </div>

        <!-- COLUMNA DERECHA -->
        <div style="flex: 1; display: flex; flex-direction: column; overflow: hidden; padding: 12px 14px;">
          <!-- Características -->
          <div style="margin-bottom: 8px;">
            <div style="font-size: 9px; font-weight: 700; color: ${brand}; margin-bottom: 6px; display: flex; align-items: center; gap: 4px;">
              <div style="width: 6px; height: 6px; background: ${brand}; border-radius: 2px;"></div> Características de la Unidad
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px;">
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 5px; padding: 6px 7px;">
                <div style="font-size: 7.5px; color: #9ca3af; font-weight: 700;">Superficie</div>
                <div style="font-size: 11px; font-weight: 700; color: #111827;">${data.superficieM2} m²</div>
              </div>
              ${
                data.deliveryDate
                  ? `
                <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 5px; padding: 6px 7px;">
                  <div style="font-size: 7.5px; color: #9ca3af; font-weight: 700;">Entrega estimada</div>
                  <div style="font-size: 10.5px; font-weight: 700; color: #111827;">${data.deliveryDate}</div>
                </div>
              `
                  : ""
              }
              ${(data.characteristics || [])
                .map(
                  (c) => `
                <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 5px; padding: 6px 7px;">
                  <div style="font-size: 7.5px; color: #9ca3af; font-weight: 700;">${c.label}</div>
                  <div style="font-size: 11px; font-weight: 700; color: #111827;">${c.value}</div>
                </div>
              `
                )
                .join("")}
            </div>
          </div>

          <!-- Precio de lista y Descuento -->
          ${
            (data.discountPct || 0) > 0
              ? `
            <div style="margin-bottom: 8px; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
              <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 5px 10px;">
                <span style="font-size: 8.5px; font-weight: 700; color: #374151;">Precio de lista</span>
                <strong style="font-size: 11px; color: #111827;">${formatMoney(data.listPrice)}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; background: #f0fdf4; border-top: 1px solid #bbf7d0; padding: 5px 10px;">
                <span style="font-size: 8.5px; font-weight: 700; color: #15803d;">Descuento (${data.discountPct}%)</span>
                <strong style="font-size: 11px; color: #15803d;">-${formatMoney(data.discountAmount || 0)}</strong>
              </div>
            </div>
          `
              : ""
          }

          <!-- Plan de Pago Cards -->
          <div style="margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <div style="font-size: 9px; font-weight: 700; color: ${brand}; display: flex; align-items: center; gap: 4px;">
                <div style="width: 6px; height: 6px; background: ${brand}; border-radius: 2px;"></div> Plan de Pago: ${data.planName}
              </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px;">
              <div style="background: #eef1f5; border: 1px solid #b0bfce; border-radius: 7px; padding: 7px 9px;">
                <div style="display: flex; justify-content: space-between; font-size: 8px; font-weight: 700; color: #374151; margin-bottom: 2px;">
                  <span>Enganche</span>
                  <span style="background: #d0dae6; color: ${brand}; padding: 1px 5px; border-radius: 8px; font-size: 7px;">
                    ${data.downPaymentPct || 20}%
                  </span>
                </div>
                <div style="font-size: 13.5px; font-weight: 800; color: ${brand};">${formatMoney(data.downPaymentAmount)}</div>
                <div style="font-size: 7.5px; color: #6b7280; margin-top: 2px;">Pago inicial</div>
              </div>

              <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 7px; padding: 7px 9px;">
                <div style="display: flex; justify-content: space-between; font-size: 8px; font-weight: 700; color: #374151; margin-bottom: 2px;">
                  <span>${data.installmentsCount} Cuotas</span>
                  <span style="background: #e5e7eb; color: #6b7280; padding: 1px 5px; border-radius: 8px; font-size: 7px;">Mensual</span>
                </div>
                <div style="font-size: 13.5px; font-weight: 800; color: ${brand};">${formatMoney(data.installmentAmount)} c/u</div>
                <div style="font-size: 7.5px; color: #6b7280; margin-top: 2px;">Total cuotas: ${formatMoney(data.installmentAmount * data.installmentsCount)}</div>
              </div>

              <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 7px; padding: 7px 9px;">
                <div style="display: flex; justify-content: space-between; font-size: 8px; font-weight: 700; color: #15803d; margin-bottom: 2px;">
                  <span>Liquidación</span>
                  <span style="background: #bbf7d0; color: #15803d; padding: 1px 5px; border-radius: 8px; font-size: 7px;">
                    ${data.settlementPct || 30}%
                  </span>
                </div>
                <div style="font-size: 13.5px; font-weight: 800; color: #15803d;">${formatMoney(data.settlementAmount)}</div>
                <div style="font-size: 7.5px; color: #15803d; margin-top: 2px;">Contra entrega / Escritura</div>
              </div>
            </div>
          </div>

          <!-- Add-ons Section -->
          ${
            (data.additionals || []).length > 0
              ? `
            <div style="margin-bottom: 8px;">
              <div style="font-size: 8.5px; font-weight: 700; color: ${brand}; margin-bottom: 4px;">Adicionales Seleccionados</div>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px;">
                ${data.additionals!
                  .map(
                    (ad) => `
                  <div style="background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 5px; padding: 4px 8px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 8px; font-weight: 600; color: #374151;">${ad.name}</span>
                    <strong style="font-size: 8.5px; color: ${brand};">${formatMoney(ad.price)}</strong>
                  </div>
                `
                  )
                  .join("")}
              </div>
            </div>
          `
              : ""
          }

          <!-- Total Box -->
          <div style="background: ${brand}; border-radius: 7px; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; color: #fff; margin-bottom: 8px;">
            <span style="font-size: 9.5px; font-weight: 700; opacity: 0.9;">Total de la Propuesta Comercial</span>
            <span style="font-size: 17px; font-weight: 800;">${formatMoney(data.totalQuoteAmount)}</span>
          </div>

          <!-- Planta Conjunto if exists -->
          ${
            data.floorPlanUrl
              ? `
            <div style="flex: 1; min-height: 0; display: flex; flex-direction: column; margin-top: 4px;">
              <div style="font-size: 8px; font-weight: 700; color: ${brand}; margin-bottom: 3px;">Planta Arquitectónica / Conjunto</div>
              <div style="flex: 1; min-height: 0; border: 1px solid #e5e7eb; border-radius: 6px; padding: 4px; display: flex; align-items: center; justify-content: center; background: #fafafa; overflow: hidden;">
                <img src="${data.floorPlanUrl}" style="max-width: 100%; max-height: 100%; object-fit: contain;" crossorigin="anonymous" />
              </div>
            </div>
          `
              : ""
          }
        </div>
      </div>

      <!-- FOOTER -->
      <div style="border-top: 1px solid #e5e7eb; padding: 5px 14px; display: flex; justify-content: space-between; align-items: center; font-size: 7px; color: #9ca3af; background: #fff; flex-shrink: 0;">
        <span>Esta cotización tiene vigencia de 30 días naturales. Precios y disponibilidad sujetos a cambio sin previo aviso.</span>
        <span>Generado con <strong>Devio Platform</strong></span>
      </div>
    </div>
  `;

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
    const element = ghost.querySelector("#cot-pdf-container");
    const opt = {
      margin: 0,
      filename: `Cotizacion_${data.unitNumber}_${data.quoteFolio}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, allowTaint: true, width: 760, height: 1050 },
      jsPDF: { unit: "pt", format: "a4", orientation: "portrait" },
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
