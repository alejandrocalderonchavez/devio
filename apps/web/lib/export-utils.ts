import * as XLSX from "xlsx";

export function exportTableToExcel(
  data: Record<string, any>[],
  fileName: string,
  sheetName: string = "Datos"
) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Auto-calculate column widths
  if (data.length > 0 && data[0]) {
    const keys = Object.keys(data[0]);
    const cols = keys.map((key) => {
      let maxLen = key.length;
      data.forEach((row) => {
        const valStr = String(row[key] ?? "");
        if (valStr.length > maxLen) maxLen = valStr.length;
      });
      return { wch: Math.min(Math.max(maxLen + 4, 12), 45) };
    });
    ws["!cols"] = cols;
  }

  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

export function exportTableToPDF(
  title: string,
  projectName: string,
  headers: string[],
  rows: (string | number)[][],
  totalsSummary?: string,
  developerLogoUrl?: string,
  projectLogoUrl?: string
) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const todayStr = new Date().toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const devLogo =
    developerLogoUrl && (developerLogoUrl.startsWith("http") || developerLogoUrl.startsWith("data:"))
      ? developerLogoUrl
      : (typeof window !== "undefined" && (localStorage.getItem("devio_developer_logo") || sessionStorage.getItem("devio_developer_logo"))) ||
        "";

  const projLogo =
    projectLogoUrl && (projectLogoUrl.startsWith("http") || projectLogoUrl.startsWith("data:"))
      ? projectLogoUrl
      : "";

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>${title} - ${projectName}</title>
      <style>
        @page {
          size: letter landscape;
          margin: 15mm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #1F3652;
          margin: 0;
          padding: 20px;
          background: #FFFFFF;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #1B3047;
          padding-bottom: 12px;
          margin-bottom: 20px;
        }
        .logo-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .logo-text {
          font-size: 24px;
          font-weight: 800;
          color: #1B3047;
          letter-spacing: -0.5px;
        }
        .meta {
          text-align: right;
          font-size: 11px;
          color: #64748B;
        }
        .report-title {
          font-size: 18px;
          font-weight: 700;
          color: #1F3652;
          margin-top: 4px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          font-size: 11px;
        }
        th {
          background-color: #1B3047;
          color: #FFFFFF;
          padding: 8px 10px;
          text-align: left;
          font-weight: 700;
        }
        td {
          padding: 8px 10px;
          border-bottom: 1px solid #E2E8F0;
          color: #334155;
        }
        tr:nth-child(even) {
          background-color: #F8FAFC;
        }
        .footer {
          margin-top: 25px;
          padding-top: 10px;
          border-top: 1px solid #CBD5E1;
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #64748B;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-title" style="display: flex; align-items: center; gap: 14px;">
          ${devLogo ? `<img src="${devLogo}" style="height: 38px; max-width: 130px; object-fit: contain;" crossorigin="anonymous" alt="Logo Desarrollador" />` : `<span style="font-size: 18px; font-weight: 800; color: #1B3047;">Devio</span>`}
          ${(devLogo && projLogo) ? `<div style="width: 1.5px; height: 30px; background: #CBD5E1;"></div>` : ""}
          ${projLogo ? `<img src="${projLogo}" style="height: 38px; max-width: 130px; object-fit: contain; border-radius: 4px;" crossorigin="anonymous" alt="Logo Proyecto" />` : ""}
          <div style="margin-left: 6px;">
            <div class="report-title" style="font-size: 16px; font-weight: 800; color: #1F3652; margin: 0;">${title}</div>
            <div style="font-size: 11.5px; color: #64748B; font-weight: 600; margin-top: 2px;">${projectName}</div>
          </div>
        </div>
        <div class="meta">
          <div><strong style="color: #1F3652;">Fecha de emisión:</strong> ${todayStr}</div>
          <div>Reporte oficial • Plataforma Devio</div>
        </div>
      </div>

      ${totalsSummary ? `<div style="background:#F1F5F9; padding:8px 14px; border-radius:6px; font-size:11px; font-weight:600; color:#1F3652; margin-bottom:12px;">${totalsSummary}</div>` : ""}

      <table>
        <thead>
          <tr>
            ${headers.map((h) => `<th>${h}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (r) => `
            <tr>
              ${r.map((cell) => `<td>${cell}</td>`).join("")}
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>

      <div class="footer">
        <span>Devio Real Estate Intelligence • Todos los derechos reservados</span>
        <span>Página 1 de 1</span>
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
