"use client";

import React, { useState } from "react";
import { X, FileSpreadsheet, FileText, CheckCircle2, Download } from "lucide-react";
import { UnitItem } from "./bulk-price-modal";

export interface DownloadExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  units: UnitItem[];
  projectName?: string;
  currency?: "MXN" | "USD";
}

export default function DownloadExportModal({
  isOpen,
  onClose,
  units,
  projectName = "Proyecto",
  currency = "MXN",
}: DownloadExportModalProps) {
  const [downloading, setDownloading] = useState<"excel" | "pdf" | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  // Exportar a Excel (CSV con formato compatible Excel)
  const handleExportExcel = () => {
    setDownloading("excel");
    setTimeout(() => {
      const headers = ["Numero", "Tipo", "Superficie_m2", "Piso", "Precio", "Estado", "Cliente", "Fecha_Entrega"];
      const rows = units.map((u) => [
        `"${u.unit}"`,
        `"${u.type || "Departamento"}"`,
        u.areaM2,
        u.floor,
        u.price,
        `"${u.status}"`,
        `"${u.client || "Sin asignar"}"`,
        `"${u.deliveryDate || ""}"`,
      ]);

      const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Inventario_Unidades_${projectName.replace(/\s+/g, "_")}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloading(null);
      setSuccess("¡Archivo Excel/CSV descargado!");
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 1200);
    }, 500);
  };

  // Exportar a PDF (Reporte institucional con ventana de impresión / descarga)
  const handleExportPDF = () => {
    setDownloading("pdf");
    setTimeout(() => {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        const rowsHtml = units
          .map(
            (u) => `
          <tr style="border-bottom: 1px solid #E2E8F0;">
            <td style="padding: 8px 12px; font-weight: bold; color: #1F3652;">${u.unit}</td>
            <td style="padding: 8px 12px;">${u.type}</td>
            <td style="padding: 8px 12px;">${u.areaM2} m²</td>
            <td style="padding: 8px 12px; font-weight: bold;">$${Number(u.price).toLocaleString("es-MX")} ${currency}</td>
            <td style="padding: 8px 12px;"><span style="display:inline-block; padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: bold; background: ${
              u.status === "VENDIDA" ? "#D1FAE5; color: #065F46" : u.status === "BLOQUEADA" ? "#FEE2E2; color: #991B1B" : "#DBEAFE; color: #1E40AF"
            };">${u.status}</span></td>
            <td style="padding: 8px 12px;">${u.client || "-"}</td>
          </tr>
        `
          )
          .join("");

        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Reporte de Inventario - ${projectName}</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 30px; color: #1E293B; }
                .header { display: flex; justify-content: space-between; border-bottom: 2px solid #1F3652; padding-bottom: 15px; margin-bottom: 20px; }
                h1 { margin: 0; font-size: 22px; color: #1F3652; }
                p { margin: 4px 0; color: #64748B; font-size: 13px; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; margin-top: 15px; }
                th { background-color: #1F3652; color: #FFF; padding: 8px 12px; }
                .footer { margin-top: 30px; font-size: 11px; color: #94A3B8; text-align: center; }
              </style>
            </head>
            <body>
              <div class="header">
                <div>
                  <h1>DEVIO • Inventario de Unidades</h1>
                  <p><strong>Proyecto:</strong> ${projectName} | <strong>Fecha de emisión:</strong> ${new Date().toLocaleDateString("es-MX")}</p>
                </div>
                <div style="text-align: right;">
                  <p>Total de Unidades: <strong>${units.length}</strong></p>
                  <p>Disponibles: <strong>${units.filter((u) => u.status === "DISPONIBLE").length}</strong> | Vendidas: <strong>${units.filter((u) => u.status === "VENDIDA").length}</strong></p>
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Unidad</th>
                    <th>Tipo</th>
                    <th>Superficie</th>
                    <th>Precio Lista</th>
                    <th>Estado</th>
                    <th>Cliente</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                </tbody>
              </table>
              <div class="footer">
                Documento generado automáticamente por la plataforma Devio Inmobiliario.
              </div>
              <script>
                window.onload = function() { window.print(); }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
      setDownloading(null);
      setSuccess("¡PDF generado para descarga/impresión!");
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 1200);
    }, 500);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(10, 25, 41, 0.55)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
      }}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "1.25rem",
          width: "100%",
          maxWidth: "460px",
          padding: "2rem",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          position: "relative",
          textAlign: "center",
          animation: "modalFadeIn 0.2s ease-out",
        }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute",
            top: "1.25rem",
            right: "1.25rem",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#8B9BB0",
            padding: "0.25rem",
          }}
        >
          <X size={20} />
        </button>

        {/* Title & Subtitle exact to Screenshot 1 */}
        <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1F3652", marginBottom: "0.4rem" }}>
          Descargar Como
        </h3>
        <p style={{ fontSize: "0.85rem", color: "#64748B", marginBottom: "1.75rem" }}>
          Opción para descargar datos en formato Excel o PDF.
        </p>

        {success ? (
          <div style={{ padding: "1rem", backgroundColor: "rgba(0, 196, 140, 0.12)", color: "#00C48C", borderRadius: "0.75rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
            <CheckCircle2 size={20} /> {success}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {/* Botón Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={downloading !== null}
              style={{
                width: "100%",
                padding: "0.8rem 1.5rem",
                borderRadius: "9999px",
                border: "none",
                backgroundColor: "#1B3047",
                color: "#FFFFFF",
                fontSize: "0.9rem",
                fontWeight: 700,
                cursor: downloading !== null ? "not-allowed" : "pointer",
                boxShadow: "0 2px 8px rgba(27, 48, 71, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                transition: "background-color 0.2s ease",
              }}
            >
              <FileSpreadsheet size={18} />
              {downloading === "excel" ? "Generando Excel..." : "Descargar Unidades (Excel)"}
            </button>

            {/* Botón PDF */}
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={downloading !== null}
              style={{
                width: "100%",
                padding: "0.8rem 1.5rem",
                borderRadius: "9999px",
                border: "none",
                backgroundColor: "#1B3047",
                color: "#FFFFFF",
                fontSize: "0.9rem",
                fontWeight: 700,
                cursor: downloading !== null ? "not-allowed" : "pointer",
                boxShadow: "0 2px 8px rgba(27, 48, 71, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                transition: "background-color 0.2s ease",
              }}
            >
              <FileText size={18} />
              {downloading === "pdf" ? "Generando PDF..." : "Descargar Unidades (PDF)"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
