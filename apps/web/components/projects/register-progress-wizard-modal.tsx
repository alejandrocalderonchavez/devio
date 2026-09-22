"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  Upload,
  Image as ImageIcon,
  FileText,
  CheckCircle2,
  HardHat,
  ChevronDown,
  ChevronUp,
  Building,
  Layers,
  Search,
  Filter,
  Users,
} from "lucide-react";
import { DevioDatePicker } from "../ui/devio-date-picker";
import { ProjectItem, ProjectConstructionAdvance } from "../../data/projects-data";
import { useProject } from "../../context/project-context";

export interface RegisterProgressWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: ProjectItem | null;
  projectName?: string;
  currentProgressPct?: number;
  onProgressSaved?: (progressData: ProjectConstructionAdvance) => void;
}

export default function RegisterProgressWizardModal({
  isOpen,
  onClose,
  project,
  projectName = "Proyecto",
  currentProgressPct = 0,
  onProgressSaved,
}: RegisterProgressWizardModalProps) {
  const { registerConstructionProgress, getProject } = useProject();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Resolve active project from context if needed
  const activeProject = project?.id ? getProject(project.id) || project : project;
  const targetProjectName = activeProject?.name || projectName;
  const initialProgress = activeProject?.progressPct !== undefined ? activeProject.progressPct : currentProgressPct;
  const unitsInventory = activeProject?.unitsInventory || [];
  const historyAdvances = activeProject?.constructionHistory || [];

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);

  // Form states - Step 1: Bitácora & Alcance
  const [targetScope, setTargetScope] = useState<"PROJECT" | "UNITS">("PROJECT");
  const [selectedUnitNumbers, setSelectedUnitNumbers] = useState<string[]>([]);
  const [unitSearchQuery, setUnitSearchQuery] = useState<string>("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");

  // Form states - Step 2: Porcentajes de Obra
  const [overallPct, setOverallPct] = useState<number>(initialProgress || 0);
  const [cimentacionPct, setCimentacionPct] = useState<number>(initialProgress >= 30 ? 100 : initialProgress || 0);
  const [estructuraPct, setEstructuraPct] = useState<number>(initialProgress || 0);
  const [instalacionesPct, setInstalacionesPct] = useState<number>(Math.max(0, (initialProgress || 0) - 20));
  const [acabadosPct, setAcabadosPct] = useState<number>(Math.max(0, (initialProgress || 0) - 40));

  // Form states - Step 3: Fotos y Documentos (Clean empty state, no dummy data)
  const [photos, setPhotos] = useState<Array<{ name: string; url: string; size: string }>>([]);
  const [uploadedDocument, setUploadedDocument] = useState<{ name: string; size: string; url?: string } | null>(null);

  // Form states - Step 4: Difusión y Envío
  const [sendEmailToClients, setSendEmailToClients] = useState<boolean>(true);

  if (!isOpen) return null;

  const stepsList = [
    { num: 1, label: "Bitácora y Alcance" },
    { num: 2, label: "Porcentajes de Obra" },
    { num: 3, label: "Fotos y Evidencias" },
    { num: 4, label: "Revisión y Difusión" },
  ];

  // Filter units for manual selection
  const filteredUnits = unitsInventory.filter((u) => {
    if (!unitSearchQuery.trim()) return true;
    const q = unitSearchQuery.toLowerCase();
    return (
      u.unit.toLowerCase().includes(q) ||
      u.type.toLowerCase().includes(q) ||
      (u.client && u.client.toLowerCase().includes(q)) ||
      (u.floor && `piso ${u.floor}`.includes(q))
    );
  });

  const handleToggleUnit = (unitNumber: string) => {
    setSelectedUnitNumbers((prev) =>
      prev.includes(unitNumber) ? prev.filter((n) => n !== unitNumber) : [...prev, unitNumber]
    );
  };

  const handleSelectAllUnits = () => {
    setSelectedUnitNumbers(unitsInventory.map((u) => u.unit));
  };

  const handleDeselectAllUnits = () => {
    setSelectedUnitNumbers([]);
  };

  // Image Upload Handler
  const handlePhotoFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setPhotos((prev) => [
            ...prev,
            {
              name: file.name,
              url: ev.target!.result as string,
              size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Document Upload Handler
  const handleDocFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedDocument({
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
    });
  };

  const handleSaveProgress = () => {
    if (!title.trim()) {
      alert("Por favor ingresa un título descriptivo para el avance de obra.");
      return;
    }

    if (targetScope === "UNITS" && selectedUnitNumbers.length === 0) {
      alert("Has seleccionado alcance por unidad. Por favor selecciona al menos una unidad.");
      return;
    }

    setIsSubmitting(true);

    const targetProjectId = activeProject?.id || "p-1";

    const newAdvance: ProjectConstructionAdvance = {
      id: `adv-${Date.now()}`,
      title: title.trim(),
      date: String(date || new Date().toISOString().split("T")[0]),
      pct: overallPct,
      image: photos[0]?.url || "https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?auto=format&fit=crop&w=600&q=80",
      description: description.trim() || `Avance de obra registrado al ${overallPct}%.`,
      cimentacionPct,
      estructuraPct,
      instalacionesPct,
      acabadosPct,
      photos,
      uploadedDocument,
      targetScope,
      targetUnits: targetScope === "UNITS" ? selectedUnitNumbers : undefined,
      emailSent: sendEmailToClients,
      createdAt: new Date().toISOString(),
    };

    // Persist in Project Context
    registerConstructionProgress(targetProjectId, newAdvance);

    if (onProgressSaved) {
      onProgressSaved(newAdvance);
    }

    setIsSubmitting(false);
    setIsSuccessModalOpen(true);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(10, 25, 47, 0.72)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
      }}
    >
      <div
        style={{
          backgroundColor: "var(--devio-white)",
          borderRadius: "1.25rem",
          width: "100%",
          maxWidth: "850px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 70px rgba(0, 0, 0, 0.28)",
          border: "1px solid var(--devio-neutral-1)",
          overflow: "hidden",
          animation: "fadeIn 0.2s ease-out",
        }}
      >
        {/* ================================================================== */}
        {/* HEADER & STEPPER */}
        {/* ================================================================== */}
        <div
          style={{
            padding: "1.25rem 1.75rem 1rem 1.75rem",
            borderBottom: "1px solid var(--devio-neutral-1)",
            backgroundColor: "#FAFBFD",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(111, 172, 156, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--devio-green)",
                }}
              >
                <HardHat size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--devio-blue-dark)", margin: 0, letterSpacing: "-0.02em" }}>
                  Registrar Avance de Obra
                </h2>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "2px" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--devio-neutral-3)" }}>
                    {targetProjectName}
                  </span>
                  <span style={{ fontSize: "0.78rem", color: "var(--devio-neutral-2)" }}>•</span>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue)" }}>
                    Paso {currentStep} de 4: {stepsList[currentStep - 1]?.label || ""}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "0.4rem",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--devio-neutral-3)",
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Stepper Pills */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.5rem",
              overflowX: "auto",
              paddingBottom: "0.25rem",
            }}
          >
            {stepsList.map((step) => {
              const isDone = currentStep > step.num;
              const isCurrent = currentStep === step.num;
              return (
                <div
                  key={step.num}
                  onClick={() => {
                    if (step.num < currentStep) setCurrentStep(step.num);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    cursor: step.num < currentStep ? "pointer" : "default",
                    opacity: isCurrent ? 1 : isDone ? 0.9 : 0.45,
                    transition: "all 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      backgroundColor: isDone
                        ? "var(--devio-green)"
                        : isCurrent
                        ? "var(--devio-blue-dark)"
                        : "transparent",
                      color: isDone || isCurrent ? "#FFFFFF" : "var(--devio-neutral-3)",
                      border: isDone || isCurrent ? "none" : "1.5px solid var(--devio-neutral-2)",
                    }}
                  >
                    {isDone ? <Check size={13} strokeWidth={3} /> : step.num}
                  </div>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: isCurrent ? 700 : 500,
                      color: isCurrent ? "var(--devio-blue-dark)" : isDone ? "var(--devio-blue)" : "var(--devio-neutral-3)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {step.label}
                  </span>
                  {step.num < 4 && (
                    <div
                      style={{
                        width: "24px",
                        height: "1px",
                        backgroundColor: isDone ? "var(--devio-green)" : "var(--devio-neutral-1)",
                        marginLeft: "0.25rem",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Collapsible Past Advances Bar */}
        <div style={{ backgroundColor: "#F1F5F9", borderBottom: "1px solid var(--devio-neutral-1)" }}>
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            style={{
              width: "100%",
              padding: "0.6rem 1.75rem",
              background: "none",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              fontSize: "0.82rem",
              fontWeight: 700,
              color: "var(--devio-blue-dark)",
              cursor: "pointer",
            }}
          >
            <span>Bitácora de avances anteriores ({historyAdvances.length})</span>
            {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showHistory && (
            <div style={{ padding: "0.75rem 1.75rem", maxHeight: "160px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem", borderTop: "1px dashed var(--devio-neutral-2)" }}>
              {historyAdvances.length === 0 ? (
                <div style={{ textAlign: "center", padding: "0.75rem", fontSize: "0.78rem", color: "var(--devio-neutral-3)" }}>
                  Aún no hay avances registrados en la bitácora de este desarrollo.
                </div>
              ) : (
                historyAdvances.map((adv) => (
                  <div
                    key={adv.id}
                    style={{
                      backgroundColor: "var(--devio-white)",
                      borderRadius: "0.6rem",
                      padding: "0.55rem 0.85rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "0.82rem",
                      border: "1px solid var(--devio-neutral-1)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                      {adv.image && (
                        <img
                          src={adv.image}
                          alt={adv.title}
                          style={{ width: "38px", height: "38px", borderRadius: "6px", objectFit: "cover" }}
                        />
                      )}
                      <div>
                        <strong style={{ color: "var(--devio-blue-dark)", display: "block" }}>{adv.title}</strong>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "2px" }}>
                          <span style={{ fontSize: "0.72rem", color: "var(--devio-neutral-3)" }}>{adv.date}</span>
                          <span style={{ fontSize: "0.72rem", color: "var(--devio-neutral-2)" }}>•</span>
                          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--devio-green)" }}>{adv.pct}% Obra</span>
                          <span style={{ fontSize: "0.72rem", color: "var(--devio-neutral-2)" }}>•</span>
                          <span
                            style={{
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              padding: "0.1rem 0.4rem",
                              borderRadius: "0.3rem",
                              backgroundColor: adv.targetScope === "UNITS" ? "rgba(99, 102, 241, 0.12)" : "rgba(31, 54, 82, 0.08)",
                              color: adv.targetScope === "UNITS" ? "#4F46E5" : "var(--devio-blue)",
                            }}
                          >
                            {adv.targetScope === "UNITS" ? `${adv.targetUnits?.length || 0} unidades` : "Todo el Proyecto"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ================================================================== */}
        {/* MODAL BODY */}
        {/* ================================================================== */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1.5rem 2rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          {/* STEP 1: BITÁCORA Y ALCANCE */}
          {currentStep === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ textAlign: "center", maxWidth: "620px", margin: "0 auto" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--devio-blue-dark)", marginBottom: "0.3rem" }}>
                  Información y Alcance del Avance
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--devio-neutral-3)" }}>
                  Define si este hito constructivo aplica a todo el desarrollo o a unidades/niveles específicos.
                </p>
              </div>

              {/* Scope Selector (Global vs By Units) */}
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.5rem" }}>
                  Alcance del Registro de Obra *
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div
                    onClick={() => setTargetScope("PROJECT")}
                    style={{
                      border: targetScope === "PROJECT" ? "2px solid var(--devio-blue)" : "1px solid var(--devio-neutral-1)",
                      backgroundColor: targetScope === "PROJECT" ? "rgba(31, 54, 82, 0.04)" : "var(--devio-white)",
                      borderRadius: "0.75rem",
                      padding: "0.85rem 1rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        backgroundColor: targetScope === "PROJECT" ? "var(--devio-blue)" : "#F1F5F9",
                        color: targetScope === "PROJECT" ? "#FFFFFF" : "var(--devio-neutral-3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Building size={18} />
                    </div>
                    <div>
                      <strong style={{ fontSize: "0.88rem", color: "var(--devio-blue-dark)", display: "block" }}>
                        Todo el Proyecto
                      </strong>
                      <span style={{ fontSize: "0.74rem", color: "var(--devio-neutral-3)" }}>
                        Actualiza el avance general de todo el desarrollo ({unitsInventory.length} unidades).
                      </span>
                    </div>
                  </div>

                  <div
                    onClick={() => setTargetScope("UNITS")}
                    style={{
                      border: targetScope === "UNITS" ? "2px solid var(--devio-blue)" : "1px solid var(--devio-neutral-1)",
                      backgroundColor: targetScope === "UNITS" ? "rgba(31, 54, 82, 0.04)" : "var(--devio-white)",
                      borderRadius: "0.75rem",
                      padding: "0.85rem 1rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        backgroundColor: targetScope === "UNITS" ? "var(--devio-blue)" : "#F1F5F9",
                        color: targetScope === "UNITS" ? "#FFFFFF" : "var(--devio-neutral-3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Layers size={18} />
                    </div>
                    <div>
                      <strong style={{ fontSize: "0.88rem", color: "var(--devio-blue-dark)", display: "block" }}>
                        Por Unidad o Selección Manual
                      </strong>
                      <span style={{ fontSize: "0.74rem", color: "var(--devio-neutral-3)" }}>
                        Aplica a unidades, niveles o prototipos específicos seleccionados.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Units Selection Box (if targetScope === "UNITS") */}
              {targetScope === "UNITS" && (
                <div
                  style={{
                    backgroundColor: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "0.85rem",
                    padding: "1rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <strong style={{ fontSize: "0.85rem", color: "var(--devio-blue-dark)" }}>
                        Seleccionar Unidades Afectadas ({selectedUnitNumbers.length} de {unitsInventory.length})
                      </strong>
                    </div>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <button
                        type="button"
                        onClick={handleSelectAllUnits}
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          color: "var(--devio-blue)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        Seleccionar Todas
                      </button>
                      <span style={{ color: "#CBD5E1" }}>•</span>
                      <button
                        type="button"
                        onClick={handleDeselectAllUnits}
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          color: "var(--devio-neutral-3)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        Deseleccionar
                      </button>
                    </div>
                  </div>

                  {/* Search Input for Units */}
                  <div style={{ position: "relative" }}>
                    <Search size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--devio-neutral-3)" }} />
                    <input
                      type="text"
                      value={unitSearchQuery}
                      onChange={(e) => setUnitSearchQuery(e.target.value)}
                      placeholder="Buscar por número de unidad, cliente o tipo..."
                      style={{
                        width: "100%",
                        padding: "0.45rem 0.75rem 0.45rem 2.2rem",
                        borderRadius: "0.5rem",
                        border: "1px solid #CBD5E1",
                        fontSize: "0.8rem",
                      }}
                    />
                  </div>

                  {/* Units Chips Grid */}
                  <div
                    style={{
                      maxHeight: "140px",
                      overflowY: "auto",
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(105px, 1fr))",
                      gap: "0.4rem",
                      backgroundColor: "#FFFFFF",
                      borderRadius: "0.5rem",
                      border: "1px solid #E2E8F0",
                      padding: "0.5rem",
                    }}
                  >
                    {filteredUnits.length === 0 ? (
                      <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "0.5rem", fontSize: "0.75rem", color: "#94A3B8" }}>
                        No se encontraron unidades con ese filtro.
                      </div>
                    ) : (
                      filteredUnits.map((u) => {
                        const isSelected = selectedUnitNumbers.includes(u.unit);
                        return (
                          <div
                            key={u.unit}
                            onClick={() => handleToggleUnit(u.unit)}
                            style={{
                              padding: "0.35rem 0.5rem",
                              borderRadius: "0.4rem",
                              cursor: "pointer",
                              border: isSelected ? "1.5px solid var(--devio-blue)" : "1px solid #E2E8F0",
                              backgroundColor: isSelected ? "rgba(31, 54, 82, 0.08)" : "#FFFFFF",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              color: isSelected ? "var(--devio-blue)" : "var(--devio-blue-dark)",
                            }}
                          >
                            <span>Unidad {u.unit}</span>
                            {isSelected && <Check size={12} color="var(--devio-blue)" strokeWidth={3} />}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Title, Date & Description */}
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.35rem" }}>
                  Título del Hito o Avance *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Colado de losa Nivel 8 y colocación de cancelería"
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    borderRadius: "0.6rem",
                    border: "1.5px solid var(--devio-neutral-2)",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: "var(--devio-blue-dark)",
                  }}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.75rem" }}>
                <DevioDatePicker
                  label="Fecha de Corte del Avance"
                  value={date}
                  onChange={setDate}
                  placeholder="Seleccionar fecha"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.35rem" }}>
                  Descripción Detallada / Bitácora de Obra
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe los trabajos realizados, áreas concluidas, inspecciones aprobadas y siguientes pasos..."
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    borderRadius: "0.6rem",
                    border: "1.5px solid var(--devio-neutral-2)",
                    fontSize: "0.88rem",
                    color: "var(--devio-blue-dark)",
                    resize: "vertical",
                  }}
                />
              </div>
            </div>
          )}

          {/* STEP 2: PORCENTAJES DE OBRA */}
          {currentStep === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ textAlign: "center", maxWidth: "620px", margin: "0 auto" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--devio-blue-dark)", marginBottom: "0.3rem" }}>
                  Porcentajes de Construcción
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--devio-neutral-3)" }}>
                  {targetScope === "UNITS"
                    ? `Configura el porcentaje que se asignará a las ${selectedUnitNumbers.length} unidades seleccionadas.`
                    : "Ajusta el porcentaje general de avance y el desglose de cada fase constructiva del desarrollo."}
                </p>
              </div>

              {/* Porcentaje General Card */}
              <div
                style={{
                  backgroundColor: "#F8FAFC",
                  borderRadius: "1rem",
                  border: "1px solid var(--devio-neutral-1)",
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <label style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--devio-blue-dark)", margin: 0, display: "block" }}>
                      {targetScope === "UNITS" ? "Porcentaje para Unidades Seleccionadas:" : "Porcentaje de Obra General:"}
                    </label>
                    <span style={{ fontSize: "0.74rem", color: "var(--devio-neutral-3)" }}>
                      {targetScope === "UNITS"
                        ? `Aplica a: ${selectedUnitNumbers.slice(0, 10).join(", ")}${selectedUnitNumbers.length > 10 ? ` (+${selectedUnitNumbers.length - 10} más)` : ""}`
                        : `Aplica a todas las ${unitsInventory.length} unidades del proyecto.`}
                    </span>
                  </div>
                  <span style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--devio-blue)" }}>
                    {overallPct}%
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={overallPct}
                  onChange={(e) => setOverallPct(Number(e.target.value))}
                  style={{
                    width: "100%",
                    accentColor: "var(--devio-blue-dark)",
                    cursor: "pointer",
                    height: "8px",
                  }}
                />
              </div>

              {/* Sub-etapas Constructivas */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                {/* 1. Cimentación */}
                <div style={{ backgroundColor: "var(--devio-white)", border: "1px solid var(--devio-neutral-1)", borderRadius: "0.75rem", padding: "0.85rem 1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--devio-blue-dark)" }}>1. Cimentación</span>
                    <strong style={{ fontSize: "0.88rem", color: "var(--devio-green)" }}>{cimentacionPct}%</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={cimentacionPct}
                    onChange={(e) => setCimentacionPct(Number(e.target.value))}
                    style={{ width: "100%", accentColor: "var(--devio-green)", cursor: "pointer" }}
                  />
                </div>

                {/* 2. Estructura */}
                <div style={{ backgroundColor: "var(--devio-white)", border: "1px solid var(--devio-neutral-1)", borderRadius: "0.75rem", padding: "0.85rem 1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--devio-blue-dark)" }}>2. Estructura</span>
                    <strong style={{ fontSize: "0.88rem", color: "var(--devio-blue)" }}>{estructuraPct}%</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={estructuraPct}
                    onChange={(e) => setEstructuraPct(Number(e.target.value))}
                    style={{ width: "100%", accentColor: "var(--devio-blue)", cursor: "pointer" }}
                  />
                </div>

                {/* 3. Instalaciones */}
                <div style={{ backgroundColor: "var(--devio-white)", border: "1px solid var(--devio-neutral-1)", borderRadius: "0.75rem", padding: "0.85rem 1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--devio-blue-dark)" }}>3. Instalaciones</span>
                    <strong style={{ fontSize: "0.88rem", color: "var(--devio-blue-matte)" }}>{instalacionesPct}%</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={instalacionesPct}
                    onChange={(e) => setInstalacionesPct(Number(e.target.value))}
                    style={{ width: "100%", accentColor: "var(--devio-blue)", cursor: "pointer" }}
                  />
                </div>

                {/* 4. Acabados */}
                <div style={{ backgroundColor: "var(--devio-white)", border: "1px solid var(--devio-neutral-1)", borderRadius: "0.75rem", padding: "0.85rem 1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--devio-blue-dark)" }}>4. Acabados</span>
                    <strong style={{ fontSize: "0.88rem", color: "var(--devio-beige-scale1)" }}>{acabadosPct}%</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={acabadosPct}
                    onChange={(e) => setAcabadosPct(Number(e.target.value))}
                    style={{ width: "100%", accentColor: "var(--devio-blue)", cursor: "pointer" }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: FOTOS Y DOCUMENTOS */}
          {currentStep === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ textAlign: "center", maxWidth: "620px", margin: "0 auto" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--devio-blue-dark)", marginBottom: "0.3rem" }}>
                  Fotografías y Evidencia de Obra
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--devio-neutral-3)" }}>
                  Adjunta fotografías de alta resolución del avance y reportes de supervisión en PDF.
                </p>
              </div>

              {/* Hidden file inputs */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                multiple
                onChange={handlePhotoFilesSelected}
                style={{ display: "none" }}
              />
              <input
                type="file"
                ref={docInputRef}
                accept=".pdf,.docx,.xlsx"
                onChange={handleDocFileSelected}
                style={{ display: "none" }}
              />

              {/* Photos Gallery & Upload Box */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                  <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--devio-blue-dark)" }}>
                    Galería Fotográfica ({photos.length} fotos)
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ fontSize: "0.75rem", color: "var(--devio-blue)", fontWeight: 700, background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                  >
                    <Upload size={13} /> Subir fotos
                  </button>
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: "2px dashed var(--devio-neutral-2)",
                    borderRadius: "0.85rem",
                    padding: "1.25rem",
                    textAlign: "center",
                    backgroundColor: "#F8FAFC",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.35rem",
                    marginBottom: "0.85rem",
                  }}
                >
                  <Upload size={22} style={{ color: "var(--devio-blue)" }} />
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--devio-blue-dark)" }}>
                    Click para subir fotografías de obra
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "var(--devio-neutral-3)" }}>
                    Formatos: JPG, PNG, WEBP (Hasta 15 MB por archivo)
                  </span>
                </div>

                {/* Photos Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.6rem" }}>
                  {photos.map((p, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: "relative",
                        borderRadius: "0.6rem",
                        overflow: "hidden",
                        border: "1px solid var(--devio-neutral-1)",
                        height: "90px",
                        backgroundColor: "#0F172A",
                      }}
                    >
                      <img
                        src={p.url}
                        alt={p.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPhotos(photos.filter((_, i) => i !== idx));
                        }}
                        style={{
                          position: "absolute",
                          top: "4px",
                          right: "4px",
                          backgroundColor: "rgba(239, 68, 68, 0.9)",
                          color: "#FFF",
                          border: "none",
                          borderRadius: "50%",
                          width: "20px",
                          height: "20px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* PDF Document Upload */}
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.4rem" }}>
                  Reporte Técnico / Dictamen Estructural (PDF Opcional)
                </label>
                <div
                  onClick={() => docInputRef.current?.click()}
                  style={{
                    border: "1.5px dashed var(--devio-neutral-2)",
                    borderRadius: "0.6rem",
                    padding: "0.85rem",
                    textAlign: "center",
                    backgroundColor: uploadedDocument ? "rgba(111, 172, 156, 0.08)" : "#F8FAFC",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    fontSize: "0.85rem",
                    color: uploadedDocument ? "var(--devio-green)" : "var(--devio-neutral-3)",
                  }}
                >
                  {uploadedDocument ? (
                    <>
                      <FileText size={18} />
                      <strong>{uploadedDocument.name} ({uploadedDocument.size})</strong>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedDocument(null);
                        }}
                        style={{ background: "none", border: "none", color: "var(--devio-red)", cursor: "pointer", marginLeft: "0.5rem" }}
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      <span>Click para subir reporte de obra o bitácora en PDF</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: DIFUSIÓN Y ENVÍO */}
          {currentStep === 4 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ textAlign: "center", maxWidth: "620px", margin: "0 auto" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--devio-blue-dark)", marginBottom: "0.3rem" }}>
                  Revisión y Publicación
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--devio-neutral-3)" }}>
                  Verifica el resumen del avance antes de publicarlo en el expediente del desarrollo.
                </p>
              </div>

              {/* Newsletter Preview Card */}
              <div
                style={{
                  backgroundColor: "#F8FAFC",
                  borderRadius: "1rem",
                  border: "1px solid var(--devio-neutral-1)",
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--devio-neutral-3)", display: "block" }}>
                      {targetProjectName} • {date}
                    </span>
                    <h4 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--devio-blue-dark)", margin: "2px 0 0 0" }}>
                      {title || "Avance de Obra"}
                    </h4>
                  </div>
                  <div
                    style={{
                      padding: "0.35rem 0.85rem",
                      borderRadius: "9999px",
                      backgroundColor: "var(--devio-blue-dark)",
                      color: "#FFF",
                      fontSize: "0.9rem",
                      fontWeight: 800,
                    }}
                  >
                    {overallPct}% Obra
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", fontSize: "0.75rem", color: "var(--devio-neutral-4)" }}>
                  <span style={{ fontWeight: 700 }}>Alcance:</span>
                  <span
                    style={{
                      padding: "0.1rem 0.5rem",
                      borderRadius: "0.3rem",
                      backgroundColor: targetScope === "UNITS" ? "rgba(99, 102, 241, 0.12)" : "rgba(31, 54, 82, 0.08)",
                      color: targetScope === "UNITS" ? "#4F46E5" : "var(--devio-blue)",
                      fontWeight: 700,
                    }}
                  >
                    {targetScope === "UNITS" ? `${selectedUnitNumbers.length} unidades seleccionadas` : "Todo el Desarrollo (Global)"}
                  </span>
                </div>

                <p style={{ fontSize: "0.85rem", color: "var(--devio-neutral-4)", lineHeight: 1.5, margin: 0 }}>
                  {description || "Sin descripción adicional."}
                </p>

                {/* Photos preview */}
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                  {photos.slice(0, 4).map((p, i) => (
                    <img
                      key={i}
                      src={p.url}
                      alt="preview"
                      style={{ width: "70px", height: "50px", borderRadius: "6px", objectFit: "cover" }}
                    />
                  ))}
                  {photos.length > 4 && (
                    <div style={{ width: "70px", height: "50px", borderRadius: "6px", backgroundColor: "rgba(31, 54, 82, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, color: "var(--devio-blue)" }}>
                      +{photos.length - 4} más
                    </div>
                  )}
                </div>
              </div>

              {/* Notification Checkbox */}
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.65rem",
                  padding: "0.85rem 1.1rem",
                  borderRadius: "0.75rem",
                  backgroundColor: "rgba(31, 54, 82, 0.05)",
                  border: "1px solid var(--devio-neutral-1)",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "var(--devio-blue-dark)",
                }}
              >
                <input
                  type="checkbox"
                  checked={sendEmailToClients}
                  onChange={(e) => setSendEmailToClients(e.target.checked)}
                  style={{ width: "18px", height: "18px", accentColor: "var(--devio-blue)" }}
                />
                <span>
                  {targetScope === "UNITS"
                    ? `Enviar boletín fotográfico a los compradores de las ${selectedUnitNumbers.length} unidades seleccionadas.`
                    : "Enviar correo del avance y boletín fotográfico a todos los clientes e inversionistas."}
                </span>
              </label>
            </div>
          )}
        </div>

        {/* ================================================================== */}
        {/* MODAL FOOTER */}
        {/* ================================================================== */}
        <div
          style={{
            padding: "1rem 2rem",
            borderTop: "1px solid var(--devio-neutral-1)",
            backgroundColor: "#FAFBFD",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.65rem 1.4rem",
                borderRadius: "9999px",
                backgroundColor: "var(--devio-blue-dark)",
                color: "var(--devio-white)",
                fontSize: "0.875rem",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
              }}
            >
              <ChevronLeft size={16} /> Anterior
            </button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={() => {
                if (currentStep === 1) {
                  if (!title.trim()) {
                    alert("Por favor ingresa un título para el avance.");
                    return;
                  }
                  if (targetScope === "UNITS" && selectedUnitNumbers.length === 0) {
                    alert("Por favor selecciona al menos una unidad para aplicar el avance.");
                    return;
                  }
                }
                setCurrentStep((prev) => Math.min(4, prev + 1));
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.65rem 1.5rem",
                borderRadius: "9999px",
                backgroundColor: "var(--devio-blue-dark)",
                color: "var(--devio-white)",
                fontSize: "0.875rem",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
              }}
            >
              Siguiente <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSaveProgress}
              disabled={isSubmitting}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.65rem 1.75rem",
                borderRadius: "9999px",
                backgroundColor: "var(--devio-blue-dark)",
                color: "var(--devio-white)",
                fontSize: "0.875rem",
                fontWeight: 800,
                border: "none",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                boxShadow: "0 4px 14px rgba(22, 43, 63, 0.4)",
              }}
            >
              {isSubmitting ? "Guardando Avance..." : "Publicar y Guardar Avance"}
            </button>
          )}
        </div>
      </div>

      {/* SUCCESS CONFIRMATION MODAL */}
      {isSuccessModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(10, 25, 47, 0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "1rem",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--devio-white)",
              borderRadius: "1.25rem",
              width: "100%",
              maxWidth: "480px",
              padding: "2rem",
              textAlign: "center",
              boxShadow: "0 25px 70px rgba(0,0,0,0.3)",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                backgroundColor: "rgba(111, 172, 156, 0.15)",
                color: "var(--devio-green)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem auto",
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h3 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--devio-blue-dark)", marginBottom: "0.3rem" }}>
              ¡Avance Publicado con Éxito!
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--devio-neutral-3)", marginBottom: "1.25rem" }}>
              El avance de obra se ha registrado al <strong>{overallPct}%</strong>{" "}
              {targetScope === "UNITS"
                ? `para las ${selectedUnitNumbers.length} unidades seleccionadas.`
                : "para todo el desarrollo."}
            </p>

            <button
              type="button"
              onClick={() => {
                setIsSuccessModalOpen(false);
                onClose();
              }}
              style={{
                padding: "0.65rem 1.75rem",
                borderRadius: "9999px",
                backgroundColor: "var(--devio-blue-dark)",
                color: "var(--devio-white)",
                fontSize: "0.875rem",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
              }}
            >
              Aceptar y Volver
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
