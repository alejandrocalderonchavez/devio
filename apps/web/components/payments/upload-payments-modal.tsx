"use client";

import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  CreditCard,
  DollarSign,
  Layers,
  ArrowRight,
  Check,
  RefreshCw,
} from "lucide-react";
import { useProject } from "../../context/project-context";
import { ProjectItem } from "../../data/projects-data";

interface UploadPaymentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectItem;
  defaultUnit?: string;
}

interface ParsedPaymentRow {
  rowNumber: number;
  unit: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  reference: string;
  notes: string;
  clientName?: string;
  isValid: boolean;
  validationMessage?: string;
}

export function UploadPaymentsModal({
  isOpen,
  onClose,
  project,
  defaultUnit,
}: UploadPaymentsModalProps) {
  const { bulkRegisterPayments, formatMoney, showToast } = useProject();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedPaymentRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    totalRows: number;
    validCount: number;
    invalidCount: number;
    totalAmount: number;
  } | null>(null);

  if (!isOpen) return null;

  // Helper date normalizer
  const normalizeDate = (val: any): string => {
    if (!val) return new Date().toLocaleDateString("es-MX");
    if (val instanceof Date && !isNaN(val.getTime())) {
      return val.toLocaleDateString("es-MX");
    }
    const str = String(val).trim();
    // Check if excel serial date
    if (/^\d{5}$/.test(str)) {
      const serial = parseInt(str, 10);
      const utcDays = serial - 25569;
      const utcValue = utcDays * 86400;
      const dateInfo = new Date(utcValue * 1000);
      return dateInfo.toLocaleDateString("es-MX");
    }
    // Handle YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      const datePart = str.split("T")[0] || str;
      const parts = datePart.split("-");
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    return str;
  };

  // Helper payment method normalizer
  const normalizePaymentMethod = (val: any): string => {
    if (!val) return "SPEI";
    const clean = String(val).toUpperCase().trim();
    if (clean.includes("SPEI") || clean.includes("INTERBANCARIA")) return "SPEI";
    if (clean.includes("TRANSF")) return "Transferencia";
    if (clean.includes("CHEQ")) return "Cheque";
    if (clean.includes("EFECTIVO") || clean.includes("CASH")) return "Efectivo";
    return "SPEI";
  };

  // Download Sample Template
  const handleDownloadTemplate = () => {
    // Generate template with sample unit numbers from current project
    const sampleUnits = project.unitsInventory.slice(0, 4).map((u) => u.unit);
    const u1 = sampleUnits[0] || "101";
    const u2 = sampleUnits[1] || "102";
    const u3 = sampleUnits[2] || "201";

    const templateData = [
      {
        "Unidad": u1,
        "Fecha_Pago": "2026-08-15",
        "Monto_Pagado": 250000,
        "Metodo_Pago": "SPEI",
        "Referencia": "SPEI-78901234",
        "Notas_Concepto": "Abono inicial enganche",
      },
      {
        "Unidad": u1,
        "Fecha_Pago": "2026-09-15",
        "Monto_Pagado": 75000,
        "Metodo_Pago": "Transferencia",
        "Referencia": "TX-44556677",
        "Notas_Concepto": "Mensualidad 1",
      },
      {
        "Unidad": u2,
        "Fecha_Pago": "2026-08-20",
        "Monto_Pagado": 180000,
        "Metodo_Pago": "SPEI",
        "Referencia": "SPEI-99881122",
        "Notas_Concepto": "Enganche formalizado",
      },
      {
        "Unidad": u3,
        "Fecha_Pago": "2026-08-28",
        "Monto_Pagado": 300000,
        "Metodo_Pago": "Cheque",
        "Referencia": "CHQ-001928",
        "Notas_Concepto": "Abono a capital inicial",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    ws["!cols"] = [
      { wch: 12 },
      { wch: 14 },
      { wch: 16 },
      { wch: 16 },
      { wch: 20 },
      { wch: 30 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla_Pagos");
    XLSX.writeFile(wb, `Plantilla_Carga_Pagos_${project.name.replace(/\s+/g, "_")}.xlsx`);
    showToast("Plantilla Descargada", "Usa este archivo como guía para cargar tus pagos o abonos históricos.");
  };

  // Process File
  const processFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          showToast("Error de Archivo", "El archivo de Excel no contiene hojas de cálculo válidas.", "warning");
          return;
        }

        const worksheet = workbook.Sheets[firstSheetName];
        if (!worksheet) {
          showToast("Error de Hoja", "No se pudo leer la hoja seleccionada.", "warning");
          return;
        }
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (rawJson.length === 0) {
          showToast("Archivo Vacío", "No se detectaron filas con datos en la hoja seleccionada.", "warning");
          return;
        }

        // Map and validate rows against project inventory & sales
        const rows: ParsedPaymentRow[] = rawJson.map((row, idx) => {
          // Normalize column headers flexibly (handle spaces, accents, case)
          const keys = Object.keys(row);
          const getVal = (colNames: string[]) => {
            for (const col of colNames) {
              const matchedKey = keys.find(
                (k) => k.toLowerCase().replace(/[^a-z0-9]/g, "") === col.toLowerCase().replace(/[^a-z0-9]/g, "")
              );
              if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== "") {
                return row[matchedKey];
              }
            }
            return "";
          };

          const rawUnit = String(getVal(["unidad", "unit", "depto", "lote", "numero_unidad", "deptounidad"])).trim();
          const rawAmount = getVal(["monto_pagado", "monto", "amount", "abono", "pagado", "importe"]);
          const rawDate = getVal(["fecha_pago", "fecha", "date", "fechadepago", "fechapago"]);
          const rawMethod = getVal(["metodo_pago", "metodo", "formapago", "method"]);
          const rawRef = String(getVal(["referencia", "reference", "folio_bancario", "rastreo", "folio"])).trim();
          const rawNotes = String(getVal(["notas_concepto", "notas", "concepto", "notes", "descripcion"])).trim();

          const amountNum = typeof rawAmount === "number" ? rawAmount : parseFloat(String(rawAmount).replace(/[^0-9.-]/g, "")) || 0;
          const formattedDate = normalizeDate(rawDate);
          const formattedMethod = normalizePaymentMethod(rawMethod);

          // Validation logic
          let isValid = true;
          let validationMessage = "";
          let clientName = "";

          if (!rawUnit) {
            isValid = false;
            validationMessage = "Falta el número de unidad";
          } else {
            const unitMatch = project.unitsInventory.find(
              (u) => u.unit.toLowerCase() === rawUnit.toLowerCase()
            );
            if (!unitMatch) {
              isValid = false;
              validationMessage = `Unidad ${rawUnit} no existe en el proyecto`;
            } else {
              clientName = unitMatch.client !== "-" ? unitMatch.client : "Cliente Propietario";
              if (unitMatch.status === "DISPONIBLE") {
                validationMessage = `Unidad disponible (se asignará venta automática)`;
              }
            }
          }

          if (isValid && amountNum <= 0) {
            isValid = false;
            validationMessage = "El monto debe ser mayor a $0";
          }

          return {
            rowNumber: idx + 2, // +2 accounting for header row
            unit: rawUnit,
            amount: amountNum,
            paymentDate: formattedDate,
            paymentMethod: formattedMethod,
            reference: rawRef || `IMPORT-${Math.floor(100000 + Math.random() * 900000)}`,
            notes: rawNotes || "Abono histórico cargado por Excel",
            clientName,
            isValid,
            validationMessage,
          };
        });

        const validCount = rows.filter((r) => r.isValid).length;
        const invalidCount = rows.length - validCount;
        const totalAmount = rows.filter((r) => r.isValid).reduce((sum, r) => sum + r.amount, 0);

        setParsedRows(rows);
        setImportSummary({
          totalRows: rows.length,
          validCount,
          invalidCount,
          totalAmount,
        });

        if (invalidCount > 0) {
          showToast(
            "Archivo Leído con Advertencias",
            `Se detectaron ${validCount} registros válidos y ${invalidCount} filas con errores o unidades no encontradas.`,
            "warning"
          );
        } else {
          showToast(
            "Archivo Validado con Éxito",
            `Se prepararon ${validCount} registros de pagos por un total de ${formatMoney(totalAmount)}.`,
            "success"
          );
        }
      } catch (err) {
        console.error("Error al procesar archivo Excel:", err);
        showToast("Error de Formato", "No se pudo leer el archivo. Asegúrate de usar un formato .xlsx o .csv válido.", "warning");
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Confirm and Import
  const handleExecuteImport = () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      showToast("Sin Registros Válidos", "Corrige las filas con error antes de importar.", "warning");
      return;
    }

    setIsProcessing(true);
    const payload = validRows.map((r) => ({
      unitNumber: r.unit,
      amount: r.amount,
      paymentDate: r.paymentDate,
      paymentMethod: r.paymentMethod,
      reference: r.reference,
      notes: r.notes,
    }));

    const result = bulkRegisterPayments(project.id, payload);
    setIsProcessing(false);

    if (result.successCount > 0) {
      onClose();
    }
  };

  const handleReset = () => {
    setFileName(null);
    setParsedRows([]);
    setImportSummary(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1.5rem",
        backdropFilter: "blur(5px)",
      }}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "1.5rem",
          width: "100%",
          maxWidth: "880px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: "1.5rem 2rem",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            backgroundColor: "#F8FAFC",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  backgroundColor: "rgba(0, 196, 140, 0.12)",
                  color: "#00A877",
                  padding: "0.2rem 0.6rem",
                  borderRadius: "9999px",
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                <FileSpreadsheet size={13} /> Migración & Conciliación Contable
              </span>
            </div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#1F3652", margin: "0.35rem 0 0.15rem" }}>
              Carga Masiva de Pagos y Abonos (XLSX / CSV)
            </h2>
            <p style={{ fontSize: "0.82rem", color: "#64748B", margin: 0 }}>
              Proyecto: <strong>{project.name}</strong> • Importa cobranza histórica y aplica el efecto cascada automáticamente.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              color: "#64748B",
              cursor: "pointer",
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div style={{ padding: "1.75rem 2rem", overflowY: "auto", flex: 1 }}>
          {/* STEP 1: DOWNLOAD TEMPLATE & UPLOAD */}
          {parsedRows.length === 0 ? (
            <div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: "1rem",
                  alignItems: "center",
                  backgroundColor: "#F1F5F9",
                  borderRadius: "1rem",
                  padding: "1.25rem 1.5rem",
                  marginBottom: "1.5rem",
                }}
              >
                <div>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1F3652", margin: "0 0 0.25rem" }}>
                    ¿No tienes el formato oficial de columnas?
                  </h4>
                  <p style={{ fontSize: "0.8rem", color: "#64748B", margin: 0, lineHeight: 1.4 }}>
                    Descarga nuestra plantilla de Excel pre-configurada con las unidades de <strong>{project.name}</strong> para agilizar tu importación sin errores de coincidencia.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    backgroundColor: "#FFFFFF",
                    color: "#1F3652",
                    border: "1px solid #CBD5E1",
                    padding: "0.65rem 1.25rem",
                    borderRadius: "0.75rem",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Download size={15} color="#2F80ED" /> Descargar Plantilla .XLSX
                </button>
              </div>

              {/* DROPZONE */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: dragActive ? "2px dashed #00C48C" : "2px dashed #CBD5E1",
                  backgroundColor: dragActive ? "rgba(0, 196, 140, 0.05)" : "#FAFAFC",
                  borderRadius: "1.25rem",
                  padding: "3rem 2rem",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(47, 128, 237, 0.1)",
                    color: "#2F80ED",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 1rem",
                  }}
                >
                  <UploadCloud size={28} />
                </div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#1F3652", margin: "0 0 0.35rem" }}>
                  Arrastra y suelta tu archivo Excel o haz clic para explorar
                </h3>
                <p style={{ fontSize: "0.8rem", color: "#64748B", margin: "0 0 1rem" }}>
                  Formatos soportados: <strong>.xlsx, .xls, .csv</strong> (máximo 10 MB)
                </p>
                <span
                  style={{
                    display: "inline-block",
                    backgroundColor: "#1B3047",
                    color: "#FFFFFF",
                    padding: "0.55rem 1.25rem",
                    borderRadius: "9999px",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                  }}
                >
                  Seleccionar Archivo
                </span>
              </div>
            </div>
          ) : (
            /* STEP 2: PREVIEW & VALIDATION TABLE */
            <div>
              {/* SUMMARY METRICS CARDS */}
              {importSummary && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "1rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  <div
                    style={{
                      backgroundColor: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      borderRadius: "0.85rem",
                      padding: "1rem",
                    }}
                  >
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                      Archivo Seleccionado
                    </span>
                    <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1F3652", marginTop: "0.2rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {fileName}
                    </div>
                  </div>

                  <div
                    style={{
                      backgroundColor: "#F0FDF4",
                      border: "1px solid #BBF7D0",
                      borderRadius: "0.85rem",
                      padding: "1rem",
                    }}
                  >
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#166534", textTransform: "uppercase" }}>
                      Registros Válidos
                    </span>
                    <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#16A34A", marginTop: "0.2rem" }}>
                      {importSummary.validCount} / {importSummary.totalRows}
                    </div>
                  </div>

                  <div
                    style={{
                      backgroundColor: importSummary.invalidCount > 0 ? "#FEF2F2" : "#F8FAFC",
                      border: importSummary.invalidCount > 0 ? "1px solid #FECACA" : "1px solid #E2E8F0",
                      borderRadius: "0.85rem",
                      padding: "1rem",
                    }}
                  >
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: importSummary.invalidCount > 0 ? "#991B1B" : "#64748B", textTransform: "uppercase" }}>
                      Filas con Errores
                    </span>
                    <div style={{ fontSize: "1.2rem", fontWeight: 800, color: importSummary.invalidCount > 0 ? "#DC2626" : "#64748B", marginTop: "0.2rem" }}>
                      {importSummary.invalidCount}
                    </div>
                  </div>

                  <div
                    style={{
                      backgroundColor: "rgba(0, 196, 140, 0.08)",
                      border: "1px solid rgba(0, 196, 140, 0.25)",
                      borderRadius: "0.85rem",
                      padding: "1rem",
                    }}
                  >
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#00A877", textTransform: "uppercase" }}>
                      Monto Total a Aplicar
                    </span>
                    <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#00A877", marginTop: "0.2rem" }}>
                      {formatMoney(importSummary.totalAmount)}
                    </div>
                  </div>
                </div>
              )}

              {/* TABLE */}
              <div
                style={{
                  border: "1px solid #E2E8F0",
                  borderRadius: "1rem",
                  overflow: "hidden",
                  marginBottom: "1rem",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#1B3047",
                    color: "#FFFFFF",
                    padding: "0.75rem 1rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                  }}
                >
                  <span>Previsualización de Abonos ({parsedRows.length} filas detectadas)</span>
                  <button
                    type="button"
                    onClick={handleReset}
                    style={{
                      background: "rgba(255,255,255,0.15)",
                      border: "none",
                      color: "#FFFFFF",
                      borderRadius: "0.4rem",
                      padding: "0.25rem 0.6rem",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                    }}
                  >
                    <RefreshCw size={12} /> Cargar Otro Archivo
                  </button>
                </div>

                <div style={{ maxHeight: "320px", overflowY: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.8rem" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#475569" }}>
                        <th style={{ padding: "0.6rem 0.75rem", fontWeight: 700, width: "50px" }}>#</th>
                        <th style={{ padding: "0.6rem 0.75rem", fontWeight: 700 }}>Unidad</th>
                        <th style={{ padding: "0.6rem 0.75rem", fontWeight: 700 }}>Cliente Asignado</th>
                        <th style={{ padding: "0.6rem 0.75rem", fontWeight: 700 }}>Monto</th>
                        <th style={{ padding: "0.6rem 0.75rem", fontWeight: 700 }}>Fecha Pago</th>
                        <th style={{ padding: "0.6rem 0.75rem", fontWeight: 700 }}>Método</th>
                        <th style={{ padding: "0.6rem 0.75rem", fontWeight: 700 }}>Referencia / Notas</th>
                        <th style={{ padding: "0.6rem 0.75rem", fontWeight: 700, textAlign: "center" }}>Validación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.map((row) => (
                        <tr
                          key={row.rowNumber}
                          style={{
                            borderBottom: "1px solid #F1F5F9",
                            backgroundColor: row.isValid ? "#FFFFFF" : "#FEF2F2",
                          }}
                        >
                          <td style={{ padding: "0.6rem 0.75rem", color: "#94A3B8" }}>{row.rowNumber}</td>
                          <td style={{ padding: "0.6rem 0.75rem", fontWeight: 700, color: "#1F3652" }}>
                            {row.unit || "-"}
                          </td>
                          <td style={{ padding: "0.6rem 0.75rem", color: "#475569" }}>
                            {row.clientName || "-"}
                          </td>
                          <td style={{ padding: "0.6rem 0.75rem", fontWeight: 700, color: row.isValid ? "#00C48C" : "#EF4444" }}>
                            {formatMoney(row.amount)}
                          </td>
                          <td style={{ padding: "0.6rem 0.75rem", color: "#475569" }}>{row.paymentDate}</td>
                          <td style={{ padding: "0.6rem 0.75rem", color: "#1F3652", fontWeight: 600 }}>{row.paymentMethod}</td>
                          <td style={{ padding: "0.6rem 0.75rem", color: "#64748B", fontSize: "0.75rem" }}>
                            <strong>{row.reference}</strong>
                            {row.notes && <div style={{ color: "#94A3B8" }}>{row.notes}</div>}
                          </td>
                          <td style={{ padding: "0.6rem 0.75rem", textAlign: "center" }}>
                            {row.isValid ? (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.25rem",
                                  backgroundColor: "#DCFCE7",
                                  color: "#166534",
                                  padding: "0.2rem 0.55rem",
                                  borderRadius: "9999px",
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                }}
                              >
                                <Check size={12} /> Válido
                              </span>
                            ) : (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.25rem",
                                  backgroundColor: "#FEE2E2",
                                  color: "#991B1B",
                                  padding: "0.2rem 0.55rem",
                                  borderRadius: "9999px",
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                }}
                                title={row.validationMessage}
                              >
                                <AlertTriangle size={12} /> {row.validationMessage}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CASCADE ADVICE */}
              <div
                style={{
                  backgroundColor: "#FFFBEB",
                  border: "1px solid #FCD34D",
                  borderRadius: "0.75rem",
                  padding: "0.85rem 1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.65rem",
                  fontSize: "0.78rem",
                  color: "#92400E",
                }}
              >
                <AlertCircle size={17} style={{ flexShrink: 0 }} />
                <div>
                  <strong>Efecto Cascada Automático:</strong> Al confirmar, los abonos válidos se registrarán en la cuenta de cada unidad y se amortizarán en orden cronológico sobre las cuotas de enganche, mensualidades y liquidación.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div
          style={{
            padding: "1.25rem 2rem",
            borderTop: "1px solid #E2E8F0",
            backgroundColor: "#F8FAFC",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "0.65rem 1.5rem",
              borderRadius: "9999px",
              border: "1px solid #CBD5E1",
              backgroundColor: "#FFFFFF",
              color: "#64748B",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>

          {parsedRows.length > 0 && (
            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={isProcessing || (importSummary?.validCount || 0) === 0}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.65rem 1.75rem",
                borderRadius: "9999px",
                border: "none",
                backgroundColor: (importSummary?.validCount || 0) > 0 ? "#00C48C" : "#94A3B8",
                color: "#FFFFFF",
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: (importSummary?.validCount || 0) > 0 ? "pointer" : "not-allowed",
                boxShadow: "0 2px 6px rgba(0, 196, 140, 0.3)",
              }}
            >
              <CheckCircle2 size={16} /> Confirmar e Importar {importSummary?.validCount || 0} Abonos ({formatMoney(importSummary?.totalAmount || 0)})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
