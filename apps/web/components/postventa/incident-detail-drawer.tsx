"use client";

import React, { useState } from "react";
import {
  X,
  Clock,
  User,
  Users,
  Building,
  Wrench,
  ShieldAlert,
  Calendar,
  Send,
  Lock,
  Globe,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Star,
  Plus,
  FileText,
  Phone,
  Mail,
  Truck,
  Eye,
  Check,
  UploadCloud,
  ChevronRight,
} from "lucide-react";
import {
  PostventaIncident,
  PostventaStatus,
  PostventaAppointment,
  PostventaLogItem,
  PostventaComment,
  PostventaEvidence,
  POSTVENTA_SUPPLIERS,
} from "../../data/postventa-data";
import { DevioDatePicker } from "../ui/devio-date-picker";
import { DevioFileUploader, DevioUploadedFile } from "../ui/devio-file-uploader";

interface IncidentDetailDrawerProps {
  incident: PostventaIncident | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateIncident: (updated: PostventaIncident) => void;
}

export function IncidentDetailDrawer({
  incident,
  isOpen,
  onClose,
  onUpdateIncident,
}: IncidentDetailDrawerProps) {
  if (!isOpen || !incident) return null;

  const [activeTab, setActiveTab] = useState<
    "bitacora" | "comentarios" | "visitas" | "evidencias" | "csat"
  >("bitacora");

  // State for new comment
  const [newCommentText, setNewCommentText] = useState("");
  const [isInternalComment, setIsInternalComment] = useState(false);

  // State for new appointment
  const [showNewApptForm, setShowNewApptForm] = useState(false);
  const [apptDate, setApptDate] = useState("2026-09-20");
  const [apptTime, setApptTime] = useState("11:00");
  const [apptTech, setApptTech] = useState("Téc. Carlos Morales");
  const [apptNotes, setApptNotes] = useState("");

  // State for reopening
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState("");

  // State for CSAT submission
  const [csatRating, setCsatRating] = useState(5);
  const [csatTimeliness, setCsatTimeliness] = useState(5);
  const [csatQuality, setCsatQuality] = useState(5);
  const [csatComment, setCsatComment] = useState("");

  // State for adding evidence
  const [showNewEvidenceForm, setShowNewEvidenceForm] = useState(false);
  const [evidenceTitle, setEvidenceTitle] = useState("");
  const [evidenceType, setEvidenceType] = useState<"INITIAL_DEFECT" | "REPAIR_PROOF" | "DELIVERY_ACT">("REPAIR_PROOF");
  const [evidenceFiles, setEvidenceFiles] = useState<DevioUploadedFile[]>([]);

  // Helper for status colors
  const getStatusBadge = (status: PostventaStatus) => {
    switch (status) {
      case "Reportada":
        return { bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE" };
      case "En revisión":
        return { bg: "#FEF3C7", color: "#D97706", border: "#FDE68A" };
      case "Asignada":
        return { bg: "#F3E8FF", color: "#7E22CE", border: "#E9D5FF" };
      case "Visita programada":
        return { bg: "#E0F2FE", color: "#0284C7", border: "#BAE6FD" };
      case "En reparación":
        return { bg: "#FFF7ED", color: "#EA580C", border: "#FFEDD5" };
      case "Esperando cliente":
        return { bg: "#FEF9C3", color: "#CA8A04", border: "#FEF08A" };
      case "Resuelta":
        return { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" };
      case "Cerrada":
        return { bg: "#F1F5F9", color: "#475569", border: "#CBD5E1" };
      case "Reabierta":
        return { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" };
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "Urgente":
        return { bg: "#FEF2F2", color: "#DC2626", text: "🔴 Urgente" };
      case "Alta":
        return { bg: "#FFF7ED", color: "#EA580C", text: "🟠 Alta" };
      case "Media":
        return { bg: "#EFF6FF", color: "#2563EB", text: "🔵 Media" };
      default:
        return { bg: "#ECFDF5", color: "#059669", text: "🟢 Baja" };
    }
  };

  const statusBadge = getStatusBadge(incident.status);
  const priorityBadge = getPriorityBadge(incident.priority);

  // Status transition handler
  const handleStatusChange = (newStatus: PostventaStatus) => {
    const now = new Date();
    const formattedDate = `${now.getDate()} ${now.toLocaleString("es-MX", { month: "short" })} ${now.getFullYear()} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    const newLog: PostventaLogItem = {
      id: `log-${Date.now()}`,
      timestamp: formattedDate,
      authorName: "Alejandro Calderón",
      authorRole: "Postventa",
      action: "Cambio de Estado",
      previousState: incident.status,
      newState: newStatus,
      notes: `Estado actualizado a "${newStatus}" por el coordinador.`,
    };

    const updated: PostventaIncident = {
      ...incident,
      status: newStatus,
      updatedAt: formattedDate,
      logs: [newLog, ...incident.logs],
    };

    onUpdateIncident(updated);
  };

  // Add Comment handler
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const now = new Date();
    const formattedDate = `${now.getDate()} ${now.toLocaleString("es-MX", { month: "short" })} ${now.getFullYear()} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    const comment: PostventaComment = {
      id: `comm-${Date.now()}`,
      timestamp: formattedDate,
      authorName: "Alejandro Calderón",
      authorRole: "Postventa",
      isInternalOnly: isInternalComment,
      message: newCommentText.trim(),
    };

    const newLog: PostventaLogItem = {
      id: `log-${Date.now()}`,
      timestamp: formattedDate,
      authorName: "Alejandro Calderón",
      authorRole: "Postventa",
      action: isInternalComment ? "Nota Interna Agregada" : "Mensaje al Cliente Enviado",
      notes: newCommentText.slice(0, 60) + (newCommentText.length > 60 ? "..." : ""),
    };

    const updated: PostventaIncident = {
      ...incident,
      updatedAt: formattedDate,
      comments: [comment, ...incident.comments],
      logs: [newLog, ...incident.logs],
    };

    onUpdateIncident(updated);
    setNewCommentText("");
  };

  // Add Appointment handler
  const handleAddAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const formattedDate = `${now.getDate()} ${now.toLocaleString("es-MX", { month: "short" })} ${now.getFullYear()} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    const newAppt: PostventaAppointment = {
      id: `appt-${Date.now()}`,
      scheduledDate: apptDate,
      scheduledTime: apptTime,
      technicianName: apptTech,
      supplierName: incident.supplier?.name || "Contratista asignado",
      status: "PROGRAMADA",
      notes: apptNotes.trim() || undefined,
    };

    const newLog: PostventaLogItem = {
      id: `log-${Date.now()}`,
      timestamp: formattedDate,
      authorName: "Alejandro Calderón",
      authorRole: "Postventa",
      action: "Cita Agendada",
      previousState: incident.status,
      newState: "Visita programada",
      notes: `Visita fijada para el ${apptDate} a las ${apptTime} hrs con ${apptTech}.`,
    };

    const updated: PostventaIncident = {
      ...incident,
      status: "Visita programada",
      updatedAt: formattedDate,
      appointments: [...incident.appointments, newAppt],
      logs: [newLog, ...incident.logs],
    };

    onUpdateIncident(updated);
    setShowNewApptForm(false);
    setApptNotes("");
  };

  // Add Evidence handler
  const handleSaveEvidenceFiles = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incident) return;
    if (evidenceFiles.length === 0 && !evidenceTitle.trim()) {
      alert("Por favor sube al menos un archivo o escribe un título descriptivo.");
      return;
    }

    const now = new Date();
    const formattedDate = `${now.getDate()} ${now.toLocaleString("es-MX", { month: "short" })} ${now.getFullYear()} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    const newEvs: PostventaEvidence[] = evidenceFiles.length > 0
      ? evidenceFiles.map((f, idx) => ({
          id: `ev-${Date.now()}-${idx}`,
          type: evidenceType,
          url: f.url,
          title: evidenceTitle.trim() || f.name,
          uploadDate: formattedDate,
          uploadedBy: "Alejandro Calderón (Coordinador)",
        }))
      : [
          {
            id: `ev-${Date.now()}`,
            type: evidenceType,
            url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
            title: evidenceTitle.trim() || "Comprobante de Reparación Finalizada",
            uploadDate: formattedDate,
            uploadedBy: "Alejandro Calderón (Coordinador)",
          },
        ];

    const newLogs: PostventaLogItem[] = newEvs.map((ev) => ({
      id: `log-${Date.now()}-${ev.id}`,
      timestamp: formattedDate,
      authorName: "Alejandro Calderón",
      authorRole: "Postventa",
      action: "Evidencia Adjunta",
      notes: `Se subió archivo de evidencia (${evidenceType}): ${ev.title}`,
    }));

    const updated: PostventaIncident = {
      ...incident,
      updatedAt: formattedDate,
      evidences: [...incident.evidences, ...newEvs],
      logs: [...newLogs, ...incident.logs],
    };

    onUpdateIncident(updated);
    setShowNewEvidenceForm(false);
    setEvidenceTitle("");
    setEvidenceFiles([]);
  };

  // Close ticket with CSAT
  const handleSaveCSAT = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const formattedDate = `${now.getDate()} ${now.toLocaleString("es-MX", { month: "short" })} ${now.getFullYear()} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    const newLog: PostventaLogItem = {
      id: `log-${Date.now()}`,
      timestamp: formattedDate,
      authorName: incident.clientName,
      authorRole: "Cliente",
      action: "Cierre de Caso y Encuesta CSAT",
      previousState: incident.status,
      newState: "Cerrada",
      notes: `Cliente evaluó con ${csatRating}/5 estrellas. Comentario: ${csatComment || "Sin comentarios adicionales."}`,
    };

    const updated: PostventaIncident = {
      ...incident,
      status: "Cerrada",
      updatedAt: formattedDate,
      csat: {
        rating: csatRating,
        feedbackDate: formattedDate,
        comment: csatComment.trim() || undefined,
        timelinessRating: csatTimeliness,
        qualityRating: csatQuality,
      },
      logs: [newLog, ...incident.logs],
    };

    onUpdateIncident(updated);
    alert("Incidencia cerrada exitosamente con encuesta CSAT registrada.");
  };

  // Reopen ticket handler
  const handleReopen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenReason.trim()) {
      alert("Por favor especifica el motivo de reapertura.");
      return;
    }

    const now = new Date();
    const formattedDate = `${now.getDate()} ${now.toLocaleString("es-MX", { month: "short" })} ${now.getFullYear()} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    const newLog: PostventaLogItem = {
      id: `log-${Date.now()}`,
      timestamp: formattedDate,
      authorName: "Alejandro Calderón",
      authorRole: "Postventa",
      action: "Reapertura de Incidencia",
      previousState: incident.status,
      newState: "Reabierta",
      notes: `Motivo: ${reopenReason.trim()}. SLA reactivado para atención prioritaria.`,
    };

    const updated: PostventaIncident = {
      ...incident,
      status: "Reabierta",
      isReopened: true,
      reopenedCount: (incident.reopenedCount || 0) + 1,
      reopenedReason: reopenReason.trim(),
      updatedAt: formattedDate,
      logs: [newLog, ...incident.logs],
    };

    onUpdateIncident(updated);
    setShowReopenModal(false);
    setReopenReason("");
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(4px)",
        zIndex: 99990,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "880px",
          height: "100vh",
          backgroundColor: "#FFFFFF",
          boxShadow: "-10px 0 30px rgba(0,0,0,0.15)",
          display: "flex",
          flexDirection: "column",
          animation: "slideIn 0.2s ease-out",
        }}
      >
        {/* Top Header Drawer */}
        <div
          style={{
            padding: "1.25rem 1.75rem",
            borderBottom: "1px solid #E2E8F0",
            backgroundColor: "#F8FAFC",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                backgroundColor: "#1B3047",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Wrench size={22} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <span
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 800,
                    color: "#1E293B",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {incident.folio}
                </span>
                <span
                  style={{
                    backgroundColor: priorityBadge.bg,
                    color: priorityBadge.color,
                    padding: "0.2rem 0.65rem",
                    borderRadius: "9999px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                  }}
                >
                  {priorityBadge.text}
                </span>
                {incident.isReopened && (
                  <span
                    style={{
                      backgroundColor: "#FEF2F2",
                      color: "#DC2626",
                      padding: "0.2rem 0.6rem",
                      borderRadius: "9999px",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                    }}
                  >
                    <RotateCcw size={12} /> Reabierta ({incident.reopenedCount || 1})
                  </span>
                )}
              </div>
              <p style={{ fontSize: "0.82rem", color: "#64748B", margin: "0.2rem 0 0 0" }}>
                {incident.projectName} &bull; Unidad {incident.unit} &bull; Reportado el {incident.createdAt}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {/* Status Dropdown Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600 }}>Estado:</span>
              <select
                value={incident.status}
                onChange={(e) => handleStatusChange(e.target.value as PostventaStatus)}
                style={{
                  backgroundColor: statusBadge.bg,
                  color: statusBadge.color,
                  border: `1px solid ${statusBadge.border}`,
                  padding: "0.4rem 0.85rem",
                  borderRadius: "9999px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="Reportada">Reportada</option>
                <option value="En revisión">En revisión</option>
                <option value="Asignada">Asignada</option>
                <option value="Visita programada">Visita programada</option>
                <option value="En reparación">En reparación</option>
                <option value="Esperando cliente">Esperando cliente</option>
                <option value="Resuelta">Resuelta</option>
                <option value="Cerrada">Cerrada</option>
                <option value="Reabierta">Reabierta</option>
              </select>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                border: "none",
                backgroundColor: "transparent",
                color: "#94A3B8",
                cursor: "pointer",
                padding: "0.4rem",
                borderRadius: "0.5rem",
              }}
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Top Summary Banner */}
        <div
          style={{
            padding: "1rem 1.75rem",
            backgroundColor: "#FFFFFF",
            borderBottom: "1px solid #E2E8F0",
            display: "grid",
            gridTemplateColumns: "1.4fr 1.2fr 1fr",
            gap: "1.25rem",
          }}
        >
          {/* Client & Co-owners */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "#64748B", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase" }}>
              <User size={13} /> Propietario Principal
            </div>
            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1E293B", marginTop: "0.2rem" }}>
              {incident.clientName}
            </div>
            <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.75rem", color: "#64748B", marginTop: "0.15rem" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}><Mail size={12} /> {incident.clientEmail}</span>
              <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}><Phone size={12} /> {incident.clientPhone}</span>
            </div>
            {incident.coOwners && incident.coOwners.length > 0 && incident.coOwners[0] && (
              <div style={{ marginTop: "0.35rem", padding: "0.25rem 0.5rem", backgroundColor: "#F8FAFC", borderRadius: "0.4rem", border: "1px solid #E2E8F0", fontSize: "0.72rem", color: "#475569" }}>
                <strong>Copropietario:</strong> {incident.coOwners[0].name} ({incident.coOwners[0].pct}%)
              </div>
            )}
          </div>

          {/* Supplier & Internal Staff */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "#64748B", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase" }}>
              <Truck size={13} /> Proveedor Asignado
            </div>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1E293B", marginTop: "0.2rem" }}>
              {incident.supplier?.name || "Sin proveedor asignado"}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "0.15rem" }}>
              Resp. Interno: <strong>{incident.assignedTo.name}</strong>
            </div>
            <div style={{ fontSize: "0.75rem", color: "#2F80ED", fontWeight: 600, marginTop: "0.15rem" }}>
              Categoría: {incident.category}
            </div>
          </div>

          {/* SLA & Time Countdown */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "#64748B", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase" }}>
              <Clock size={13} /> SLA Comprometido
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.2rem" }}>
              <span
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 800,
                  color: incident.slaExpired ? "#DC2626" : "#059669",
                }}
              >
                {incident.slaHours} hrs
              </span>
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  padding: "0.15rem 0.5rem",
                  borderRadius: "9999px",
                  backgroundColor: incident.slaExpired ? "#FEF2F2" : "#ECFDF5",
                  color: incident.slaExpired ? "#DC2626" : "#059669",
                }}
              >
                {incident.slaExpired ? "Vencido" : "En Tiempo"}
              </span>
            </div>
            <div style={{ fontSize: "0.72rem", color: "#94A3B8", marginTop: "0.15rem" }}>
              Meta: {incident.slaDeadline}
            </div>
          </div>
        </div>

        {/* Issue Title & Description Box */}
        <div style={{ padding: "0.85rem 1.75rem", backgroundColor: "#F1F5F9", borderBottom: "1px solid #E2E8F0" }}>
          <strong style={{ fontSize: "0.85rem", color: "#1E293B", display: "block" }}>
            {incident.title}
          </strong>
          <p style={{ fontSize: "0.8rem", color: "#475569", margin: "0.25rem 0 0 0", lineHeight: 1.4 }}>
            {incident.description}
          </p>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #E2E8F0",
            backgroundColor: "#FFFFFF",
            padding: "0 1.75rem",
            gap: "1.5rem",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("bitacora")}
            style={{
              padding: "0.85rem 0",
              border: "none",
              background: "none",
              fontSize: "0.85rem",
              fontWeight: activeTab === "bitacora" ? 700 : 500,
              color: activeTab === "bitacora" ? "#1B3047" : "#64748B",
              borderBottom: activeTab === "bitacora" ? "2px solid #1B3047" : "2px solid transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <Clock size={16} /> Bitácora Auditoría ({incident.logs.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("comentarios")}
            style={{
              padding: "0.85rem 0",
              border: "none",
              background: "none",
              fontSize: "0.85rem",
              fontWeight: activeTab === "comentarios" ? 700 : 500,
              color: activeTab === "comentarios" ? "#1B3047" : "#64748B",
              borderBottom: activeTab === "comentarios" ? "2px solid #1B3047" : "2px solid transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <Send size={16} /> Comentarios ({incident.comments.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("visitas")}
            style={{
              padding: "0.85rem 0",
              border: "none",
              background: "none",
              fontSize: "0.85rem",
              fontWeight: activeTab === "visitas" ? 700 : 500,
              color: activeTab === "visitas" ? "#1B3047" : "#64748B",
              borderBottom: activeTab === "visitas" ? "2px solid #1B3047" : "2px solid transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <Calendar size={16} /> Citas & Visitas ({incident.appointments.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("evidencias")}
            style={{
              padding: "0.85rem 0",
              border: "none",
              background: "none",
              fontSize: "0.85rem",
              fontWeight: activeTab === "evidencias" ? 700 : 500,
              color: activeTab === "evidencias" ? "#1B3047" : "#64748B",
              borderBottom: activeTab === "evidencias" ? "2px solid #1B3047" : "2px solid transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <FileText size={16} /> Evidencias & Fotos ({incident.evidences.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("csat")}
            style={{
              padding: "0.85rem 0",
              border: "none",
              background: "none",
              fontSize: "0.85rem",
              fontWeight: activeTab === "csat" ? 700 : 500,
              color: activeTab === "csat" ? "#1B3047" : "#64748B",
              borderBottom: activeTab === "csat" ? "2px solid #1B3047" : "2px solid transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <Star size={16} style={{ color: incident.csat ? "#EAB308" : "inherit" }} /> Cierre / CSAT
          </button>
        </div>

        {/* Tab Body Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem 1.75rem", backgroundColor: "#F8FAFC" }}>
          
          {/* TAB 1: BITÁCORA */}
          {activeTab === "bitacora" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569" }}>
                  Historial inmutable de auditoría y ciclo de vida del reporte
                </span>
                <span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>
                  {incident.logs.length} eventos registrados
                </span>
              </div>

              <div style={{ position: "relative", paddingLeft: "1.5rem" }}>
                {/* Vertical timeline bar */}
                <div
                  style={{
                    position: "absolute",
                    left: "7px",
                    top: "10px",
                    bottom: "10px",
                    width: "2px",
                    backgroundColor: "#CBD5E1",
                  }}
                />

                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {incident.logs.map((log) => (
                    <div key={log.id} style={{ position: "relative" }}>
                      {/* Timeline dot */}
                      <div
                        style={{
                          position: "absolute",
                          left: "-1.5rem",
                          top: "4px",
                          width: "16px",
                          height: "16px",
                          borderRadius: "50%",
                          backgroundColor: "#1B3047",
                          border: "3px solid #FFFFFF",
                          boxShadow: "0 0 0 1px #CBD5E1",
                        }}
                      />

                      <div
                        style={{
                          backgroundColor: "#FFFFFF",
                          padding: "0.85rem 1.15rem",
                          borderRadius: "0.75rem",
                          border: "1px solid #E2E8F0",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1E293B" }}>
                            {log.action}
                          </span>
                          <span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>
                            {log.timestamp}
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem", color: "#64748B", marginBottom: "0.4rem" }}>
                          <span>Por: <strong>{log.authorName}</strong> ({log.authorRole})</span>
                          {log.newState && (
                            <>
                              &bull;
                              <span style={{ color: "#2563EB", fontWeight: 600 }}>
                                Estado: {log.previousState ? `${log.previousState} ➔ ` : ""}{log.newState}
                              </span>
                            </>
                          )}
                        </div>

                        {log.notes && (
                          <p style={{ fontSize: "0.78rem", color: "#475569", margin: 0, backgroundColor: "#F8FAFC", padding: "0.45rem 0.65rem", borderRadius: "0.4rem" }}>
                            {log.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COMENTARIOS */}
          {activeTab === "comentarios" && (
            <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between", gap: "1rem" }}>
              {/* Message List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {incident.comments.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2rem", color: "#94A3B8", fontSize: "0.85rem" }}>
                    No hay comentarios en este reporte todavía.
                  </div>
                ) : (
                  incident.comments.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        backgroundColor: c.isInternalOnly ? "#FEF9C3" : "#FFFFFF",
                        border: c.isInternalOnly ? "1px solid #FDE047" : "1px solid #E2E8F0",
                        borderRadius: "0.75rem",
                        padding: "0.85rem 1rem",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1E293B" }}>
                            {c.authorName}
                          </span>
                          <span style={{ fontSize: "0.72rem", color: "#64748B" }}>
                            ({c.authorRole})
                          </span>
                          {c.isInternalOnly ? (
                            <span style={{ display: "flex", alignItems: "center", gap: "0.2rem", fontSize: "0.68rem", fontWeight: 700, backgroundColor: "#FEF08A", color: "#854D0E", padding: "0.1rem 0.4rem", borderRadius: "9999px" }}>
                              <Lock size={10} /> NOTA INTERNA (Solo equipo)
                            </span>
                          ) : (
                            <span style={{ display: "flex", alignItems: "center", gap: "0.2rem", fontSize: "0.68rem", fontWeight: 700, backgroundColor: "#E0F2FE", color: "#0369A1", padding: "0.1rem 0.4rem", borderRadius: "9999px" }}>
                              <Globe size={10} /> Visible para Cliente
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>{c.timestamp}</span>
                      </div>
                      <p style={{ fontSize: "0.82rem", color: "#334155", margin: 0, lineHeight: 1.4 }}>
                        {c.message}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Message Composer */}
              <form
                onSubmit={handleAddComment}
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #CBD5E1",
                  borderRadius: "0.85rem",
                  padding: "0.85rem",
                  marginTop: "auto",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>
                    Escribir mensaje o nota técnica
                  </span>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.72rem", fontWeight: 600, color: "#854D0E", cursor: "pointer", backgroundColor: "#FEF9C3", padding: "0.2rem 0.5rem", borderRadius: "0.4rem" }}>
                    <input
                      type="checkbox"
                      checked={isInternalComment}
                      onChange={(e) => setIsInternalComment(e.target.checked)}
                      style={{ accentColor: "#D97706" }}
                    />
                    <Lock size={12} /> Marcar como Nota Interna Privada
                  </label>
                </div>
                <textarea
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder={isInternalComment ? "Escribe detalles privados para el equipo de postventa o proveedor..." : "Escribe un mensaje visible para el cliente y copropietarios..."}
                  rows={2}
                  style={{
                    width: "100%",
                    border: "none",
                    outline: "none",
                    fontSize: "0.82rem",
                    color: "#1E293B",
                    resize: "none",
                  }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                  <button
                    type="submit"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      backgroundColor: "#1B3047",
                      color: "#FFFFFF",
                      border: "none",
                      padding: "0.45rem 1.15rem",
                      borderRadius: "9999px",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <Send size={13} /> Enviar Mensaje
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: VISITAS & CITAS */}
          {activeTab === "visitas" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569" }}>
                  Agenda de inspecciones y visitas de reparación en la unidad
                </span>
                <button
                  type="button"
                  onClick={() => setShowNewApptForm(!showNewApptForm)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    backgroundColor: "#1B3047",
                    color: "#FFFFFF",
                    border: "none",
                    padding: "0.4rem 0.85rem",
                    borderRadius: "9999px",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <Plus size={14} /> Programar Nueva Visita
                </button>
              </div>

              {/* Form to schedule visit */}
              {showNewApptForm && (
                <form
                  onSubmit={handleAddAppointment}
                  style={{
                    backgroundColor: "#FFFFFF",
                    padding: "1.1rem",
                    borderRadius: "0.85rem",
                    border: "1px solid #CBD5E1",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  <strong style={{ fontSize: "0.85rem", color: "#1E293B" }}>
                    Agendar Cita con Técnico / Especialista
                  </strong>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr", gap: "0.75rem" }}>
                    <div>
                      <DevioDatePicker
                        label="Fecha de la Cita"
                        value={apptDate}
                        onChange={setApptDate}
                        placeholder="Seleccionar día"
                        required
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.72rem", color: "#64748B", display: "block", marginBottom: "0.2rem" }}>Hora</label>
                      <input
                        type="time"
                        value={apptTime}
                        onChange={(e) => setApptTime(e.target.value)}
                        required
                        style={{ width: "100%", padding: "0.45rem", borderRadius: "0.4rem", border: "1px solid #CBD5E1", fontSize: "0.8rem" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.72rem", color: "#64748B", display: "block", marginBottom: "0.2rem" }}>Técnico Responsable</label>
                      <input
                        type="text"
                        value={apptTech}
                        onChange={(e) => setApptTech(e.target.value)}
                        required
                        style={{ width: "100%", padding: "0.45rem", borderRadius: "0.4rem", border: "1px solid #CBD5E1", fontSize: "0.8rem" }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: "0.72rem", color: "#64748B", display: "block", marginBottom: "0.2rem" }}>Indicaciones para el técnico</label>
                    <input
                      type="text"
                      value={apptNotes}
                      onChange={(e) => setApptNotes(e.target.value)}
                      placeholder="Ej. Llevar multímetro digital y sellador de poliuretano..."
                      style={{ width: "100%", padding: "0.45rem", borderRadius: "0.4rem", border: "1px solid #CBD5E1", fontSize: "0.8rem" }}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                    <button
                      type="button"
                      onClick={() => setShowNewApptForm(false)}
                      style={{ padding: "0.4rem 0.85rem", border: "1px solid #CBD5E1", backgroundColor: "#FFFFFF", borderRadius: "9999px", fontSize: "0.75rem", cursor: "pointer" }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      style={{ padding: "0.4rem 1.15rem", border: "none", backgroundColor: "#00C48C", color: "#FFFFFF", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                    >
                      Confirmar Cita
                    </button>
                  </div>
                </form>
              )}

              {/* List of Appointments */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {incident.appointments.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2rem", color: "#94A3B8", fontSize: "0.85rem" }}>
                    No hay visitas programadas para esta incidencia.
                  </div>
                ) : (
                  incident.appointments.map((a) => (
                    <div
                      key={a.id}
                      style={{
                        backgroundColor: "#FFFFFF",
                        borderRadius: "0.75rem",
                        padding: "1rem 1.25rem",
                        border: "1px solid #E2E8F0",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "10px",
                            backgroundColor: "rgba(47, 128, 237, 0.1)",
                            color: "#2F80ED",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Calendar size={20} />
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <strong style={{ fontSize: "0.88rem", color: "#1E293B" }}>
                              {a.scheduledDate} a las {a.scheduledTime} hrs
                            </strong>
                            <span
                              style={{
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                padding: "0.15rem 0.5rem",
                                borderRadius: "9999px",
                                backgroundColor: a.status === "COMPLETADA" ? "#ECFDF5" : "#EFF6FF",
                                color: a.status === "COMPLETADA" ? "#059669" : "#2563EB",
                              }}
                            >
                              {a.status}
                            </span>
                          </div>
                          <p style={{ fontSize: "0.78rem", color: "#64748B", margin: "0.2rem 0 0 0" }}>
                            Técnico: <strong>{a.technicianName}</strong> {a.supplierName ? `(${a.supplierName})` : ""}
                          </p>
                          {a.notes && (
                            <p style={{ fontSize: "0.75rem", color: "#475569", margin: "0.2rem 0 0 0", fontStyle: "italic" }}>
                              &ldquo;{a.notes}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>

                      {a.status === "PROGRAMADA" && (
                        <button
                          type="button"
                          onClick={() => {
                            const updatedAppts = incident.appointments.map((item) =>
                              item.id === a.id ? { ...item, status: "COMPLETADA" as const } : item
                            );
                            onUpdateIncident({ ...incident, appointments: updatedAppts });
                          }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            backgroundColor: "#ECFDF5",
                            color: "#059669",
                            border: "1px solid #A7F3D0",
                            padding: "0.35rem 0.75rem",
                            borderRadius: "9999px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          <Check size={14} /> Marcar Realizada
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: EVIDENCIAS & FOTOS */}
          {activeTab === "evidencias" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569" }}>
                  Fotografías iniciales vs Evidencia de reparación y conformidad ({incident.evidences.length})
                </span>
                <button
                  type="button"
                  onClick={() => setShowNewEvidenceForm(!showNewEvidenceForm)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    backgroundColor: showNewEvidenceForm ? "#64748B" : "#1B3047",
                    color: "#FFFFFF",
                    border: "none",
                    padding: "0.4rem 0.85rem",
                    borderRadius: "9999px",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <Plus size={14} /> {showNewEvidenceForm ? "Cancelar Carga" : "Adjuntar Evidencia Reparación"}
                </button>
              </div>

              {/* Formulario para agregar evidencias con FileUploader */}
              {showNewEvidenceForm && (
                <form
                  onSubmit={handleSaveEvidenceFiles}
                  style={{
                    backgroundColor: "#FFFFFF",
                    padding: "1.25rem",
                    borderRadius: "0.85rem",
                    border: "1px solid #CBD5E1",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.85rem",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                  }}
                >
                  <strong style={{ fontSize: "0.85rem", color: "#1E293B" }}>
                    Subir Nuevas Fotografías o Documentos de Evidencia
                  </strong>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "0.75rem" }}>
                    <div>
                      <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "0.2rem" }}>
                        Título / Concepto de la Evidencia
                      </label>
                      <input
                        type="text"
                        value={evidenceTitle}
                        onChange={(e) => setEvidenceTitle(e.target.value)}
                        placeholder="Ej. Fotografía tras cambio de válvula y prueba de presión"
                        style={{
                          width: "100%",
                          padding: "0.5rem 0.75rem",
                          borderRadius: "0.4rem",
                          border: "1px solid #CBD5E1",
                          fontSize: "0.82rem",
                          outline: "none",
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "0.2rem" }}>
                        Tipo de Archivo / Evidencia
                      </label>
                      <select
                        value={evidenceType}
                        onChange={(e) => setEvidenceType(e.target.value as any)}
                        style={{
                          width: "100%",
                          padding: "0.5rem 0.75rem",
                          borderRadius: "0.4rem",
                          border: "1px solid #CBD5E1",
                          fontSize: "0.82rem",
                          outline: "none",
                          backgroundColor: "#FFFFFF",
                        }}
                      >
                        <option value="REPAIR_PROOF">🟢 Evidencia de Reparación (Después)</option>
                        <option value="INITIAL_DEFECT">🔴 Evidencia de Defecto (Antes)</option>
                        <option value="DELIVERY_ACT">🔵 Acta de Entrega y Conformidad (PDF / Firma)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <DevioFileUploader
                      label="Archivos o Fotografías"
                      description="Arrastra imágenes, PDF o videos hasta 25MB para anexar a la bitácora."
                      files={evidenceFiles}
                      onFilesChange={setEvidenceFiles}
                      maxFiles={5}
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <button
                      type="button"
                      onClick={() => setShowNewEvidenceForm(false)}
                      style={{
                        padding: "0.45rem 1rem",
                        borderRadius: "9999px",
                        border: "1px solid #CBD5E1",
                        background: "#FFFFFF",
                        fontSize: "0.8rem",
                        color: "#64748B",
                        cursor: "pointer",
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      style={{
                        padding: "0.45rem 1.25rem",
                        borderRadius: "9999px",
                        border: "none",
                        backgroundColor: "#00C48C",
                        color: "#FFFFFF",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Guardar y Vincular Evidencia
                    </button>
                  </div>
                </form>
              )}

              {/* Grid of Evidences */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
                {incident.evidences.map((ev) => (
                  <div
                    key={ev.id}
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: "0.85rem",
                      overflow: "hidden",
                      border: "1px solid #E2E8F0",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                    }}
                  >
                    <div style={{ position: "relative", height: "140px", backgroundColor: "#E2E8F0" }}>
                      <img
                        src={ev.url}
                        alt={ev.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          top: "8px",
                          left: "8px",
                          fontSize: "0.68rem",
                          fontWeight: 800,
                          padding: "0.2rem 0.5rem",
                          borderRadius: "9999px",
                          backgroundColor:
                            ev.type === "INITIAL_DEFECT"
                              ? "rgba(220, 38, 38, 0.9)"
                              : ev.type === "REPAIR_PROOF"
                              ? "rgba(5, 150, 105, 0.9)"
                              : "rgba(37, 99, 235, 0.9)",
                          color: "#FFFFFF",
                        }}
                      >
                        {ev.type === "INITIAL_DEFECT" ? "ANTES / DEFECTO" : ev.type === "REPAIR_PROOF" ? "DESPUÉS / REPARADO" : "ACTA ENTREGA"}
                      </span>
                    </div>
                    <div style={{ padding: "0.75rem" }}>
                      <strong style={{ fontSize: "0.82rem", color: "#1E293B", display: "block" }}>
                        {ev.title}
                      </strong>
                      <p style={{ fontSize: "0.72rem", color: "#94A3B8", margin: "0.2rem 0 0 0" }}>
                        Subido por {ev.uploadedBy} &bull; {ev.uploadDate}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: CIERRE / REAPERTURA & CSAT */}
          {activeTab === "csat" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* If CSAT exists, show completed scorecard */}
              {incident.csat ? (
                <div
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "1rem",
                    padding: "1.5rem",
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        backgroundColor: "#ECFDF5",
                        color: "#059669",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <strong style={{ fontSize: "0.95rem", color: "#1E293B" }}>
                        Incidencia Cerrada con Conformidad
                      </strong>
                      <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block" }}>
                        Encuesta CSAT respondida el {incident.csat.feedbackDate}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", backgroundColor: "#F8FAFC", padding: "1rem", borderRadius: "0.75rem", marginBottom: "1rem" }}>
                    <div>
                      <span style={{ fontSize: "0.72rem", color: "#64748B", display: "block" }}>Calificación General</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.25rem" }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={18}
                            style={{
                              color: s <= (incident.csat?.rating || 0) ? "#EAB308" : "#CBD5E1",
                              fill: s <= (incident.csat?.rating || 0) ? "#EAB308" : "none",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.72rem", color: "#64748B", display: "block" }}>Puntualidad y SLA</span>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1E293B", marginTop: "0.25rem" }}>
                        {incident.csat.timelinessRating} / 5 Estrellas
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.72rem", color: "#64748B", display: "block" }}>Calidad de Reparación</span>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1E293B", marginTop: "0.25rem" }}>
                        {incident.csat.qualityRating} / 5 Estrellas
                      </div>
                    </div>
                  </div>

                  {incident.csat.comment && (
                    <div style={{ padding: "0.75rem 1rem", backgroundColor: "#FEF9C3", borderRadius: "0.5rem", border: "1px solid #FEF08A" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#854D0E", display: "block" }}>
                        Comentarios del Propietario:
                      </span>
                      <p style={{ fontSize: "0.82rem", color: "#713F12", margin: "0.2rem 0 0 0" }}>
                        &ldquo;{incident.csat.comment}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Reopen Action Button */}
                  <div style={{ marginTop: "1.25rem", display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      onClick={() => setShowReopenModal(true)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        padding: "0.45rem 1.15rem",
                        borderRadius: "9999px",
                        border: "1px solid #FECACA",
                        backgroundColor: "#FEF2F2",
                        color: "#DC2626",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      <RotateCcw size={14} /> Reabrir Incidencia por Reincidencia
                    </button>
                  </div>
                </div>
              ) : (
                /* Form to Close & Record CSAT */
                <form
                  onSubmit={handleSaveCSAT}
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "1rem",
                    padding: "1.5rem",
                    border: "1px solid #E2E8F0",
                  }}
                >
                  <strong style={{ fontSize: "0.95rem", color: "#1E293B", display: "block", marginBottom: "0.25rem" }}>
                    Protocolo de Cierre y Encuesta de Satisfacción (CSAT)
                  </strong>
                  <p style={{ fontSize: "0.78rem", color: "#64748B", margin: "0 0 1.25rem 0" }}>
                    Registra la conformidad del propietario para finalizar oficialmente el ticket.
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.25rem" }}>
                    <div>
                      <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: "0.35rem" }}>
                        Calificación General del Servicio (1 a 5 estrellas)
                      </label>
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        {[1, 2, 3, 4, 5].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setCsatRating(val)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: "0.25rem",
                            }}
                          >
                            <Star
                              size={26}
                              style={{
                                color: val <= csatRating ? "#EAB308" : "#CBD5E1",
                                fill: val <= csatRating ? "#EAB308" : "none",
                              }}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div>
                        <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: "0.25rem" }}>
                          Puntualidad del Técnico (1-5)
                        </label>
                        <select
                          value={csatTimeliness}
                          onChange={(e) => setCsatTimeliness(Number(e.target.value))}
                          style={{ width: "100%", padding: "0.45rem", borderRadius: "0.4rem", border: "1px solid #CBD5E1", fontSize: "0.8rem" }}
                        >
                          <option value={5}>5 - Excelente / En tiempo</option>
                          <option value={4}>4 - Bueno</option>
                          <option value={3}>3 - Regular</option>
                          <option value={2}>2 - Retraso leve</option>
                          <option value={1}>1 - Muy impuntual</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: "0.25rem" }}>
                          Calidad de Acabado (1-5)
                        </label>
                        <select
                          value={csatQuality}
                          onChange={(e) => setCsatQuality(Number(e.target.value))}
                          style={{ width: "100%", padding: "0.45rem", borderRadius: "0.4rem", border: "1px solid #CBD5E1", fontSize: "0.8rem" }}
                        >
                          <option value={5}>5 - Impecable / 100% resuelto</option>
                          <option value={4}>4 - Muy bueno</option>
                          <option value={3}>3 - Aceptable</option>
                          <option value={2}>2 - Deficiente</option>
                          <option value={1}>1 - Inconcluso</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: "0.25rem" }}>
                        Comentarios o retroalimentación del cliente
                      </label>
                      <textarea
                        value={csatComment}
                        onChange={(e) => setCsatComment(e.target.value)}
                        placeholder="Ej. El técnico llegó puntual y dejó el área completamente limpia..."
                        rows={2}
                        style={{ width: "100%", padding: "0.55rem", borderRadius: "0.4rem", border: "1px solid #CBD5E1", fontSize: "0.8rem" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="submit"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.45rem",
                        padding: "0.55rem 1.4rem",
                        borderRadius: "9999px",
                        border: "none",
                        backgroundColor: "#00C48C",
                        color: "#FFFFFF",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      <CheckCircle2 size={16} /> Cerrar Caso y Guardar CSAT
                    </button>
                  </div>
                </form>
              )}

              {/* Reopen Modal */}
              {showReopenModal && (
                <div
                  style={{
                    backgroundColor: "#FEF2F2",
                    border: "1px solid #FECACA",
                    borderRadius: "0.85rem",
                    padding: "1.25rem",
                  }}
                >
                  <strong style={{ fontSize: "0.88rem", color: "#DC2626", display: "block", marginBottom: "0.25rem" }}>
                    Reapertura de Incidencia por Falla Reincidente
                  </strong>
                  <p style={{ fontSize: "0.75rem", color: "#991B1B", margin: "0 0 0.75rem 0" }}>
                    Indica el motivo técnico por el cual la garantía o reparación previa no solventó el problema.
                  </p>
                  <textarea
                    value={reopenReason}
                    onChange={(e) => setReopenReason(e.target.value)}
                    placeholder="Ej. La fuga volvió a manifestarse al aumentar la presión de la red hidráulica..."
                    rows={2}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "0.4rem", border: "1px solid #FCA5A5", fontSize: "0.8rem", marginBottom: "0.75rem" }}
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                    <button
                      type="button"
                      onClick={() => setShowReopenModal(false)}
                      style={{ padding: "0.4rem 0.85rem", border: "1px solid #CBD5E1", backgroundColor: "#FFFFFF", borderRadius: "9999px", fontSize: "0.75rem", cursor: "pointer" }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleReopen}
                      style={{ padding: "0.4rem 1.15rem", border: "none", backgroundColor: "#DC2626", color: "#FFFFFF", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                    >
                      Confirmar Reapertura
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
