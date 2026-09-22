"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Clock,
  Wrench,
} from "lucide-react";
import {
  PostventaIncident,
  PostventaCategory,
  PostventaPriority,
  POSTVENTA_SUPPLIERS,
} from "../../data/postventa-data";
import { useProject } from "../../context/project-context";
import { DevioFileUploader, DevioUploadedFile } from "../ui/devio-file-uploader";
import PhoneInput from "../ui/phone-input";

interface NewIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (incident: PostventaIncident) => void;
  defaultProjectId?: string;
}

export function NewIncidentModal({
  isOpen,
  onClose,
  onSave,
  defaultProjectId,
}: NewIncidentModalProps) {
  const { projects } = useProject();

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    defaultProjectId || (projects[0]?.id ?? "p-1")
  );
  const [unit, setUnit] = useState<string>("");
  const [clientName, setClientName] = useState<string>("");
  const [clientEmail, setClientEmail] = useState<string>("");
  const [clientPhone, setClientPhone] = useState<string>("");
  const [hasCoOwners, setHasCoOwners] = useState<boolean>(false);
  const [coOwnerName, setCoOwnerName] = useState<string>("");
  const [coOwnerPct, setCoOwnerPct] = useState<number>(50);

  const [category, setCategory] = useState<PostventaCategory>("Plomería / Hidráulico");
  const [priority, setPriority] = useState<PostventaPriority>("Media");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [supplierId, setSupplierId] = useState<string>("");
  const [assignedStaff, setAssignedStaff] = useState<string>("");
  const [uploadedFiles, setUploadedFiles] = useState<DevioUploadedFile[]>([]);

  // Auto-folio generation
  const [folio, setFolio] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      const randomNum = Math.floor(Math.random() * 900) + 100;
      setFolio(`INC-2026-${randomNum}`);
      if (defaultProjectId) {
        setSelectedProjectId(defaultProjectId);
      }
    }
  }, [isOpen, defaultProjectId]);

  // SLA calculation based on Priority
  const getSlaHours = (p: PostventaPriority) => {
    switch (p) {
      case "Urgente":
        return 24;
      case "Alta":
        return 48;
      case "Media":
        return 72;
      case "Baja":
        return 120;
    }
  };

  const slaHours = getSlaHours(priority);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert("Por favor completa el título y la descripción del reporte.");
      return;
    }

    const currentProject = projects.find((p) => p.id === selectedProjectId) || projects[0];
    const matchedSupplier = POSTVENTA_SUPPLIERS.find((s) => s.id === supplierId);

    const now = new Date();
    const formattedDate = `${now.getDate()} ${now.toLocaleString("es-MX", { month: "short" })} ${now.getFullYear()} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    const newIncident: PostventaIncident = {
      id: `inc-${Date.now()}`,
      folio: folio || `INC-2026-${Math.floor(Math.random() * 900) + 100}`,
      projectId: selectedProjectId,
      projectName: currentProject?.name || "Tradere",
      unit: unit.trim().toUpperCase() || "1A",
      clientName: clientName.trim() || "Cliente Propietario",
      clientEmail: clientEmail.trim() || "cliente@devio.mx",
      clientPhone: clientPhone.trim() || "3300000000",
      coOwners: hasCoOwners && coOwnerName.trim() ? [{ name: coOwnerName.trim(), pct: coOwnerPct }] : [],
      category,
      priority,
      status: "Reportada",
      title: title.trim(),
      description: description.trim(),
      createdAt: formattedDate,
      updatedAt: formattedDate,
      slaHours,
      slaDeadline: `${slaHours} hrs a partir de reporte`,
      slaExpired: false,
      assignedTo: {
        id: "usr-2",
        name: assignedStaff,
        role: "Coordinador de Postventa",
      },
      supplier: matchedSupplier,
      appointments: [],
      evidences: uploadedFiles.map((f, idx) => ({
        id: `ev-new-${idx}-${Date.now()}`,
        type: "INITIAL_DEFECT",
        url: f.url,
        title: f.name,
        uploadDate: formattedDate,
        uploadedBy: "Mesa de Ayuda",
      })),
      comments: [
        {
          id: `comm-${Date.now()}`,
          timestamp: formattedDate,
          authorName: assignedStaff,
          authorRole: "Postventa",
          isInternalOnly: true,
          message: `Ticket levantado en plataforma con SLA inicial de ${slaHours} horas.`,
        },
      ],
      logs: [
        {
          id: `log-${Date.now()}`,
          timestamp: formattedDate,
          authorName: assignedStaff,
          authorRole: "Coordinador",
          action: "Creación de Incidencia",
          newState: "Reportada",
          notes: `Folio asignado: ${folio}. Prioridad ${priority}.`,
        },
      ],
    };

    onSave(newIncident);
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(4px)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "1.25rem",
          width: "100%",
          maxWidth: "760px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.25rem 1.75rem",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#F8FAFC",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
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
              <Wrench size={20} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1E293B", margin: 0 }}>
                  Nueva Incidencia de Postventa
                </h3>
                <span
                  style={{
                    backgroundColor: "#1B3047",
                    color: "#FFFFFF",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    padding: "0.2rem 0.6rem",
                    borderRadius: "9999px",
                  }}
                >
                  {folio}
                </span>
              </div>
              <p style={{ fontSize: "0.8rem", color: "#64748B", margin: "0.15rem 0 0 0" }}>
                Registra y canaliza reportes de garantía y vicios ocultos de las unidades.
              </p>
            </div>
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
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: "auto", flex: 1, padding: "1.5rem 1.75rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            
            {/* 1. Proyecto y Unidad */}
            <div style={{ backgroundColor: "#F8FAFC", padding: "1.1rem", borderRadius: "0.85rem", border: "1px solid #E2E8F0" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2F80ED", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.75rem" }}>
                1. Ubicación y Cliente
              </span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: "1rem", marginBottom: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: "0.35rem" }}>
                    Desarrollo / Proyecto *
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #CBD5E1",
                      fontSize: "0.85rem",
                      color: "#1E293B",
                      backgroundColor: "#FFFFFF",
                      outline: "none",
                    }}
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: "0.35rem" }}>
                    Unidad *
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="Ej. 4B"
                    required
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #CBD5E1",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: "#1E293B",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              {/* Cliente y Copropietarios */}
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "0.25rem" }}>
                    Cliente Propietario
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.65rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #CBD5E1",
                      fontSize: "0.82rem",
                      color: "#1E293B",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "0.25rem" }}>
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.65rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #CBD5E1",
                      fontSize: "0.82rem",
                      color: "#1E293B",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "0.25rem" }}>
                    Teléfono Celular
                  </label>
                  <PhoneInput
                    value={clientPhone}
                    onChange={(fullVal) => setClientPhone(fullVal)}
                    placeholder="(33) 1234-5678"
                  />
                </div>
              </div>

              {/* Toggle Copropietario */}
              <div style={{ marginTop: "0.5rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontSize: "0.78rem", fontWeight: 600, color: "#475569", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={hasCoOwners}
                    onChange={(e) => setHasCoOwners(e.target.checked)}
                    style={{ accentColor: "#2F80ED" }}
                  />
                  Registrar Copropietario(s) vinculados a la escritura
                </label>
                {hasCoOwners && (
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 100px", gap: "0.75rem", marginTop: "0.5rem", padding: "0.5rem 0.75rem", backgroundColor: "#FFFFFF", borderRadius: "0.5rem", border: "1px solid #E2E8F0" }}>
                    <div>
                      <span style={{ fontSize: "0.72rem", color: "#64748B", display: "block" }}>Nombre de Copropietario</span>
                      <input
                        type="text"
                        value={coOwnerName}
                        onChange={(e) => setCoOwnerName(e.target.value)}
                        placeholder="Ej. Carlos Calderón"
                        style={{ width: "100%", border: "none", outline: "none", fontSize: "0.82rem", fontWeight: 600, color: "#1E293B" }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: "0.72rem", color: "#64748B", display: "block" }}>% Propiedad</span>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={coOwnerPct}
                        onChange={(e) => setCoOwnerPct(Number(e.target.value))}
                        style={{ width: "100%", border: "none", outline: "none", fontSize: "0.82rem", fontWeight: 600, color: "#1E293B" }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Categoría, Prioridad y SLA */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: "0.35rem" }}>
                  Categoría del Reporte *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as PostventaCategory)}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.82rem",
                    color: "#1E293B",
                    backgroundColor: "#FFFFFF",
                  }}
                >
                  <option value="Plomería / Hidráulico">Plomería / Hidráulico</option>
                  <option value="Eléctrico">Eléctrico</option>
                  <option value="Acabados / Pintura">Acabados / Pintura</option>
                  <option value="Carpintería">Carpintería</option>
                  <option value="Cancelaría / Vidrio">Cancelaría / Vidrio</option>
                  <option value="Aire Acondicionado / HVAC">Aire Acondicionado / HVAC</option>
                  <option value="Impermeabilización / Humedad">Impermeabilización / Humedad</option>
                  <option value="Estructural / Albañilería">Estructural / Albañilería</option>
                  <option value="Cerrajería / Seguridad">Cerrajería / Seguridad</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: "0.35rem" }}>
                  Nivel de Prioridad *
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as PostventaPriority)}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    color:
                      priority === "Urgente"
                        ? "#E05345"
                        : priority === "Alta"
                        ? "#D97706"
                        : priority === "Media"
                        ? "#2563EB"
                        : "#059669",
                    backgroundColor: "#FFFFFF",
                  }}
                >
                  <option value="Urgente">🔴 Urgente (24 hrs)</option>
                  <option value="Alta">🟠 Alta (48 hrs)</option>
                  <option value="Media">🔵 Media (72 hrs)</option>
                  <option value="Baja">🟢 Baja (120 hrs)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: "0.35rem" }}>
                  SLA Comprometido
                </label>
                <div
                  style={{
                    padding: "0.55rem 0.75rem",
                    borderRadius: "0.5rem",
                    backgroundColor: "#EFF6FF",
                    border: "1px solid #BFDBFE",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    color: "#1E40AF",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                  }}
                >
                  <Clock size={16} />
                  <span>{slaHours} Horas máx.</span>
                </div>
              </div>
            </div>

            {/* 3. Título y Descripción del Defecto */}
            <div>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: "0.35rem" }}>
                Título Corto de la Incidencia *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Fuga en llave mezcladora de cocina principal"
                required
                style={{
                  width: "100%",
                  padding: "0.6rem 0.85rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #CBD5E1",
                  fontSize: "0.85rem",
                  color: "#1E293B",
                  fontWeight: 600,
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: "0.35rem" }}>
                Descripción Detallada del Defecto *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Indica ubicación exacta dentro del departamento, síntomas observados y afectaciones secundarias..."
                required
                style={{
                  width: "100%",
                  padding: "0.6rem 0.85rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #CBD5E1",
                  fontSize: "0.85rem",
                  color: "#1E293B",
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </div>

            {/* 4. Asignación y Proveedor Contratista */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: "0.35rem" }}>
                  Responsable Interno (Postventa)
                </label>
                <select
                  value={assignedStaff}
                  onChange={(e) => setAssignedStaff(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.82rem",
                    color: "#1E293B",
                    backgroundColor: "#FFFFFF",
                  }}
                >
                  <option value="Alejandro Calderón">Alejandro Calderón (Coordinador)</option>
                  <option value="Ing. Manuel Santos">Ing. Manuel Santos (Residente de Obra)</option>
                  <option value="Lic. Marcela Ruiz">Lic. Marcela Ruiz (Atención a Clientes)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: "0.35rem" }}>
                  Proveedor / Contratista Especializado
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.82rem",
                    color: "#1E293B",
                    backgroundColor: "#FFFFFF",
                  }}
                >
                  <option value="">-- Sin asignar / Pendiente de revisión --</option>
                  {POSTVENTA_SUPPLIERS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.specialty})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 5. Evidencias Iniciales (Fotos y Videos) */}
            <div>
              <DevioFileUploader
                label="Fotografías, Videos y Evidencia Inicial"
                description="Arrastra imágenes (JPG, PNG) o videos (MP4) de hasta 25MB para adjuntar al reporte."
                files={uploadedFiles}
                onFilesChange={setUploadedFiles}
                accept="image/*,video/*,application/pdf"
                maxFiles={8}
              />
            </div>

          </div>

          {/* Footer Actions */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: "0.75rem",
              marginTop: "1.75rem",
              paddingTop: "1.25rem",
              borderTop: "1px solid #E2E8F0",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.55rem 1.25rem",
                borderRadius: "9999px",
                border: "1px solid #CBD5E1",
                backgroundColor: "#FFFFFF",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "#64748B",
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                padding: "0.55rem 1.5rem",
                borderRadius: "9999px",
                border: "none",
                backgroundColor: "#1B3047",
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "#FFFFFF",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(27, 48, 71, 0.2)",
              }}
            >
              <Plus size={16} /> Crear Folio de Incidencia
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
