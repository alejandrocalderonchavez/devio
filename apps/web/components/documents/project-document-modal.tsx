"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  UploadCloud,
  FileText,
  FileSpreadsheet,
  Layers,
  Check,
  Plus,
  Trash2,
  Eye,
  Info,
} from "lucide-react";
import { ProjectDocument } from "@/data/projects-data";

interface ProjectDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (doc: ProjectDocument) => void;
  initialData?: ProjectDocument | null;
  modalTitle?: string;
}

const DOCUMENT_CATEGORIES = [
  "Contratos",
  "Legal",
  "Planos y Arquitectura",
  "Licencias y Permisos",
  "Fichas Técnicas",
  "Reglamentos y Actas",
  "Financiero y Fiscal",
  "Técnico",
  "Permisos",
  "General",
] as const;

const QUICK_SUGGESTIONS = [
  "Régimen en Condominio",
  "Licencia de Construcción",
  "Contrato de Adhesión",
  "Planos Arquitectónicos",
  "Memoria Descriptiva",
  "Reglamento Interno",
  "Póliza de Garantía",
  "Uso de Suelo",
];

export default function ProjectDocumentModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  modalTitle,
}: ProjectDocumentModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("Contratos");
  const [version, setVersion] = useState("v1.0");
  const [notes, setNotes] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState<"PDF" | "DOCX" | "XLSX" | "DWG" | "ZIP">("PDF");
  const [fileSize, setFileSize] = useState("");
  const [fileDataUrl, setFileDataUrl] = useState("");
  const [isClientVisible, setIsClientVisible] = useState(true);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setCategory(initialData.category || "Contratos");
      setVersion(initialData.version || "v1.0");
      setNotes(initialData.notes || "");
      setFileName((initialData as any).fileName || `${initialData.title || "documento"}.pdf`);
      setFileType(initialData.fileType || "PDF");
      setFileSize(initialData.fileSize || "1.0 MB");
      setFileDataUrl(initialData.url || (initialData as any).fileDataUrl || "");
      setIsClientVisible((initialData as any).isClientVisible !== false);
    } else {
      setTitle("");
      setCategory("Contratos");
      setVersion("v1.0");
      setNotes("");
      setFileName("");
      setFileType("PDF");
      setFileSize("");
      setFileDataUrl("");
      setIsClientVisible(true);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleProcessFile = (file: File) => {
    const rawExt = file.name.split(".").pop()?.toUpperCase() || "PDF";
    let validExt: "PDF" | "DOCX" | "XLSX" | "DWG" | "ZIP" = "PDF";
    if (rawExt.includes("DOC")) validExt = "DOCX";
    else if (rawExt.includes("XLS") || rawExt === "CSV") validExt = "XLSX";
    else if (rawExt === "DWG" || rawExt === "DXF") validExt = "DWG";
    else if (rawExt === "ZIP" || rawExt === "RAR") validExt = "ZIP";

    const sizeStr =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    const titleFromFilename = file.name.replace(/\.[^/.]+$/, "");

    setFileName(file.name);
    setFileType(validExt);
    setFileSize(sizeStr);
    if (!title.trim()) {
      setTitle(titleFromFilename);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setFileDataUrl((e.target?.result as string) || "");
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalDoc: ProjectDocument = {
      id: initialData?.id || `doc-${Date.now()}`,
      title: title.trim(),
      category: category as any,
      fileType: fileType,
      fileSize: fileSize || "1.0 MB",
      uploadDate: initialData?.uploadDate || new Date().toLocaleDateString("es-MX"),
      updatedAt: new Date().toLocaleDateString("es-MX"),
      version: version.trim() || "v1.0",
      notes: notes.trim() || "Documento oficial del proyecto.",
      url: fileDataUrl || initialData?.url || undefined,
      ...(fileName ? { fileName } : {}),
      ...(fileDataUrl ? { fileDataUrl } : {}),
      ...({ isClientVisible } as any),
    };

    onSave(finalDoc);
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "1.25rem",
          width: "100%",
          maxWidth: "580px",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "1.25rem 1.75rem",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "0.5rem",
                backgroundColor: "rgba(31, 54, 82, 0.08)",
                color: "#1F3652",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileText size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                {modalTitle || (initialData ? "Editar Documento" : "Cargar Documento al Proyecto")}
              </h3>
              <p style={{ fontSize: "0.8rem", color: "#64748B", margin: 0 }}>
                Bóveda digital y expediente técnico del desarrollo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#94A3B8",
              cursor: "pointer",
              padding: "0.25rem",
              borderRadius: "0.375rem",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: "1.5rem 1.75rem", display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          {/* File Dropzone */}
          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1F3652", marginBottom: "0.4rem" }}>
              Archivo Adjunto
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: "none" }}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.dwg,.dxf,.zip,.rar,.png,.jpg,.jpeg"
            />

            {fileName ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.75rem 1rem",
                  backgroundColor: "#F8FAFC",
                  border: "1px solid #CBD5E1",
                  borderRadius: "0.75rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", overflow: "hidden" }}>
                  <div
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "0.4rem",
                      backgroundColor: "rgba(111, 172, 156, 0.15)",
                      color: "var(--devio-green, #6FAC9C)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: "0.75rem",
                    }}
                  >
                    {fileType}
                  </div>
                  <div style={{ overflow: "hidden" }}>
                    <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#1F3652", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {fileName}
                    </p>
                    <span style={{ fontSize: "0.75rem", color: "#64748B" }}>{fileSize || "Adjunto"}</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      background: "none",
                      border: "1px solid #CBD5E1",
                      borderRadius: "0.375rem",
                      padding: "0.35rem 0.6rem",
                      fontSize: "0.75rem",
                      color: "#475569",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Cambiar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFileName("");
                      setFileSize("");
                      setFileDataUrl("");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#EF4444",
                      cursor: "pointer",
                      padding: "0.35rem",
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragActive ? "#1F3652" : "#CBD5E1"}`,
                  backgroundColor: dragActive ? "rgba(31, 54, 82, 0.04)" : "#F8FAFC",
                  borderRadius: "0.75rem",
                  padding: "1.25rem 1rem",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <UploadCloud size={28} color="#64748B" style={{ margin: "0 auto 0.4rem" }} />
                <p style={{ margin: "0 0 0.2rem 0", fontSize: "0.85rem", fontWeight: 700, color: "#1F3652" }}>
                  Haz clic o arrastra tu archivo aquí
                </p>
                <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
                  PDF, Word, Excel, Planos DWG o ZIP (hasta 50MB)
                </span>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1F3652", marginBottom: "0.35rem" }}>
              Nombre / Título del Documento *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Contrato Marco de Adhesión PROFECO"
              style={{
                width: "100%",
                padding: "0.65rem 0.85rem",
                borderRadius: "0.5rem",
                border: "1px solid #CBD5E1",
                fontSize: "0.88rem",
                color: "#1F3652",
                outline: "none",
              }}
            />
          </div>

          {/* Category & Version */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1F3652", marginBottom: "0.35rem" }}>
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.65rem 0.85rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #CBD5E1",
                  fontSize: "0.88rem",
                  color: "#1F3652",
                  backgroundColor: "#FFFFFF",
                  outline: "none",
                }}
              >
                {DOCUMENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1F3652", marginBottom: "0.35rem" }}>
                Versión
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="v1.0"
                style={{
                  width: "100%",
                  padding: "0.65rem 0.85rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #CBD5E1",
                  fontSize: "0.88rem",
                  color: "#1F3652",
                  outline: "none",
                }}
              >
              </input>
            </div>
          </div>

          {/* Quick Suggestions */}
          {!initialData && (
            <div>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "0.3rem" }}>
                Sugerencias rápidas:
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                {QUICK_SUGGESTIONS.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => {
                      setTitle(sug);
                      if (sug.includes("Condominio") || sug.includes("Reglamento")) setCategory("Reglamentos y Actas");
                      else if (sug.includes("Licencia") || sug.includes("Suelo")) setCategory("Licencias y Permisos");
                      else if (sug.includes("Planos")) setCategory("Planos y Arquitectura");
                      else if (sug.includes("Contrato")) setCategory("Contratos");
                    }}
                    style={{
                      background: "none",
                      border: "1px solid #E2E8F0",
                      borderRadius: "9999px",
                      padding: "0.25rem 0.6rem",
                      fontSize: "0.72rem",
                      color: "#475569",
                      cursor: "pointer",
                      backgroundColor: title === sug ? "rgba(31, 54, 82, 0.08)" : "#FFFFFF",
                      fontWeight: title === sug ? 700 : 500,
                    }}
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Internal Notes */}
          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1F3652", marginBottom: "0.35rem" }}>
              Notas u Observaciones
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anotaciones internas sobre el documento, vigencia o folios..."
              style={{
                width: "100%",
                padding: "0.6rem 0.85rem",
                borderRadius: "0.5rem",
                border: "1px solid #CBD5E1",
                fontSize: "0.85rem",
                color: "#1F3652",
                outline: "none",
                resize: "none",
              }}
            />
          </div>

          {/* Modal Actions */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem",
              marginTop: "0.5rem",
              paddingTop: "1rem",
              borderTop: "1px solid #E2E8F0",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.6rem 1.25rem",
                borderRadius: "9999px",
                border: "1px solid #CBD5E1",
                backgroundColor: "#FFFFFF",
                color: "#475569",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                padding: "0.6rem 1.5rem",
                borderRadius: "9999px",
                border: "none",
                backgroundColor: "#1F3652",
                color: "#FFFFFF",
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(31, 54, 82, 0.2)",
              }}
            >
              {initialData ? "Guardar Cambios" : "Guardar Documento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
