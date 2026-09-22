"use client";

import React, { useState, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import {
  FileText,
  Search,
  Plus,
  Edit2,
  Trash2,
  Info,
  X,
  Download,
  UploadCloud,
  FileCheck,
  CheckCircle2,
  Printer,
  FileSpreadsheet,
  Layers,
  Eye,
} from "lucide-react";
import AppLayout from "../../../../components/layout/app-layout";
import { useProject } from "../../../../context/project-context";
import { ProjectDocument } from "../../../../data/projects-data";
import { exportTableToExcel, exportTableToPDF } from "../../../../lib/export-utils";
import { ShieldAlert } from "lucide-react";

export default function ProjectDocumentsPage() {
  const params = useParams();
  const projectId = (params?.id as string) || "p-1";
  const { getProject, addProjectDocument, updateProjectDocuments, deleteProjectDocument, showToast, hasPermission } = useProject();
  const project = getProject(projectId);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedDocForView, setSelectedDocForView] = useState<ProjectDocument | null>(null);
  const [selectedDocForEdit, setSelectedDocForEdit] = useState<ProjectDocument | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Documents derived directly from project context (no dummy data)
  const documents: ProjectDocument[] = useMemo(() => {
    if (!project) return [];
    return project.documents || [];
  }, [project]);

  // Upload Form State
  const [uploadForm, setUploadForm] = useState({
    title: "",
    category: "Contratos" as const,
    version: "v1.0",
    notes: "",
    file: null as File | null,
    fileType: "PDF" as "PDF" | "DOCX" | "XLSX" | "DWG" | "ZIP",
    fileSize: "0 KB",
    fileDataUrl: "",
  });

  // Filtered Documents
  const filteredDocs = useMemo(() => {
    let result = [...documents];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q) ||
          (d.notes && d.notes.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== "ALL") {
      result = result.filter((d) => d.category === selectedCategory);
    }

    return result;
  }, [documents, searchQuery, selectedCategory]);

  const handleProcessFile = (file: File) => {
    const rawExt = file.name.split(".").pop()?.toUpperCase() || "PDF";
    let validExt: "PDF" | "DOCX" | "XLSX" | "DWG" | "ZIP" = "PDF";
    if (rawExt.includes("DOC")) validExt = "DOCX";
    else if (rawExt.includes("XLS") || rawExt === "CSV") validExt = "XLSX";
    else if (rawExt === "DWG" || rawExt === "DXF") validExt = "DWG";
    else if (rawExt === "ZIP" || rawExt === "RAR") validExt = "ZIP";

    const sizeStr = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    const titleFromFilename = file.name.replace(/\.[^/.]+$/, "");

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = (e.target?.result as string) || "";
      setUploadForm((prev) => ({
        ...prev,
        title: prev.title.trim() ? prev.title : titleFromFilename,
        file: file,
        fileType: validExt,
        fileSize: sizeStr,
        fileDataUrl: dataUrl,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
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
    if (file) {
      handleProcessFile(file);
    }
  };

  // Upload handler
  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.title.trim() || !project) return;

    const newDoc: ProjectDocument = {
      id: `doc-${Date.now()}`,
      title: uploadForm.title.trim(),
      category: uploadForm.category as any,
      fileType: uploadForm.fileType,
      fileSize: uploadForm.fileSize || "1.5 MB",
      uploadDate: new Date().toLocaleDateString("es-MX"),
      updatedAt: new Date().toLocaleDateString("es-MX"),
      version: uploadForm.version.trim() || "v1.0",
      notes: uploadForm.notes.trim() || "Documento adjunto al expediente de desarrollo.",
    };

    addProjectDocument(project.id, newDoc);
    setShowUploadModal(false);
    setUploadForm({
      title: "",
      category: "Contratos",
      version: "v1.0",
      notes: "",
      file: null,
      fileType: "PDF",
      fileSize: "0 KB",
      fileDataUrl: "",
    });
  };

  // Edit handler
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocForEdit || !project) return;

    const updated = documents.map((d) =>
      d.id === selectedDocForEdit.id ? selectedDocForEdit : d
    );
    updateProjectDocuments(project.id, updated);
    showToast("Documento Actualizado", `Los cambios en "${selectedDocForEdit.title}" fueron guardados.`);
    setSelectedDocForEdit(null);
  };

  // Delete handler
  const handleDeleteDoc = (id: string, title: string) => {
    if (!project) return;
    if (confirm(`¿Estás seguro de que deseas eliminar el documento "${title}"?`)) {
      deleteProjectDocument(project.id, id);
    }
  };

  // Export List handler
  const handleExportList = () => {
    if (!project) return;
    const dataToExport = filteredDocs.map((d) => ({
      "Título del Documento": d.title,
      "Categoría": d.category,
      "Tipo de Archivo": d.fileType,
      "Tamaño": d.fileSize,
      "Versión": d.version || "v1.0",
      "Fecha de Subida": d.uploadDate,
      "Notas": d.notes || "",
    }));

    exportTableToExcel(dataToExport, `Boveda_Documentos_${project.name.replace(/\s+/g, "_")}`, "Documentos");
    showToast("Excel Exportado", `Se descargó el catálogo de ${filteredDocs.length} documentos.`);
  };

  if (!project) return null;

  if (!hasPermission("documents.view")) {
    return (
      <AppLayout activeProjectId={projectId} projectSubTab="documents">
        <main style={{ padding: "3rem 2rem", flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1.25rem", padding: "3rem", textAlign: "center", maxWidth: "480px", border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "#FEF2F2", color: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem auto" }}>
              <ShieldAlert size={28} />
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1F3652", marginBottom: "0.5rem" }}>Acceso Restringido</h2>
            <p style={{ fontSize: "0.88rem", color: "#64748B", lineHeight: 1.5, margin: 0 }}>
              Tu perfil de usuario no cuenta con permisos para ver o consultar la bóveda de documentos de este desarrollo. Contacta a un administrador si requieres acceso.
            </p>
          </div>
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout activeProjectId={projectId} projectSubTab="documents">
      <main style={{ padding: "1.25rem 2rem 2rem 2rem", flex: 1, overflowY: "auto" }}>
        
        {/* ENCABEZADO PRINCIPAL (Exacto a Screenshot 4) */}
        <div style={{ marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
              Documentos
            </h1>
          </div>
        </div>

        {/* BARRA SUPERIOR: SEARCH CON ICONO INFO + BOTÓN SUBIR DOCUMENTOS (Exacto a Screenshot 4) */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "1.25rem",
            padding: "1rem 1.5rem",
            boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
            border: "1px solid rgba(22, 43, 63, 0.05)",
            marginBottom: "1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          {/* Input Search Documents con Icono Info a la izquierda */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, maxWidth: "650px" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8" }}>
              <Info size={16} />
            </div>
            
            <div style={{ position: "relative", flex: 1 }}>
              <Search
                size={18}
                style={{
                  position: "absolute",
                  left: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94A3B8",
                  pointerEvents: "none",
                }}
              />
              <input
                type="text"
                placeholder="Search Documents"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.65rem 1rem 0.65rem 2.75rem",
                  borderRadius: "9999px",
                  border: "1px solid #E2E8F0",
                  backgroundColor: "#FFFFFF",
                  fontSize: "0.85rem",
                  color: "#1F3652",
                  outline: "none",
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  style={{
                    position: "absolute",
                    right: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#94A3B8",
                    cursor: "pointer",
                  }}
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Botón Subir Documentos */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={handleExportList}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                padding: "0.6rem 1.1rem",
                borderRadius: "9999px",
                border: "1px solid #E2E8F0",
                backgroundColor: "#FFFFFF",
                fontSize: "0.82rem",
                fontWeight: 600,
                color: "#1F3652",
                cursor: "pointer",
              }}
            >
              <Download size={14} color="#64748B" /> Exportar Lista
            </button>

            {hasPermission("documents.upload") && (
              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  backgroundColor: "#1B3047",
                  color: "#FFFFFF",
                  padding: "0.6rem 1.4rem",
                  borderRadius: "9999px",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(27, 48, 71, 0.15)",
                }}
              >
                <FileText size={15} /> Subir Documentos
              </button>
            )}
          </div>
        </div>

        {/* FILTROS POR CATEGORÍA */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", overflowX: "auto" }}>
          {["ALL", "Contratos", "Legal", "Técnico", "Permisos"].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: "0.45rem 1rem",
                borderRadius: "9999px",
                fontSize: "0.8rem",
                fontWeight: 600,
                border: selectedCategory === cat ? "none" : "1px solid #CBD5E1",
                backgroundColor: selectedCategory === cat ? "#1B3047" : "#FFFFFF",
                color: selectedCategory === cat ? "#FFFFFF" : "#64748B",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {cat === "ALL" ? "Todos los Documentos" : cat}
            </button>
          ))}
        </div>

        {/* GRID DE DOCUMENTOS O EMPTY STATE */}
        {filteredDocs.length === 0 ? (
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "1.25rem",
              padding: "4rem 2rem",
              textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              border: "1px dashed #CBD5E1",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "16px",
                backgroundColor: "rgba(31, 54, 82, 0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--devio-blue)",
                marginBottom: "1rem",
              }}
            >
              <FileText size={28} />
            </div>
            <h4 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--devio-blue-dark)", margin: "0 0 0.35rem 0" }}>
              {searchQuery.trim() || selectedCategory !== "ALL"
                ? "No se encontraron documentos"
                : "Expediente digital vacío"}
            </h4>
            <p style={{ fontSize: "0.85rem", color: "var(--devio-neutral-3)", maxWidth: "440px", margin: "0 0 1.25rem 0", lineHeight: 1.5 }}>
              {searchQuery.trim() || selectedCategory !== "ALL"
                ? "No hay archivos que coincidan con los filtros seleccionados."
                : "Sube y centraliza contratos, licencias, planos o documentación legal de este desarrollo para mantener organizado el expediente."}
            </p>
            {hasPermission("documents.upload") && (
              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                style={{
                  backgroundColor: "var(--devio-blue-dark)",
                  color: "var(--devio-white)",
                  padding: "0.6rem 1.4rem",
                  borderRadius: "9999px",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  boxShadow: "0 2px 6px rgba(27, 48, 71, 0.15)",
                }}
              >
                <Plus size={16} /> Subir Primer Documento
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" }}>
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "0.85rem",
                  padding: "1.25rem",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  border: "1px solid rgba(22, 43, 63, 0.06)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: "125px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
              >
                {/* Fila Superior: Título + Iconos de Editar / Eliminar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1F3652", margin: 0, lineHeight: 1.3 }}>
                    {doc.title}
                  </h3>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                    {hasPermission("documents.upload") && (
                      <button
                        type="button"
                        onClick={() => setSelectedDocForEdit(doc)}
                        style={{ background: "none", border: "none", color: "#3B82F6", cursor: "pointer", padding: "2px" }}
                        title="Editar documento"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                    {hasPermission("documents.delete") && (
                      <button
                        type="button"
                        onClick={() => handleDeleteDoc(doc.id, doc.title)}
                        style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", padding: "2px" }}
                        title="Eliminar documento"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Categoría & Versión */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: "0.6rem 0" }}>
                  <span
                    style={{
                      backgroundColor: "rgba(47, 128, 237, 0.08)",
                      color: "#2F80ED",
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      padding: "0.15rem 0.5rem",
                      borderRadius: "4px",
                    }}
                  >
                    {doc.category}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>
                    {doc.fileSize} • {doc.uploadDate}
                  </span>
                </div>

                {/* Botón Ver (Exacto a Screenshot 4) */}
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <button
                    type="button"
                    onClick={() => setSelectedDocForView(doc)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      backgroundColor: "#1B3047",
                      color: "#FFFFFF",
                      padding: "0.45rem 1.35rem",
                      borderRadius: "9999px",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 2px 4px rgba(27, 48, 71, 0.15)",
                    }}
                  >
                    Ver
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODAL VER DOCUMENTO / PREVIEW */}
        {selectedDocForView && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "1rem",
              backdropFilter: "blur(4px)",
            }}
          >
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "1.25rem",
                width: "100%",
                maxWidth: "680px",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                padding: "2rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "0.6rem",
                      backgroundColor: "rgba(239, 68, 68, 0.1)",
                      color: "#EF4444",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FileText size={22} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                      {selectedDocForView.title}
                    </h2>
                    <span style={{ fontSize: "0.78rem", color: "#64748B" }}>
                      {selectedDocForView.category} • Versión {selectedDocForView.version || "v1.0"} • {selectedDocForView.fileSize}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDocForView(null)}
                  style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Simulación de Visor de PDF */}
              <div
                style={{
                  backgroundColor: "#F1F5F9",
                  borderRadius: "0.85rem",
                  border: "1px solid #CBD5E1",
                  padding: "3rem 2rem",
                  textAlign: "center",
                  marginBottom: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <FileCheck size={48} color="#2F80ED" />
                <h4 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#1F3652", margin: 0 }}>
                  {selectedDocForView.title}.pdf
                </h4>
                <p style={{ fontSize: "0.82rem", color: "#64748B", maxWidth: "450px", margin: 0 }}>
                  {selectedDocForView.notes || "Documento oficial listo para visualización y descarga."}
                </p>
                <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
                  Última actualización: {selectedDocForView.updatedAt}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => {
                    showToast("Descarga Iniciada", `Descargando ${selectedDocForView.title}.pdf`);
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    padding: "0.55rem 1.25rem",
                    borderRadius: "9999px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    color: "#1F3652",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <Download size={15} color="#2F80ED" /> Descargar PDF
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDocForView(null)}
                  style={{
                    padding: "0.55rem 1.35rem",
                    borderRadius: "9999px",
                    backgroundColor: "#1B3047",
                    color: "#FFFFFF",
                    border: "none",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL SUBIR DOCUMENTOS */}
        {showUploadModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "1rem",
              backdropFilter: "blur(4px)",
            }}
          >
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "1.25rem",
                width: "100%",
                maxWidth: "540px",
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                padding: "2rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                  Subir Nuevo Documento
                </h2>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUploadSubmit}>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
                  <div>
                    <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                      Nombre del Documento
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Contrato de Compraventa 2026"
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.6rem",
                        border: "1px solid #CBD5E1",
                        fontSize: "0.85rem",
                        color: "#1F3652",
                      }}
                      required
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <div>
                      <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                        Categoría
                      </label>
                      <select
                        value={uploadForm.category}
                        onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value as any })}
                        style={{
                          width: "100%",
                          padding: "0.65rem 0.85rem",
                          borderRadius: "0.6rem",
                          border: "1px solid #CBD5E1",
                          fontSize: "0.85rem",
                          color: "#1F3652",
                          backgroundColor: "#FFFFFF",
                        }}
                      >
                        <option value="Contratos">Contratos</option>
                        <option value="Legal">Legal</option>
                        <option value="Técnico">Técnico & Planos</option>
                        <option value="Permisos">Permisos & Licencias</option>
                        <option value="General">General</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                        Versión
                      </label>
                      <input
                        type="text"
                        placeholder="v1.0"
                        value={uploadForm.version}
                        onChange={(e) => setUploadForm({ ...uploadForm, version: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "0.65rem 0.85rem",
                          borderRadius: "0.6rem",
                          border: "1px solid #CBD5E1",
                          fontSize: "0.85rem",
                          color: "#1F3652",
                        }}
                      />
                    </div>
                  </div>

                  {/* File Input & Real Interactive Dropzone */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf,.docx,.doc,.xlsx,.xls,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    style={{
                      border: dragActive ? "2px dashed #00C48C" : uploadForm.file ? "2px solid #00C48C" : "2px dashed #CBD5E1",
                      borderRadius: "0.85rem",
                      padding: "1.5rem 1rem",
                      textAlign: "center",
                      backgroundColor: dragActive ? "rgba(0, 196, 140, 0.05)" : uploadForm.file ? "#F0FDF4" : "#F8FAFC",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {uploadForm.file ? (
                      <div>
                        <div
                          style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "50%",
                            backgroundColor: "#DCFCE7",
                            color: "#166534",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 0.5rem",
                          }}
                        >
                          <CheckCircle2 size={24} color="#00C48C" />
                        </div>
                        <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#1F3652", display: "block" }}>
                          {uploadForm.file.name}
                        </span>
                        <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", alignItems: "center", marginTop: "0.35rem" }}>
                          <span style={{ fontSize: "0.75rem", backgroundColor: "#E2E8F0", color: "#475569", padding: "0.15rem 0.5rem", borderRadius: "4px", fontWeight: 700 }}>
                            {uploadForm.fileType}
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                            {uploadForm.fileSize}
                          </span>
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "#2F80ED", fontWeight: 600, display: "inline-block", marginTop: "0.5rem" }}>
                          Haz clic para seleccionar otro archivo
                        </span>
                      </div>
                    ) : (
                      <div>
                        <UploadCloud size={32} color="#2F80ED" style={{ margin: "0 auto 0.5rem" }} />
                        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1F3652", display: "block" }}>
                          Arrastra tu archivo aquí o haz clic para explorar
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
                          Soporta PDF, DOCX, XLSX, PNG, JPG (hasta 50MB)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    style={{
                      padding: "0.55rem 1.25rem",
                      borderRadius: "9999px",
                      border: "1px solid #CBD5E1",
                      backgroundColor: "#FFFFFF",
                      color: "#64748B",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: "0.55rem 1.4rem",
                      borderRadius: "9999px",
                      backgroundColor: "#1B3047",
                      color: "#FFFFFF",
                      border: "none",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(27, 48, 71, 0.15)",
                    }}
                  >
                    Subir Documento
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL EDITAR DOCUMENTO */}
        {selectedDocForEdit && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "1rem",
              backdropFilter: "blur(4px)",
            }}
          >
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "1.25rem",
                width: "100%",
                maxWidth: "500px",
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                padding: "2rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                  Editar Documento
                </h2>
                <button
                  type="button"
                  onClick={() => setSelectedDocForEdit(null)}
                  style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit}>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
                  <div>
                    <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                      Título
                    </label>
                    <input
                      type="text"
                      value={selectedDocForEdit.title}
                      onChange={(e) => setSelectedDocForEdit({ ...selectedDocForEdit, title: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.6rem",
                        border: "1px solid #CBD5E1",
                        fontSize: "0.85rem",
                        color: "#1F3652",
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                      Categoría
                    </label>
                    <select
                      value={selectedDocForEdit.category}
                      onChange={(e) => setSelectedDocForEdit({ ...selectedDocForEdit, category: e.target.value as any })}
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.6rem",
                        border: "1px solid #CBD5E1",
                        fontSize: "0.85rem",
                        color: "#1F3652",
                        backgroundColor: "#FFFFFF",
                      }}
                    >
                      <option value="Contratos">Contratos</option>
                      <option value="Legal">Legal</option>
                      <option value="Técnico">Técnico</option>
                      <option value="Permisos">Permisos</option>
                      <option value="General">General</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                      Notas / Descripción
                    </label>
                    <textarea
                      value={selectedDocForEdit.notes || ""}
                      onChange={(e) => setSelectedDocForEdit({ ...selectedDocForEdit, notes: e.target.value })}
                      rows={3}
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.6rem",
                        border: "1px solid #CBD5E1",
                        fontSize: "0.85rem",
                        color: "#1F3652",
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                  <button
                    type="button"
                    onClick={() => setSelectedDocForEdit(null)}
                    style={{
                      padding: "0.55rem 1.25rem",
                      borderRadius: "9999px",
                      border: "1px solid #CBD5E1",
                      backgroundColor: "#FFFFFF",
                      color: "#64748B",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: "0.55rem 1.4rem",
                      borderRadius: "9999px",
                      backgroundColor: "#1B3047",
                      color: "#FFFFFF",
                      border: "none",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(27, 48, 71, 0.15)",
                    }}
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </AppLayout>
  );
}
