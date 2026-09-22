"use client";

import React, { useState } from "react";
import { X, UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, Sparkles, Layers, Package, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { UnitItem } from "./bulk-price-modal";
import { ProjectAdditional } from "./manage-additionals-modal";

export interface UploadInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportUnits?: (newUnits: UnitItem[]) => void;
  onImportAddons?: (newAddons: ProjectAdditional[]) => void;
}

export default function UploadInventoryModal({
  isOpen,
  onClose,
  onImportUnits,
  onImportAddons,
}: UploadInventoryModalProps) {
  const [uploadTarget, setUploadTarget] = useState<"units" | "addons">("units");
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewCount, setPreviewCount] = useState<number>(0);
  const [importSuccess, setImportSuccess] = useState(false);

  if (!isOpen) return null;

  const parseRowsFromFile = async (file: File): Promise<string[][]> => {
    const isCsv = file.name.endsWith(".csv") || file.type.includes("csv") || file.type.includes("text");
    if (isCsv) {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      return lines.map((line) => line.split(",").map((c) => c.replace(/^["']|["']$/g, "").trim()));
    } else {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) return [];
      const worksheet = workbook.Sheets[firstSheetName];
      if (!worksheet) return [];
      const rawJson = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
      return rawJson
        .filter((r) => Array.isArray(r) && r.some((c) => c !== undefined && c !== null && String(c).trim() !== ""))
        .map((r) => r.map((c) => (c !== undefined && c !== null ? String(c).trim() : "")));
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    setSelectedFile(file);
    setIsProcessing(true);
    try {
      const rows = await parseRowsFromFile(file);
      if (rows.length > 1) {
        setPreviewCount(rows.length - 1);
      } else {
        setPreviewCount(rows.length);
      }
    } catch {
      setPreviewCount(1);
    }
    setIsProcessing(false);
  };

  const handleConfirmImport = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    try {
      const matrix = await parseRowsFromFile(selectedFile);
      if (matrix.length > 0) {
        const rows = matrix.length > 1 ? matrix.slice(1) : matrix;

        if (uploadTarget === "units" && onImportUnits) {
          const parsedUnits: UnitItem[] = rows.map((cols, i) => {
            return {
              id: `u-imp-${Date.now()}-${i}`,
              unit: cols[0] || `Unidad ${i + 1}`,
              type: cols[1] || "Departamento",
              areaM2: Number(String(cols[2]).replace(/[^0-9.-]+/g, "")) || 75,
              floor: Number(String(cols[3]).replace(/[^0-9.-]+/g, "")) || 1,
              price: Number(String(cols[4]).replace(/[^0-9.-]+/g, "")) || 1000000,
              status: (cols[5] as any) || "DISPONIBLE",
              client: cols[6] && cols[6] !== "-" ? cols[6] : "-",
              deliveryDate: cols[7] || "",
            };
          });
          onImportUnits(parsedUnits);
        } else if (uploadTarget === "addons" && onImportAddons) {
          const parsedAddons: ProjectAdditional[] = rows.map((cols, i) => {
            const rawCat = (cols[1] || "").toLowerCase();
            let cat: ProjectAdditional["category"] = "otro";
            if (rawCat.includes("estacionamiento") || rawCat.includes("cajon") || rawCat.includes("cajón") || rawCat.includes("auto")) cat = "estacionamiento";
            else if (rawCat.includes("bodega") || rawCat.includes("storage")) cat = "bodega";
            else if (rawCat.includes("acabado") || rawCat.includes("paquete")) cat = "acabados";
            else if (rawCat.includes("terraza") || rawCat.includes("balcon") || rawCat.includes("balcón") || rawCat.includes("roof")) cat = "terraza";

            return {
              id: `add-imp-${Date.now()}-${i}`,
              name: cols[0] || `Adicional ${i + 1}`,
              category: cat,
              price: Number(String(cols[2]).replace(/[^0-9.-]+/g, "")) || 50000,
              areaM2: Number(String(cols[3]).replace(/[^0-9.-]+/g, "")) || 5,
              status: "DISPONIBLE",
              notes: cols[4] || "",
            };
          });
          onImportAddons(parsedAddons);
        }
      }
    } catch (err) {
      console.error("Import error:", err);
    }

    setTimeout(() => {
      setIsProcessing(false);
      setImportSuccess(true);
      setTimeout(() => {
        setImportSuccess(false);
        onClose();
      }, 800);
    }, 400);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(10, 25, 41, 0.6)",
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
          maxWidth: "540px",
          padding: "2rem",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          position: "relative",
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

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              backgroundColor: "rgba(31, 54, 82, 0.08)",
              color: "#1F3652",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 0.75rem auto",
            }}
          >
            <UploadCloud size={24} />
          </div>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1F3652", marginBottom: "0.25rem" }}>
            Subir Archivo de Inventario
          </h3>
          <p style={{ fontSize: "0.82rem", color: "#64748B" }}>
            Carga masiva en formato Excel (.xlsx, .xls) o CSV.
          </p>
        </div>

        {/* Target Selector: Unidades vs Adicionales */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", backgroundColor: "#F1F5F9", padding: "0.3rem", borderRadius: "9999px" }}>
          <button
            type="button"
            onClick={() => {
              setUploadTarget("units");
              setSelectedFile(null);
              setPreviewCount(0);
            }}
            style={{
              flex: 1,
              padding: "0.5rem 1rem",
              borderRadius: "9999px",
              border: "none",
              backgroundColor: uploadTarget === "units" ? "#1B3047" : "transparent",
              color: uploadTarget === "units" ? "#FFFFFF" : "#64748B",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.4rem",
              transition: "all 0.2s ease",
            }}
          >
            <Layers size={15} /> Unidades de Inventario
          </button>
          <button
            type="button"
            onClick={() => {
              setUploadTarget("addons");
              setSelectedFile(null);
              setPreviewCount(0);
            }}
            style={{
              flex: 1,
              padding: "0.5rem 1rem",
              borderRadius: "9999px",
              border: "none",
              backgroundColor: uploadTarget === "addons" ? "#1B3047" : "transparent",
              color: uploadTarget === "addons" ? "#FFFFFF" : "#64748B",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.4rem",
              transition: "all 0.2s ease",
            }}
          >
            <Package size={15} /> Adicionales / Addons
          </button>
        </div>

        {/* Drag and drop box */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          style={{
            border: dragActive ? "2px dashed #00C48C" : "2px dashed #D0DBE5",
            borderRadius: "1rem",
            padding: "2rem 1.5rem",
            textAlign: "center",
            backgroundColor: dragActive ? "rgba(0, 196, 140, 0.05)" : "#F8FAFC",
            cursor: "pointer",
            position: "relative",
            marginBottom: "1.25rem",
            transition: "all 0.2s ease",
          }}
        >
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileChange}
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0,
              cursor: "pointer",
              width: "100%",
              height: "100%",
            }}
          />

          {selectedFile ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem" }}>
              <FileSpreadsheet size={36} color="#00C48C" />
              <strong style={{ fontSize: "0.9rem", color: "#1F3652" }}>{selectedFile.name}</strong>
              <span style={{ fontSize: "0.78rem", color: "#64748B" }}>
                {(selectedFile.size / 1024).toFixed(1)} KB • {previewCount > 0 ? `${previewCount} registros listos para importar` : "Analizando columnas..."}
              </span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem" }}>
              <FileSpreadsheet size={36} color="#8B9BB0" />
              <strong style={{ fontSize: "0.9rem", color: "#1F3652" }}>
                Arrastra tu archivo .xlsx o .csv aquí
              </strong>
              <span style={{ fontSize: "0.78rem", color: "#8B9BB0" }}>
                o haz clic para explorar en tu computadora
              </span>
            </div>
          )}
        </div>

        {importSuccess ? (
          <div style={{ padding: "1rem", backgroundColor: "rgba(0, 196, 140, 0.12)", color: "#00C48C", borderRadius: "0.75rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
            <CheckCircle2 size={20} /> ¡Importación completada con éxito!
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.6rem 1.25rem",
                borderRadius: "9999px",
                border: "1px solid #D0DBE5",
                backgroundColor: "#FFFFFF",
                color: "#1F3652",
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={!selectedFile || isProcessing}
              style={{
                padding: "0.6rem 1.5rem",
                borderRadius: "9999px",
                border: "none",
                backgroundColor: !selectedFile || isProcessing ? "#CBD5E1" : "#1B3047",
                color: "#FFFFFF",
                fontSize: "0.85rem",
                fontWeight: 800,
                cursor: !selectedFile || isProcessing ? "not-allowed" : "pointer",
                boxShadow: "0 2px 8px rgba(27, 48, 71, 0.2)",
              }}
            >
              {isProcessing ? "Procesando..." : "Importar Datos"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
