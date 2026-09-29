"use client";

import React, { useState, useRef, useEffect } from "react";
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
  Download,
  Eye,
  Trash2,
  ExternalLink,
  AlertTriangle,
  AlertCircle,
  Info,
} from "lucide-react";
import { DevioDatePicker } from "../ui/devio-date-picker";
import { ProjectItem, ProjectConstructionAdvance } from "../../data/projects-data";
import { useProject } from "../../context/project-context";
import { sendAndLogNotification } from "../../lib/notifications";
import {
  generateConstructionProgressPDF,
  openConstructionProgressInNewTab,
  ConstructionProgressPDFData,
  resolveProjectLogo,
} from "../../lib/pdf-generator";

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
  const { registerConstructionProgress, deleteConstructionProgress, getProject, developerName, developerLogo } = useProject();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Resolve active project from context if needed
  const activeProject = project?.id ? getProject(project.id) || project : project;
  const targetProjectName = activeProject?.name || projectName;
  const initialProgress = activeProject?.progressPct !== undefined ? activeProject.progressPct : currentProgressPct;
  const unitsInventory = activeProject?.unitsInventory || [];
  const historyAdvances = activeProject?.constructionHistory || [];

  // Compute baseline percentages from the latest advance
  const latestAdv = historyAdvances.length > 0 ? historyAdvances[0] : null;
  const baselineOverallPct = latestAdv?.pct !== undefined ? latestAdv.pct : (initialProgress || 0);
  const baselineCimentacionPct = latestAdv?.cimentacionPct !== undefined ? latestAdv.cimentacionPct : (baselineOverallPct >= 30 ? 100 : baselineOverallPct);
  const baselineEstructuraPct = latestAdv?.estructuraPct !== undefined ? latestAdv.estructuraPct : baselineOverallPct;
  const baselineInstalacionesPct = latestAdv?.instalacionesPct !== undefined ? latestAdv.instalacionesPct : Math.max(0, baselineOverallPct - 20);
  const baselineAcabadosPct = latestAdv?.acabadosPct !== undefined ? latestAdv.acabadosPct : Math.max(0, baselineOverallPct - 40);

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);
  const [savedPDFData, setSavedPDFData] = useState<ConstructionProgressPDFData | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);

  // Advance Detail Modal state (for clicking on past advances)
  const [selectedAdvanceForDetail, setSelectedAdvanceForDetail] = useState<ProjectConstructionAdvance | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Form states - Step 1: Bitácora & Alcance
  const [targetScope, setTargetScope] = useState<"PROJECT" | "UNITS">("PROJECT");
  const [selectedUnitNumbers, setSelectedUnitNumbers] = useState<string[]>([]);
  const [unitSearchQuery, setUnitSearchQuery] = useState<string>("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");

  // Form states - Step 2: Porcentajes de Obra
  const [overallPct, setOverallPct] = useState<number>(baselineOverallPct);
  const [cimentacionPct, setCimentacionPct] = useState<number>(baselineCimentacionPct);
  const [estructuraPct, setEstructuraPct] = useState<number>(baselineEstructuraPct);
  const [instalacionesPct, setInstalacionesPct] = useState<number>(baselineInstalacionesPct);
  const [acabadosPct, setAcabadosPct] = useState<number>(baselineAcabadosPct);

  // Form states - Step 3: Fotos y Documentos
  const [photos, setPhotos] = useState<Array<{ name: string; url: string; size: string }>>([]);
  const [uploadedDocument, setUploadedDocument] = useState<{ name: string; size: string; url?: string } | null>(null);

  // Form states - Step 4: Difusión y Envío
  const [sendEmailToClients, setSendEmailToClients] = useState<boolean>(true);

  // Synchronize initial values to latest baseline when modal opens
  useEffect(() => {
    if (isOpen) {
      setOverallPct(baselineOverallPct);
      setCimentacionPct(baselineCimentacionPct);
      setEstructuraPct(baselineEstructuraPct);
      setInstalacionesPct(baselineInstalacionesPct);
      setAcabadosPct(baselineAcabadosPct);
      setValidationError(null);
      setCurrentStep(1);
    }
  }, [isOpen, baselineOverallPct, baselineCimentacionPct, baselineEstructuraPct, baselineInstalacionesPct, baselineAcabadosPct]);

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
          const dataUrl = ev.target.result as string;
          setPhotos((prev) => [
            ...prev,
            {
              name: file.name,
              url: dataUrl,
              size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            },
          ]);

          // Asynchronously upload to Supabase storage via /api/upload
          const formData = new FormData();
          formData.append("file", file);
          formData.append("folder", "progress");
          formData.append("bucket", "devio-assets");

          fetch("/api/upload", {
            method: "POST",
            body: formData,
          })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
              if (data?.publicUrl) {
                setPhotos((currentPhotos) =>
                  currentPhotos.map((p) =>
                    p.name === file.name && p.url.startsWith("data:") ? { ...p, url: data.publicUrl } : p
                  )
                );
              }
            })
            .catch((err) => console.warn("Could not upload progress photo to CDN:", err));
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

  // Helper to construct PDF Payload from any advance object
  const buildPDFPayloadFromAdvance = (adv: ProjectConstructionAdvance): ConstructionProgressPDFData => {
    const devLogo =
      (typeof window !== "undefined" && (localStorage.getItem("devio_developer_logo") || sessionStorage.getItem("devio_developer_logo"))) ||
      developerLogo ||
      "";
    const projLogo = resolveProjectLogo(activeProject, devLogo);
    const projCover = (activeProject?.image && activeProject.image.startsWith("http")) ? activeProject.image : "";

    return {
      folio: `AV-${(adv.date || "2026-01-01").replace(/-/g, "")}-${adv.id.slice(-4).toUpperCase()}`,
      projectName: targetProjectName,
      projectType: activeProject?.type || "Vertical",
      developerName: developerName || "Desarrolladora Inmobiliaria",
      developerLogoUrl: devLogo,
      projectLogoUrl: projLogo,
      projectCoverUrl: projCover || adv.photos?.[0]?.url || adv.image || "",
      advanceTitle: adv.title,
      advanceDate: adv.date,
      description: adv.description || `Avance de obra registrado al ${adv.pct}%.`,
      overallPercentage: adv.pct,
      cimentacionPct: adv.cimentacionPct ?? (adv.pct >= 30 ? 100 : adv.pct),
      estructuraPct: adv.estructuraPct ?? adv.pct,
      instalacionesPct: adv.instalacionesPct ?? Math.max(0, adv.pct - 20),
      acabadosPct: adv.acabadosPct ?? Math.max(0, adv.pct - 40),
      targetScope: adv.targetScope || "PROJECT",
      targetUnits: adv.targetUnits,
      photos: adv.photos?.map((p) => ({ name: p.name, url: p.url })) || (adv.image ? [{ name: "Foto 1", url: adv.image }] : []),
      estimatedDeliveryDate: activeProject?.estimatedDeliveryDate,
      totalUnits: activeProject?.totalUnits || unitsInventory.length,
    };
  };

  const handleNextStep = () => {
    setValidationError(null);
    if (currentStep === 1) {
      if (!title.trim()) {
        setValidationError("Por favor ingresa un título descriptivo para el avance de obra.");
        return;
      }
      if (targetScope === "UNITS" && selectedUnitNumbers.length === 0) {
        setValidationError("Has seleccionado alcance por unidad. Por favor selecciona al menos una unidad.");
        return;
      }
    }
    if (currentStep === 2) {
      if (overallPct < baselineOverallPct) {
        setValidationError(`El nuevo avance general (${overallPct}%) no puede ser menor al avance anterior registrado (${baselineOverallPct}%). Si necesitas corregir o reducir el avance, elimina primero el avance anterior desde la bitácora.`);
        return;
      }
    }
    setCurrentStep((prev) => Math.min(stepsList.length, prev + 1));
  };

  const handleSaveProgress = () => {
    setValidationError(null);
    if (!title.trim()) {
      setValidationError("Por favor ingresa un título descriptivo para el avance de obra.");
      return;
    }

    if (targetScope === "UNITS" && selectedUnitNumbers.length === 0) {
      setValidationError("Has seleccionado alcance por unidad. Por favor selecciona al menos una unidad.");
      return;
    }

    if (overallPct < baselineOverallPct) {
      setValidationError(`El nuevo avance general (${overallPct}%) no puede ser menor al avance previo (${baselineOverallPct}%). Si necesitas corregir o reducir el avance, elimina primero el avance anterior desde la bitácora.`);
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

    const devLogo =
      (typeof window !== "undefined" && (localStorage.getItem("devio_developer_logo") || sessionStorage.getItem("devio_developer_logo"))) ||
      developerLogo ||
      "";
    const projLogo = resolveProjectLogo(activeProject, devLogo);
    const projCover = (activeProject?.image && activeProject.image.startsWith("http")) ? activeProject.image : "";

    // Prepare PDF Data
    const pdfData: ConstructionProgressPDFData = {
      folio: `AV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      projectName: targetProjectName,
      projectType: activeProject?.type || "Vertical",
      developerName: developerName || "Desarrolladora Inmobiliaria",
      developerLogoUrl: devLogo,
      projectLogoUrl: projLogo,
      projectCoverUrl: projCover || photos[0]?.url || "",
      advanceTitle: title.trim(),
      advanceDate: String(date || new Date().toISOString().split("T")[0]),
      description: description.trim() || `Avance de obra registrado al ${overallPct}%.`,
      overallPercentage: overallPct,
      cimentacionPct,
      estructuraPct,
      instalacionesPct,
      acabadosPct,
      targetScope,
      targetUnits: targetScope === "UNITS" ? selectedUnitNumbers : undefined,
      photos: photos.map((p) => ({ name: p.name, url: p.url })),
      estimatedDeliveryDate: activeProject?.estimatedDeliveryDate,
      totalUnits: activeProject?.totalUnits || unitsInventory.length,
    };
    setSavedPDFData(pdfData);

    // Persist in Project Context & DB
    registerConstructionProgress(targetProjectId, newAdvance);

    // Send notifications to clients if checked
    if (sendEmailToClients) {
      const recipientsMap = new Map<string, string>(); // email -> name
      const sales = activeProject?.sales || [];
      const units = activeProject?.unitsInventory || [];

      if (targetScope === "UNITS") {
        const targetSet = new Set(selectedUnitNumbers.map((u) => u.toLowerCase().trim()));
        sales.forEach((s) => {
          if (s.unit && targetSet.has(s.unit.toLowerCase().trim())) {
            if (s.clientEmail && s.clientEmail.includes("@")) {
              recipientsMap.set(s.clientEmail.toLowerCase().trim(), s.clientName || "Propietario");
            }
            s.coOwners?.forEach((co) => {
              if (co.email && co.email.includes("@")) {
                recipientsMap.set(co.email.toLowerCase().trim(), co.name || s.clientName || "Co-propietario");
              }
            });
          }
        });
        units.forEach((u) => {
          if (targetSet.has(u.unit.toLowerCase().trim())) {
            u.coOwners?.forEach((co) => {
              if (co.email && co.email.includes("@")) {
                recipientsMap.set(co.email.toLowerCase().trim(), co.name || u.client || "Propietario");
              }
            });
          }
        });
      } else {
        sales.forEach((s) => {
          if (s.clientEmail && s.clientEmail.includes("@")) {
            recipientsMap.set(s.clientEmail.toLowerCase().trim(), s.clientName || "Propietario");
          }
          s.coOwners?.forEach((co) => {
            if (co.email && co.email.includes("@")) {
              recipientsMap.set(co.email.toLowerCase().trim(), co.name || s.clientName || "Co-propietario");
            }
          });
        });
        units.forEach((u) => {
          u.coOwners?.forEach((co) => {
            if (co.email && co.email.includes("@")) {
              recipientsMap.set(co.email.toLowerCase().trim(), co.name || u.client || "Propietario");
            }
          });
        });
      }

      const origin = typeof window !== "undefined" ? window.location.origin : "https://devio.lat";
      const progressLink = `${origin}/portal?tab=avance`;

      // Extract valid photo URLs for email template
      const validPhotos = photos.map((p) => p.url).filter((u) => u && typeof u === "string");
      const photo1 = validPhotos[0] || projCover || "https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?auto=format&fit=crop&w=800&q=80";
      const photo2 = validPhotos[1] || "";
      const photo3 = validPhotos[2] || "";

      recipientsMap.forEach((recipientName, recipientEmail) => {
        sendAndLogNotification({
          to: recipientEmail,
          recipientName,
          developerName: developerName || "Desarrolladora Inmobiliaria",
          triggerKey: "obra.progress_report",
          triggerName: "Avance de Obra",
          templateAlias: "avance-proyecto",
          templateModel: {
            nombre: recipientName,
            correo: recipientEmail,
            proyecto: targetProjectName,
            titulo_avance: title.trim(),
            fecha_avance: date,
            descripcion_avance: description.trim() || `Avance de obra registrado al ${overallPct}%.`,
            porcentaje_general: overallPct,
            pct_cimentacion: cimentacionPct,
            pct_estructura: estructuraPct,
            pct_instalaciones: instalacionesPct,
            pct_acabados: acabadosPct,
            foto_1: photo1,
            foto_2: photo2,
            foto_3: photo3,
            login_link: progressLink,
            link_avance: progressLink,
            url_avance: progressLink,
            portal_link: progressLink,
            link: progressLink,
            logo_proyecto: projLogo,
            logo_desarrolladora: devLogo,
            año: new Date().getFullYear().toString(),
          },
        }).catch((err) => console.warn("Error sending progress email to client:", err));
      });
    }

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
          boxShadow: "0 25px 70px rgba(0,0,0,0.35)",
          overflow: "hidden",
        }}
      >
        {/* ================================================================== */}
        {/* MODAL HEADER */}
        {/* ================================================================== */}
        <div
          style={{
            padding: "1.25rem 2rem",
            borderBottom: "1px solid var(--devio-neutral-1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#FAFBFD",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                backgroundColor: "rgba(31, 54, 82, 0.08)",
                color: "var(--devio-blue-dark)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <HardHat size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--devio-blue-dark)", margin: 0 }}>
                Registrar Avance de Obra
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "2px" }}>
                <span style={{ fontSize: "0.78rem", color: "var(--devio-neutral-3)" }}>
                  {targetProjectName}
                </span>
                <span style={{ fontSize: "0.78rem", color: "var(--devio-neutral-2)" }}>•</span>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue)" }}>
                  Avance Actual: {baselineOverallPct}%
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--devio-neutral-3)",
              cursor: "pointer",
              padding: "0.4rem",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* ================================================================== */}
        {/* STEP PROGRESS BAR */}
        {/* ================================================================== */}
        <div
          style={{
            padding: "0.85rem 2rem",
            borderBottom: "1px solid var(--devio-neutral-1)",
            backgroundColor: "var(--devio-white)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {stepsList.map((st, idx) => {
              const isActive = currentStep === st.num;
              const isDone = currentStep > st.num;
              return (
                <div key={st.num} style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 }}>
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      backgroundColor: isDone
                        ? "var(--devio-green)"
                        : isActive
                        ? "var(--devio-blue-dark)"
                        : "#E2E8F0",
                      color: isDone || isActive ? "#FFFFFF" : "var(--devio-neutral-3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.78rem",
                      fontWeight: 800,
                      transition: "all 0.2s ease",
                    }}
                  >
                    {isDone ? <Check size={14} strokeWidth={3} /> : st.num}
                  </div>
                  <span
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: isActive ? 800 : isDone ? 700 : 500,
                      color: isActive ? "var(--devio-blue-dark)" : isDone ? "var(--devio-green)" : "var(--devio-neutral-3)",
                    }}
                  >
                    {st.label}
                  </span>
                  {idx < stepsList.length - 1 && (
                    <div
                      style={{
                        flex: 1,
                        height: "2px",
                        backgroundColor: isDone ? "var(--devio-green)" : "#E2E8F0",
                        margin: "0 0.5rem",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ================================================================== */}
        {/* HISTORIAL INTERACTIVO DE AVANCES ANTERIORES */}
        {/* ================================================================== */}
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
            <div
              style={{
                padding: "0.75rem 1.75rem",
                maxHeight: "190px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                borderTop: "1px dashed var(--devio-neutral-2)",
              }}
            >
              {historyAdvances.length === 0 ? (
                <div style={{ textAlign: "center", padding: "0.75rem", fontSize: "0.78rem", color: "var(--devio-neutral-3)" }}>
                  Aún no hay avances registrados en la bitácora de este desarrollo.
                </div>
              ) : (
                historyAdvances.map((adv) => (
                  <div
                    key={adv.id}
                    onClick={() => setSelectedAdvanceForDetail(adv)}
                    style={{
                      backgroundColor: "var(--devio-white)",
                      borderRadius: "0.6rem",
                      padding: "0.55rem 0.85rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "0.82rem",
                      border: "1px solid var(--devio-neutral-1)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--devio-blue)";
                      e.currentTarget.style.backgroundColor = "#F8FAFC";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--devio-neutral-1)";
                      e.currentTarget.style.backgroundColor = "var(--devio-white)";
                    }}
                    title="Haz clic para ver la información completa y descargar el reporte PDF"
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
                          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--devio-green)" }}>
                            {adv.pct}% Obra
                          </span>
                          <span style={{ fontSize: "0.72rem", color: "var(--devio-neutral-2)" }}>•</span>
                          <span
                            style={{
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              padding: "0.1rem 0.4rem",
                              borderRadius: "0.3rem",
                              backgroundColor:
                                adv.targetScope === "UNITS" ? "rgba(99, 102, 241, 0.12)" : "rgba(31, 54, 82, 0.08)",
                              color: adv.targetScope === "UNITS" ? "#4F46E5" : "var(--devio-blue)",
                            }}
                          >
                            {adv.targetScope === "UNITS" ? `${adv.targetUnits?.length || 0} unidades` : "Todo el Proyecto"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAdvanceForDetail(adv);
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          padding: "0.3rem 0.65rem",
                          borderRadius: "0.4rem",
                          backgroundColor: "rgba(31, 54, 82, 0.06)",
                          color: "var(--devio-blue-dark)",
                          border: "none",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        <Eye size={13} /> Ver Detalle & PDF
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#FEF2F2",
              borderBottom: "1px solid #F87171",
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              color: "#B91C1C",
              fontSize: "0.82rem",
              fontWeight: 600,
            }}
          >
            <AlertTriangle size={18} />
            <span style={{ flex: 1 }}>{validationError}</span>
            <button
              type="button"
              onClick={() => setValidationError(null)}
              style={{ background: "none", border: "none", color: "#B91C1C", cursor: "pointer" }}
            >
              <X size={16} />
            </button>
          </div>
        )}

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
                    <Building size={22} color={targetScope === "PROJECT" ? "var(--devio-blue)" : "var(--devio-neutral-3)"} />
                    <div>
                      <strong style={{ fontSize: "0.88rem", color: "var(--devio-blue-dark)", display: "block" }}>
                        Todo el Proyecto
                      </strong>
                      <span style={{ fontSize: "0.74rem", color: "var(--devio-neutral-3)" }}>
                        Aplica a todas las {unitsInventory.length} unidades del inventario
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
                    <Layers size={22} color={targetScope === "UNITS" ? "var(--devio-blue)" : "var(--devio-neutral-3)"} />
                    <div>
                      <strong style={{ fontSize: "0.88rem", color: "var(--devio-blue-dark)", display: "block" }}>
                        Unidades Específicas
                      </strong>
                      <span style={{ fontSize: "0.74rem", color: "var(--devio-neutral-3)" }}>
                        {selectedUnitNumbers.length > 0 ? `${selectedUnitNumbers.length} seleccionadas` : "Seleccionar unidades"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Units Selection Box if targetScope === UNITS */}
              {targetScope === "UNITS" && (
                <div
                  style={{
                    backgroundColor: "#F8FAFC",
                    border: "1px solid var(--devio-neutral-1)",
                    borderRadius: "0.85rem",
                    padding: "1rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--devio-blue-dark)" }}>
                      Seleccionar Unidades ({selectedUnitNumbers.length} de {unitsInventory.length})
                    </span>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        type="button"
                        onClick={handleSelectAllUnits}
                        style={{ fontSize: "0.72rem", color: "var(--devio-blue)", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}
                      >
                        Seleccionar Todas
                      </button>
                      <span style={{ color: "var(--devio-neutral-2)" }}>|</span>
                      <button
                        type="button"
                        onClick={handleDeselectAllUnits}
                        style={{ fontSize: "0.72rem", color: "var(--devio-neutral-3)", background: "none", border: "none", cursor: "pointer" }}
                      >
                        Limpiar
                      </button>
                    </div>
                  </div>

                  <div style={{ position: "relative", marginBottom: "0.6rem" }}>
                    <Search size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--devio-neutral-3)" }} />
                    <input
                      type="text"
                      placeholder="Buscar por número de unidad, nivel o cliente..."
                      value={unitSearchQuery}
                      onChange={(e) => setUnitSearchQuery(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.5rem 0.75rem 0.5rem 2.2rem",
                        borderRadius: "0.5rem",
                        border: "1px solid var(--devio-neutral-1)",
                        fontSize: "0.8rem",
                      }}
                    />
                  </div>

                  <div style={{ maxHeight: "160px", overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "0.4rem" }}>
                    {filteredUnits.map((u) => {
                      const isSelected = selectedUnitNumbers.includes(u.unit);
                      return (
                        <div
                          key={u.unit}
                          onClick={() => handleToggleUnit(u.unit)}
                          style={{
                            padding: "0.45rem 0.6rem",
                            borderRadius: "0.4rem",
                            border: isSelected ? "1.5px solid var(--devio-blue)" : "1px solid var(--devio-neutral-1)",
                            backgroundColor: isSelected ? "rgba(31, 54, 82, 0.08)" : "var(--devio-white)",
                            cursor: "pointer",
                            fontSize: "0.75rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <div>
                            <strong style={{ color: "var(--devio-blue-dark)" }}>{u.unit}</strong>
                            <div style={{ fontSize: "0.68rem", color: "var(--devio-neutral-3)" }}>
                              {u.status}
                            </div>
                          </div>
                          {isSelected && <Check size={14} color="var(--devio-blue)" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Title & Date */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.35rem" }}>
                    Título Descriptivo del Avance *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Colado de losa Nivel 8 y canalizaciones hidrosanitarias"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "0.6rem",
                      border: "1px solid var(--devio-neutral-1)",
                      fontSize: "0.85rem",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.35rem" }}>
                    Fecha del Registro *
                  </label>
                  <DevioDatePicker value={date} onChange={setDate} placeholder="Fecha del avance" />
                </div>
              </div>

              {/* Detailed Description */}
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.35rem" }}>
                  Descripción Detallada / Bitácora de Obra
                </label>
                <textarea
                  rows={3}
                  placeholder="Detalla los avances ejecutados en la semana/mes, equipos de supervisión presentes y comentarios para los compradores..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.85rem",
                    borderRadius: "0.6rem",
                    border: "1px solid var(--devio-neutral-1)",
                    fontSize: "0.85rem",
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
                  Porcentajes de Construcción y Partidas
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--devio-neutral-3)" }}>
                  {targetScope === "UNITS"
                    ? `Configura el porcentaje que se asignará a las ${selectedUnitNumbers.length} unidades seleccionadas.`
                    : "Ajusta el porcentaje general de avance y el desglose de cada fase constructiva del desarrollo."}
                </p>
              </div>

              {/* Baseline Info Box */}
              <div
                style={{
                  backgroundColor: "#F0FDF4",
                  border: "1px solid #BBF7D0",
                  borderRadius: "0.75rem",
                  padding: "0.75rem 1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  fontSize: "0.8rem",
                  color: "#166534",
                }}
              >
                <Info size={16} />
                <span>
                  Último avance guardado: <strong>{baselineOverallPct}%</strong>. El nuevo avance no puede ser menor a esta cifra.
                </span>
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
                  <span style={{ fontSize: "1.6rem", fontWeight: 900, color: overallPct < baselineOverallPct ? "#EF4444" : "var(--devio-blue)" }}>
                    {overallPct}%
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={overallPct}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setOverallPct(val);
                    if (val < baselineOverallPct) {
                      setValidationError(`El nuevo avance (${val}%) no puede ser menor al avance previo (${baselineOverallPct}%).`);
                    } else {
                      setValidationError(null);
                    }
                  }}
                  style={{
                    width: "100%",
                    accentColor: overallPct < baselineOverallPct ? "#EF4444" : "var(--devio-blue-dark)",
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
                    gap: "0.6rem",
                  }}
                >
                  <FileText size={18} color="var(--devio-blue)" />
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--devio-blue-dark)" }}>
                    {uploadedDocument ? `${uploadedDocument.name} (${uploadedDocument.size})` : "Subir reporte o dictamen en PDF"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: DIFUSIÓN Y ENVÍO */}
          {currentStep === 4 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ textAlign: "center", maxWidth: "620px", margin: "0 auto" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--devio-blue-dark)", marginBottom: "0.3rem" }}>
                  Revisión y Notificación a Clientes
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--devio-neutral-3)" }}>
                  Verifica el resumen del avance que se registrará en la bitácora y se enviará por correo.
                </p>
              </div>

              {/* Summary Card */}
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
                    <strong style={{ fontSize: "1rem", color: "var(--devio-blue-dark)", display: "block" }}>
                      {title || "Avance de Obra"}
                    </strong>
                    <span style={{ fontSize: "0.78rem", color: "var(--devio-neutral-3)" }}>
                      Fecha: {date} • Alcance: {targetScope === "UNITS" ? `${selectedUnitNumbers.length} Unidades` : "Todo el Proyecto"}
                    </span>
                  </div>
                  <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--devio-green)" }}>
                    {overallPct}% Obra
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <div style={{ backgroundColor: "var(--devio-white)", padding: "0.5rem", borderRadius: "0.5rem", textAlign: "center", border: "1px solid var(--devio-neutral-1)" }}>
                    <div style={{ fontSize: "0.68rem", color: "var(--devio-neutral-3)" }}>Cimentación</div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--devio-green)" }}>{cimentacionPct}%</div>
                  </div>
                  <div style={{ backgroundColor: "var(--devio-white)", padding: "0.5rem", borderRadius: "0.5rem", textAlign: "center", border: "1px solid var(--devio-neutral-1)" }}>
                    <div style={{ fontSize: "0.68rem", color: "var(--devio-neutral-3)" }}>Estructura</div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--devio-blue)" }}>{estructuraPct}%</div>
                  </div>
                  <div style={{ backgroundColor: "var(--devio-white)", padding: "0.5rem", borderRadius: "0.5rem", textAlign: "center", border: "1px solid var(--devio-neutral-1)" }}>
                    <div style={{ fontSize: "0.68rem", color: "var(--devio-neutral-3)" }}>Instalaciones</div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--devio-blue-matte)" }}>{instalacionesPct}%</div>
                  </div>
                  <div style={{ backgroundColor: "var(--devio-white)", padding: "0.5rem", borderRadius: "0.5rem", textAlign: "center", border: "1px solid var(--devio-neutral-1)" }}>
                    <div style={{ fontSize: "0.68rem", color: "var(--devio-neutral-3)" }}>Acabados</div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--devio-beige-scale1)" }}>{acabadosPct}%</div>
                  </div>
                </div>

                {description && (
                  <p style={{ fontSize: "0.82rem", color: "var(--devio-blue-dark)", margin: "0.5rem 0 0 0", fontStyle: "italic" }}>
                    "{description}"
                  </p>
                )}
              </div>

              {/* Notification Checkbox */}
              <div
                onClick={() => setSendEmailToClients(!sendEmailToClients)}
                style={{
                  border: "1px solid var(--devio-neutral-1)",
                  borderRadius: "0.75rem",
                  padding: "0.85rem 1.25rem",
                  backgroundColor: "var(--devio-white)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "4px",
                    border: sendEmailToClients ? "2px solid var(--devio-green)" : "2px solid var(--devio-neutral-2)",
                    backgroundColor: sendEmailToClients ? "var(--devio-green)" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FFF",
                  }}
                >
                  {sendEmailToClients && <Check size={14} strokeWidth={3} />}
                </div>
                <div>
                  <strong style={{ fontSize: "0.85rem", color: "var(--devio-blue-dark)", display: "block" }}>
                    Enviar correo con fotografías y reporte a todos los compradores
                  </strong>
                  <span style={{ fontSize: "0.74rem", color: "var(--devio-neutral-3)" }}>
                    Se enviará la plantilla oficial con el logotipo del desarrollo, desglose de avance y fotos adjuntas.
                  </span>
                </div>
              </div>
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
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => {
                setValidationError(null);
                setCurrentStep((prev) => Math.max(1, prev - 1));
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.6rem 1.25rem",
                borderRadius: "9999px",
                backgroundColor: "transparent",
                color: "var(--devio-blue-dark)",
                border: "1px solid var(--devio-neutral-2)",
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <ChevronLeft size={16} /> Anterior
            </button>
          ) : (
            <div />
          )}

          {currentStep < stepsList.length ? (
            <button
              type="button"
              onClick={handleNextStep}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.65rem 1.5rem",
                borderRadius: "9999px",
                backgroundColor: "var(--devio-blue-dark)",
                color: "var(--devio-white)",
                fontSize: "0.85rem",
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

      {/* ================================================================== */}
      {/* MODAL DETALLE DE AVANCE GUARDADO (HISTORIAL & DESCARGA PDF) */}
      {/* ================================================================== */}
      {selectedAdvanceForDetail && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(10, 25, 47, 0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10001,
            padding: "1rem",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--devio-white)",
              borderRadius: "1.25rem",
              width: "100%",
              maxWidth: "720px",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 70px rgba(0,0,0,0.4)",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "1.25rem 1.75rem",
                borderBottom: "1px solid var(--devio-neutral-1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#F8FAFC",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(31, 54, 82, 0.08)",
                    color: "var(--devio-blue-dark)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <HardHat size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--devio-blue-dark)", margin: 0 }}>
                    {selectedAdvanceForDetail.title}
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "2px" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--devio-neutral-3)" }}>
                      {selectedAdvanceForDetail.date}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--devio-neutral-2)" }}>•</span>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        padding: "0.1rem 0.5rem",
                        borderRadius: "9999px",
                        backgroundColor: "rgba(111, 172, 156, 0.15)",
                        color: "var(--devio-green)",
                      }}
                    >
                      {selectedAdvanceForDetail.pct}% Obra
                    </span>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        padding: "0.1rem 0.5rem",
                        borderRadius: "9999px",
                        backgroundColor:
                          selectedAdvanceForDetail.targetScope === "UNITS" ? "rgba(99, 102, 241, 0.12)" : "rgba(31, 54, 82, 0.08)",
                        color: selectedAdvanceForDetail.targetScope === "UNITS" ? "#4F46E5" : "var(--devio-blue)",
                      }}
                    >
                      {selectedAdvanceForDetail.targetScope === "UNITS"
                        ? `${selectedAdvanceForDetail.targetUnits?.length || 0} unidades`
                        : "Proyecto Completo"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAdvanceForDetail(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--devio-neutral-3)",
                  cursor: "pointer",
                  padding: "0.4rem",
                  borderRadius: "50%",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Body */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "1.5rem 1.75rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              {/* Desglose de Especialidades / Partidas */}
              <div>
                <h4 style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--devio-blue-dark)", marginBottom: "0.6rem" }}>
                  Desglose de Partidas Constructivas
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div style={{ backgroundColor: "#F8FAFC", border: "1px solid var(--devio-neutral-1)", borderRadius: "0.6rem", padding: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                      <span>1. Cimentación</span>
                      <span style={{ color: "var(--devio-green)" }}>
                        {selectedAdvanceForDetail.cimentacionPct ?? (selectedAdvanceForDetail.pct >= 30 ? 100 : selectedAdvanceForDetail.pct)}%
                      </span>
                    </div>
                    <div style={{ width: "100%", height: "6px", backgroundColor: "#E2E8F0", borderRadius: "9999px", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${selectedAdvanceForDetail.cimentacionPct ?? (selectedAdvanceForDetail.pct >= 30 ? 100 : selectedAdvanceForDetail.pct)}%`,
                          height: "100%",
                          backgroundColor: "var(--devio-green)",
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ backgroundColor: "#F8FAFC", border: "1px solid var(--devio-neutral-1)", borderRadius: "0.6rem", padding: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                      <span>2. Estructura</span>
                      <span style={{ color: "var(--devio-blue)" }}>
                        {selectedAdvanceForDetail.estructuraPct ?? selectedAdvanceForDetail.pct}%
                      </span>
                    </div>
                    <div style={{ width: "100%", height: "6px", backgroundColor: "#E2E8F0", borderRadius: "9999px", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${selectedAdvanceForDetail.estructuraPct ?? selectedAdvanceForDetail.pct}%`,
                          height: "100%",
                          backgroundColor: "var(--devio-blue)",
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ backgroundColor: "#F8FAFC", border: "1px solid var(--devio-neutral-1)", borderRadius: "0.6rem", padding: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                      <span>3. Instalaciones</span>
                      <span style={{ color: "var(--devio-blue-matte)" }}>
                        {selectedAdvanceForDetail.instalacionesPct ?? Math.max(0, selectedAdvanceForDetail.pct - 20)}%
                      </span>
                    </div>
                    <div style={{ width: "100%", height: "6px", backgroundColor: "#E2E8F0", borderRadius: "9999px", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${selectedAdvanceForDetail.instalacionesPct ?? Math.max(0, selectedAdvanceForDetail.pct - 20)}%`,
                          height: "100%",
                          backgroundColor: "var(--devio-blue-matte)",
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ backgroundColor: "#F8FAFC", border: "1px solid var(--devio-neutral-1)", borderRadius: "0.6rem", padding: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                      <span>4. Acabados</span>
                      <span style={{ color: "var(--devio-beige-scale1)" }}>
                        {selectedAdvanceForDetail.acabadosPct ?? Math.max(0, selectedAdvanceForDetail.pct - 40)}%
                      </span>
                    </div>
                    <div style={{ width: "100%", height: "6px", backgroundColor: "#E2E8F0", borderRadius: "9999px", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${selectedAdvanceForDetail.acabadosPct ?? Math.max(0, selectedAdvanceForDetail.pct - 40)}%`,
                          height: "100%",
                          backgroundColor: "var(--devio-beige-scale1)",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Unidades asignadas (si targetScope === UNITS) */}
              {selectedAdvanceForDetail.targetScope === "UNITS" && selectedAdvanceForDetail.targetUnits && (
                <div>
                  <h4 style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--devio-blue-dark)", marginBottom: "0.4rem" }}>
                    Unidades Asignadas ({selectedAdvanceForDetail.targetUnits.length})
                  </h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                    {selectedAdvanceForDetail.targetUnits.map((u) => (
                      <span
                        key={u}
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "0.2rem 0.55rem",
                          borderRadius: "0.4rem",
                          backgroundColor: "rgba(99, 102, 241, 0.1)",
                          color: "#4F46E5",
                        }}
                      >
                        Unidad {u}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Descripción de la Bitácora */}
              <div>
                <h4 style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--devio-blue-dark)", marginBottom: "0.4rem" }}>
                  Descripción de los Trabajos Realizados
                </h4>
                <div
                  style={{
                    padding: "0.85rem 1rem",
                    borderRadius: "0.6rem",
                    backgroundColor: "#F8FAFC",
                    border: "1px solid var(--devio-neutral-1)",
                    fontSize: "0.84rem",
                    color: "var(--devio-blue-dark)",
                    lineHeight: 1.5,
                    whiteSpace: "pre-line",
                  }}
                >
                  {selectedAdvanceForDetail.description || "Sin descripción adicional."}
                </div>
              </div>

              {/* Galería de Fotos */}
              {((selectedAdvanceForDetail.photos && selectedAdvanceForDetail.photos.length > 0) || selectedAdvanceForDetail.image) && (
                <div>
                  <h4 style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--devio-blue-dark)", marginBottom: "0.5rem" }}>
                    Fotografías de Evidencia ({selectedAdvanceForDetail.photos?.length || (selectedAdvanceForDetail.image ? 1 : 0)})
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "0.6rem" }}>
                    {(selectedAdvanceForDetail.photos && selectedAdvanceForDetail.photos.length > 0
                      ? selectedAdvanceForDetail.photos
                      : selectedAdvanceForDetail.image
                      ? [{ name: "Foto 1", url: selectedAdvanceForDetail.image }]
                      : []
                    ).map((p, idx) => (
                      <div
                        key={idx}
                        onClick={() => window.open(p.url, "_blank")}
                        style={{
                          position: "relative",
                          borderRadius: "0.6rem",
                          overflow: "hidden",
                          border: "1px solid var(--devio-neutral-1)",
                          cursor: "pointer",
                          height: "90px",
                        }}
                        title="Clic para ver en tamaño completo"
                      >
                        <img src={p.url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documento adjunto si existe */}
              {selectedAdvanceForDetail.uploadedDocument && (
                <div
                  style={{
                    padding: "0.75rem",
                    borderRadius: "0.6rem",
                    backgroundColor: "#F8FAFC",
                    border: "1px solid var(--devio-neutral-1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <FileText size={18} color="var(--devio-blue)" />
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--devio-blue-dark)" }}>
                      {selectedAdvanceForDetail.uploadedDocument.name} ({selectedAdvanceForDetail.uploadedDocument.size})
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div
              style={{
                padding: "1rem 1.75rem",
                borderTop: "1px solid var(--devio-neutral-1)",
                backgroundColor: "#F8FAFC",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.75rem",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  if (
                    confirm(
                      `¿Estás seguro de que deseas eliminar el avance "${selectedAdvanceForDetail.title}"? El porcentaje de avance del proyecto y de las unidades se recalculará automáticamente.`
                    )
                  ) {
                    const targetProjId = activeProject?.id || project?.id || "p-1";
                    deleteConstructionProgress(targetProjId, selectedAdvanceForDetail.id);
                    setSelectedAdvanceForDetail(null);
                  }
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.6rem 1rem",
                  borderRadius: "0.6rem",
                  backgroundColor: "transparent",
                  color: "#EF4444",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <Trash2 size={15} /> Eliminar Avance
              </button>

              <div style={{ display: "flex", gap: "0.6rem" }}>
                <button
                  type="button"
                  onClick={() => {
                    openConstructionProgressInNewTab(buildPDFPayloadFromAdvance(selectedAdvanceForDetail));
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.6rem 1.1rem",
                    borderRadius: "9999px",
                    backgroundColor: "rgba(31, 54, 82, 0.08)",
                    color: "var(--devio-blue-dark)",
                    border: "1px solid rgba(31, 54, 82, 0.15)",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <ExternalLink size={15} /> Abrir PDF
                </button>

                <button
                  type="button"
                  disabled={isGeneratingPDF}
                  onClick={async () => {
                    setIsGeneratingPDF(true);
                    try {
                      await generateConstructionProgressPDF(buildPDFPayloadFromAdvance(selectedAdvanceForDetail));
                    } finally {
                      setIsGeneratingPDF(false);
                    }
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.6rem 1.25rem",
                    borderRadius: "9999px",
                    backgroundColor: "var(--devio-green)",
                    color: "#ffffff",
                    border: "none",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: isGeneratingPDF ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 12px rgba(0, 196, 140, 0.3)",
                  }}
                >
                  <Download size={15} /> {isGeneratingPDF ? "Generando..." : "Descargar Reporte PDF"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* SUCCESS MODAL AFTER PUBLISHING */}
      {/* ================================================================== */}
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
            <p style={{ fontSize: "0.85rem", color: "var(--devio-neutral-3)", marginBottom: "1.5rem" }}>
              El avance de obra se ha registrado al <strong>{overallPct}%</strong>{" "}
              {targetScope === "UNITS"
                ? `para las ${selectedUnitNumbers.length} unidades seleccionadas.`
                : "para todo el desarrollo."}
              {sendEmailToClients && " Las notificaciones fueron enviadas a los compradores."}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
                <button
                  type="button"
                  disabled={isGeneratingPDF}
                  onClick={async () => {
                    if (!savedPDFData) return;
                    setIsGeneratingPDF(true);
                    try {
                      await generateConstructionProgressPDF(savedPDFData);
                    } catch (e) {
                      console.error("Error generating PDF:", e);
                    } finally {
                      setIsGeneratingPDF(false);
                    }
                  }}
                  style={{
                    flex: 1,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    padding: "0.75rem 1.25rem",
                    borderRadius: "9999px",
                    backgroundColor: "var(--devio-green)",
                    color: "#ffffff",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: isGeneratingPDF ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 14px rgba(0, 196, 140, 0.3)",
                  }}
                >
                  <Download size={16} /> {isGeneratingPDF ? "Generando..." : "Descargar Reporte PDF"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (savedPDFData) {
                      openConstructionProgressInNewTab(savedPDFData);
                    }
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    padding: "0.75rem 1.25rem",
                    borderRadius: "9999px",
                    backgroundColor: "rgba(31, 54, 82, 0.08)",
                    color: "var(--devio-blue-dark)",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    border: "1px solid rgba(31, 54, 82, 0.15)",
                    cursor: "pointer",
                  }}
                >
                  <Eye size={16} /> Ver en Pestaña
                </button>
              </div>

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
        </div>
      )}
    </div>
  );
}
