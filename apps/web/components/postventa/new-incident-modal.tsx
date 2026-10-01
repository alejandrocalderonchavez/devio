"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  Plus,
  Clock,
  Wrench,
  Building2,
  Search,
  User,
  Users,
  Check,
  ChevronDown,
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
  defaultUnit?: string;
}

export function NewIncidentModal({
  isOpen,
  onClose,
  onSave,
  defaultProjectId,
  defaultUnit,
}: NewIncidentModalProps) {
  const { projects, userName } = useProject();

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    defaultProjectId || (projects[0]?.id ?? "p-1")
  );
  const [unit, setUnit] = useState<string>(defaultUnit || "");
  const [unitSearchQuery, setUnitSearchQuery] = useState<string>(defaultUnit || "");
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState<boolean>(false);
  const unitDropdownRef = useRef<HTMLDivElement>(null);

  const [clientName, setClientName] = useState<string>("");
  const [clientEmail, setClientEmail] = useState<string>("");
  const [clientPhone, setClientPhone] = useState<string>("");
  const [hasCoOwners, setHasCoOwners] = useState<boolean>(false);
  const [coOwnersList, setCoOwnersList] = useState<Array<{ name: string; pct: number }>>([]);
  const [coOwnerName, setCoOwnerName] = useState<string>("");
  const [coOwnerPct, setCoOwnerPct] = useState<number>(50);

  const [category, setCategory] = useState<PostventaCategory>("Plomería / Hidráulico");
  const [priority, setPriority] = useState<PostventaPriority>("Media");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [supplierId, setSupplierId] = useState<string>("");
  const [assignedStaff, setAssignedStaff] = useState<string>("");
  const [assignedStaffRole, setAssignedStaffRole] = useState<string>("Coordinador de Postventa");
  const [availableStaff, setAvailableStaff] = useState<Array<{ name: string; role: string; email?: string }>>([]);
  const [uploadedFiles, setUploadedFiles] = useState<DevioUploadedFile[]>([]);

  // Auto-folio generation
  const [folio, setFolio] = useState<string>("");

  const currentProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || projects[0];
  }, [projects, selectedProjectId]);

  // Load sold units for the selected project
  const soldUnitsList = useMemo(() => {
    if (!currentProject || !Array.isArray(currentProject.unitsInventory)) return [];
    return currentProject.unitsInventory.filter(
      (u: any) => u.status === "VENDIDA" || u.status === "ENTREGADA" || u.client
    );
  }, [currentProject]);

  // Filter sold units by search query
  const filteredUnits = useMemo(() => {
    if (!unitSearchQuery.trim()) return soldUnitsList;
    const q = unitSearchQuery.toLowerCase().trim();
    return soldUnitsList.filter((u: any) => {
      const matchUnit = (u.unit || "").toLowerCase().includes(q);
      const matchClient = (u.client || "").toLowerCase().includes(q);
      const matchType = (u.type || "").toLowerCase().includes(q);
      return matchUnit || matchClient || matchType;
    });
  }, [soldUnitsList, unitSearchQuery]);

  // Load real internal staff
  useEffect(() => {
    const list: Array<{ name: string; role: string; email?: string }> = [];

    if (currentProject && Array.isArray(currentProject.team)) {
      currentProject.team
        .filter(
          (m: any) =>
            m.assigned !== false &&
            m.role &&
            m.role.toUpperCase() !== "CLIENT" &&
            m.role.toUpperCase() !== "CLIENTE"
        )
        .forEach((m: any) => {
          list.push({
            name: m.name,
            role: m.role || "Equipo de Proyecto",
            email: m.email,
          });
        });
    }

    if (typeof window !== "undefined") {
      const stored =
        localStorage.getItem("devio_system_users") ||
        sessionStorage.getItem("devio_system_users");
      if (stored) {
        try {
          const sysUsers: any[] = JSON.parse(stored);
          sysUsers
            .filter(
              (u) =>
                u.role &&
                u.role.toUpperCase() !== "CLIENT" &&
                u.role.toUpperCase() !== "CLIENTE"
            )
            .forEach((u) => {
              if (
                !list.some(
                  (existing) =>
                    existing.email?.toLowerCase() === u.email?.toLowerCase() ||
                    existing.name === u.name
                )
              ) {
                list.push({
                  name: u.name,
                  role: u.role || "Usuario del Sistema",
                  email: u.email,
                });
              }
            });
        } catch (_) {}
      }
    }

    if (list.length === 0) {
      list.push({
        name: userName || "Alejandro Calderón",
        role: "Coordinador de Postventa",
      });
    }

    setAvailableStaff(list);
    if (!assignedStaff && list[0]) {
      setAssignedStaff(list[0].name);
      setAssignedStaffRole(list[0].role);
    }
  }, [currentProject, userName, assignedStaff]);

  // Initialize modal state
  useEffect(() => {
    if (isOpen) {
      const randomNum = Math.floor(Math.random() * 900) + 100;
      setFolio(`INC-2026-${randomNum}`);
      if (defaultProjectId) {
        setSelectedProjectId(defaultProjectId);
      }
      if (defaultUnit) {
        setUnit(defaultUnit);
        setUnitSearchQuery(defaultUnit);
      }
    }
  }, [isOpen, defaultProjectId, defaultUnit]);

  // Close unit dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        unitDropdownRef.current &&
        !unitDropdownRef.current.contains(event.target as Node)
      ) {
        setIsUnitDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // When a unit is selected, populate client info
  const handleSelectUnit = (matchedUnit: any) => {
    setUnit(matchedUnit.unit);
    setUnitSearchQuery(matchedUnit.unit);
    setIsUnitDropdownOpen(false);

    if (matchedUnit.client) {
      setClientName(matchedUnit.client);
    }
    if (matchedUnit.clientEmail || matchedUnit.buyerEmail) {
      setClientEmail(matchedUnit.clientEmail || matchedUnit.buyerEmail);
    }
    if (matchedUnit.clientPhone || matchedUnit.buyerPhone) {
      setClientPhone(matchedUnit.clientPhone || matchedUnit.buyerPhone);
    }

    if (
      matchedUnit.coOwners &&
      Array.isArray(matchedUnit.coOwners) &&
      matchedUnit.coOwners.length > 0
    ) {
      setHasCoOwners(true);
      setCoOwnersList(
        matchedUnit.coOwners.map((c: any) => ({
          name: c.name || "",
          pct: c.ownershipPct || c.percentage || c.pct || 50,
        }))
      );
      setCoOwnerName(matchedUnit.coOwners[0]?.name || "");
      setCoOwnerPct(
        (matchedUnit.coOwners[0] as any)?.ownershipPct ||
          (matchedUnit.coOwners[0] as any)?.percentage ||
          50
      );
    } else {
      setHasCoOwners(false);
      setCoOwnersList([]);
      setCoOwnerName("");
      setCoOwnerPct(50);
    }
  };

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
    if (!unit.trim()) {
      alert("Por favor selecciona o ingresa la unidad correspondiente.");
      return;
    }
    if (!title.trim() || !description.trim()) {
      alert("Por favor completa el título y la descripción del reporte.");
      return;
    }

    const matchedSupplier = POSTVENTA_SUPPLIERS.find((s) => s.id === supplierId);

    const now = new Date();
    const formattedDate = `${now.getDate()} ${now.toLocaleString("es-MX", {
      month: "short",
    })} ${now.getFullYear()} ${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    const newIncident: PostventaIncident = {
      id: `inc-${Date.now()}`,
      folio: folio || `INC-2026-${Math.floor(Math.random() * 900) + 100}`,
      projectId: selectedProjectId,
      projectName: currentProject?.name || "Desarrollo",
      unit: unit.trim().toUpperCase(),
      clientName: clientName.trim() || "Cliente Propietario",
      clientEmail: clientEmail.trim() || "cliente@devio.mx",
      clientPhone: clientPhone.trim() || "",
      coOwners: hasCoOwners
        ? coOwnersList.length > 0
          ? coOwnersList
          : coOwnerName.trim()
          ? [{ name: coOwnerName.trim(), pct: coOwnerPct }]
          : []
        : [],
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
        id: "usr-postventa",
        name: assignedStaff || "Alejandro Calderón",
        role: assignedStaffRole || "Coordinador de Postventa",
      },
      supplier: matchedSupplier,
      appointments: [],
      evidences: uploadedFiles.map((f, idx) => ({
        id: `ev-new-${idx}-${Date.now()}`,
        type: "INITIAL_DEFECT",
        url: f.url,
        title: f.name,
        uploadDate: formattedDate,
        uploadedBy: assignedStaff || "Mesa de Ayuda",
      })),
      comments: [
        {
          id: `comm-${Date.now()}`,
          timestamp: formattedDate,
          authorName: assignedStaff || "Mesa de Ayuda",
          authorRole: "Postventa",
          isInternalOnly: true,
          message: `Ticket levantado en plataforma con SLA inicial de ${slaHours} horas.`,
        },
      ],
      logs: [
        {
          id: `log-${Date.now()}`,
          timestamp: formattedDate,
          authorName: assignedStaff || "Mesa de Ayuda",
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
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
          overflow: "hidden",
          border: "1px solid #E2E8F0",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.25rem 1.75rem",
            borderBottom: "1px solid #EAEFF5",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#F8FAFC",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                backgroundColor: "rgba(47, 128, 237, 0.1)",
                color: "#2F80ED",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Wrench size={22} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <h3
                  style={{
                    fontSize: "1.15rem",
                    fontWeight: 800,
                    color: "#1F3652",
                    margin: 0,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Nueva Incidencia de Postventa
                </h3>
                <span
                  style={{
                    backgroundColor: "#1B3047",
                    color: "#FFFFFF",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    padding: "0.2rem 0.65rem",
                    borderRadius: "9999px",
                  }}
                >
                  {folio}
                </span>
              </div>
              <p
                style={{
                  fontSize: "0.82rem",
                  color: "#64748B",
                  margin: "0.2rem 0 0 0",
                }}
              >
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
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            overflowY: "auto",
            flex: 1,
            padding: "1.5rem 1.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          {/* Static Project Banner */}
          <div
            style={{
              backgroundColor: "rgba(31, 54, 82, 0.04)",
              border: "1px solid #E2E8F0",
              borderRadius: "0.75rem",
              padding: "0.75rem 1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <Building2 size={18} color="#1F3652" />
              <div>
                <span style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 600, display: "block" }}>
                  Desarrollo Activo
                </span>
                <span style={{ fontSize: "0.92rem", fontWeight: 800, color: "#1F3652" }}>
                  {currentProject?.name || "Proyecto"}
                </span>
              </div>
            </div>
            <span
              style={{
                backgroundColor: "rgba(47, 128, 237, 0.1)",
                color: "#2F80ED",
                fontSize: "0.72rem",
                fontWeight: 700,
                padding: "0.25rem 0.65rem",
                borderRadius: "9999px",
              }}
            >
              Módulo Postventa
            </span>
          </div>

          {/* 1. Ubicación y Cliente */}
          <div
            style={{
              backgroundColor: "#FAFBFD",
              padding: "1.15rem",
              borderRadius: "0.85rem",
              border: "1px solid #EAEFF5",
            }}
          >
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 800,
                color: "#2F80ED",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                display: "block",
                marginBottom: "0.85rem",
              }}
            >
              1. Selección de Unidad y Propietario
            </span>

            {/* Searchable Unit Input with Dropdown Popover */}
            <div style={{ position: "relative", marginBottom: "0.9rem" }} ref={unitDropdownRef}>
              <label
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "#1F3652",
                  display: "block",
                  marginBottom: "0.35rem",
                }}
              >
                Unidad Vendida / Asignada *
              </label>
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <input
                  type="text"
                  value={unitSearchQuery}
                  onChange={(e) => {
                    setUnitSearchQuery(e.target.value);
                    setUnit(e.target.value);
                    setIsUnitDropdownOpen(true);
                  }}
                  onFocus={() => setIsUnitDropdownOpen(true)}
                  placeholder="Escribe el número de unidad o nombre del cliente..."
                  required
                  style={{
                    width: "100%",
                    padding: "0.6rem 2.2rem 0.6rem 0.85rem",
                    borderRadius: "0.55rem",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: "#1F3652",
                    backgroundColor: "#FFFFFF",
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setIsUnitDropdownOpen(!isUnitDropdownOpen)}
                  style={{
                    position: "absolute",
                    right: "0.6rem",
                    border: "none",
                    background: "none",
                    color: "#64748B",
                    cursor: "pointer",
                    padding: "0.2rem",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <ChevronDown size={18} />
                </button>
              </div>

              {/* Dropdown Options */}
              {isUnitDropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    marginTop: "0.35rem",
                    backgroundColor: "#FFFFFF",
                    borderRadius: "0.65rem",
                    border: "1px solid #CBD5E1",
                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.12)",
                    maxHeight: "220px",
                    overflowY: "auto",
                    zIndex: 100,
                  }}
                >
                  {filteredUnits.length === 0 ? (
                    <div
                      style={{
                        padding: "0.85rem 1rem",
                        fontSize: "0.8rem",
                        color: "#64748B",
                        textAlign: "center",
                      }}
                    >
                      No se encontraron unidades vendidas que coincidan con la búsqueda.
                    </div>
                  ) : (
                    filteredUnits.map((u: any) => {
                      const isSelected =
                        unit.toLowerCase().trim() === (u.unit || "").toLowerCase().trim();
                      return (
                        <div
                          key={u.unit || u.id}
                          onClick={() => handleSelectUnit(u)}
                          style={{
                            padding: "0.65rem 0.95rem",
                            borderBottom: "1px solid #F1F5F9",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            cursor: "pointer",
                            backgroundColor: isSelected ? "rgba(47, 128, 237, 0.08)" : "#FFFFFF",
                            transition: "background 0.12s",
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = "#F8FAFC";
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = "#FFFFFF";
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                            <span
                              style={{
                                fontWeight: 800,
                                fontSize: "0.88rem",
                                color: "#1F3652",
                                minWidth: "45px",
                              }}
                            >
                              {u.unit}
                            </span>
                            <div>
                              <div
                                style={{
                                  fontSize: "0.8rem",
                                  fontWeight: 600,
                                  color: "#334155",
                                }}
                              >
                                {u.client || "Sin cliente registrado"}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.7rem",
                                  color: "#64748B",
                                }}
                              >
                                Tipo: {u.type || "Unidad"} • {u.status || "VENDIDA"}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            {u.coOwners && u.coOwners.length > 0 && (
                              <span
                                style={{
                                  fontSize: "0.68rem",
                                  backgroundColor: "rgba(47, 128, 237, 0.1)",
                                  color: "#2F80ED",
                                  fontWeight: 700,
                                  padding: "0.15rem 0.45rem",
                                  borderRadius: "4px",
                                }}
                              >
                                Copropiedad ({u.coOwners.length + 1})
                              </span>
                            )}
                            {isSelected && <Check size={16} color="#2F80ED" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Ownership Status Badge */}
            <div style={{ marginBottom: "0.85rem" }}>
              {hasCoOwners ? (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.3rem 0.65rem",
                    borderRadius: "9999px",
                    backgroundColor: "rgba(47, 128, 237, 0.1)",
                    color: "#2F80ED",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                  }}
                >
                  <Users size={14} /> Copropiedad ({coOwnersList.length > 0 ? coOwnersList.length + 1 : 2} Titulares)
                </div>
              ) : (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.3rem 0.65rem",
                    borderRadius: "9999px",
                    backgroundColor: "rgba(0, 196, 140, 0.1)",
                    color: "#059669",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                  }}
                >
                  <User size={14} /> Propietario Único (100%)
                </div>
              )}
            </div>

            {/* Cliente y Datos de Contacto */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 1fr 1fr",
                gap: "0.75rem",
                marginBottom: "0.75rem",
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#1F3652",
                    display: "block",
                    marginBottom: "0.25rem",
                  }}
                >
                  Nombre del Propietario *
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Nombre y Apellidos"
                  required
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.65rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.82rem",
                    color: "#1F3652",
                    backgroundColor: "#FFFFFF",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#1F3652",
                    display: "block",
                    marginBottom: "0.25rem",
                  }}
                >
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.65rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.82rem",
                    color: "#1F3652",
                    backgroundColor: "#FFFFFF",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#1F3652",
                    display: "block",
                    marginBottom: "0.25rem",
                  }}
                >
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
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  color: "#1F3652",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={hasCoOwners}
                  onChange={(e) => setHasCoOwners(e.target.checked)}
                  style={{ accentColor: "#1B3047" }}
                />
                Registrar Copropietario(s) vinculados a la unidad
              </label>

              {hasCoOwners && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 100px",
                    gap: "0.75rem",
                    marginTop: "0.5rem",
                    padding: "0.6rem 0.85rem",
                    backgroundColor: "#FFFFFF",
                    borderRadius: "0.5rem",
                    border: "1px solid #E2E8F0",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "0.72rem", color: "#64748B", display: "block" }}>
                      Nombre de Copropietario
                    </span>
                    <input
                      type="text"
                      value={coOwnerName}
                      onChange={(e) => setCoOwnerName(e.target.value)}
                      placeholder="Ej. Carlos Calderón"
                      style={{
                        width: "100%",
                        border: "none",
                        outline: "none",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        color: "#1F3652",
                      }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: "0.72rem", color: "#64748B", display: "block" }}>
                      % Propiedad
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={coOwnerPct}
                      onChange={(e) => setCoOwnerPct(Number(e.target.value))}
                      style={{
                        width: "100%",
                        border: "none",
                        outline: "none",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        color: "#1F3652",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. Categoría, Prioridad y SLA */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr 1fr",
              gap: "1rem",
            }}
          >
            <div>
              <label
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "#1F3652",
                  display: "block",
                  marginBottom: "0.35rem",
                }}
              >
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
                  color: "#1F3652",
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
              <label
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "#1F3652",
                  display: "block",
                  marginBottom: "0.35rem",
                }}
              >
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
                      ? "#DC2626"
                      : priority === "Alta"
                      ? "#EA580C"
                      : priority === "Media"
                      ? "#2F80ED"
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
              <label
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "#1F3652",
                  display: "block",
                  marginBottom: "0.35rem",
                }}
              >
                SLA Comprometido
              </label>
              <div
                style={{
                  padding: "0.55rem 0.75rem",
                  borderRadius: "0.5rem",
                  backgroundColor: "rgba(47, 128, 237, 0.08)",
                  border: "1px solid rgba(47, 128, 237, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  color: "#1F3652",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                }}
              >
                <Clock size={16} color="#2F80ED" />
                <span>{slaHours} Horas máx.</span>
              </div>
            </div>
          </div>

          {/* 3. Título y Descripción del Defecto */}
          <div>
            <label
              style={{
                fontSize: "0.8rem",
                fontWeight: 700,
                color: "#1F3652",
                display: "block",
                marginBottom: "0.35rem",
              }}
            >
              Título de la Incidencia *
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
                color: "#1F3652",
                fontWeight: 600,
                outline: "none",
              }}
            />
          </div>

          <div>
            <label
              style={{
                fontSize: "0.8rem",
                fontWeight: 700,
                color: "#1F3652",
                display: "block",
                marginBottom: "0.35rem",
              }}
            >
              Descripción Detallada del Defecto *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Indica la ubicación exacta dentro del departamento, síntomas observados y afectaciones secundarias..."
              required
              style={{
                width: "100%",
                padding: "0.6rem 0.85rem",
                borderRadius: "0.5rem",
                border: "1px solid #CBD5E1",
                fontSize: "0.85rem",
                color: "#1F3652",
                outline: "none",
                resize: "vertical",
              }}
            />
          </div>

          {/* 4. Responsable Interno */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "#1F3652",
                  display: "block",
                  marginBottom: "0.35rem",
                }}
              >
                Responsable Interno Asignado
              </label>
              <select
                value={assignedStaff}
                onChange={(e) => {
                  const staffName = e.target.value;
                  setAssignedStaff(staffName);
                  const matched = availableStaff.find((s) => s.name === staffName);
                  if (matched) {
                    setAssignedStaffRole(matched.role);
                  }
                }}
                style={{
                  width: "100%",
                  padding: "0.55rem 0.75rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #CBD5E1",
                  fontSize: "0.82rem",
                  color: "#1F3652",
                  backgroundColor: "#FFFFFF",
                }}
              >
                {availableStaff.map((s, idx) => (
                  <option key={`${s.name}-${idx}`} value={s.name}>
                    {s.name} ({s.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "#1F3652",
                  display: "block",
                  marginBottom: "0.35rem",
                }}
              >
                Proveedor / Contratista (Opcional)
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
                  color: "#1F3652",
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

          {/* 5. Evidencias Iniciales */}
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

          {/* Footer Actions */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: "0.75rem",
              marginTop: "0.5rem",
              paddingTop: "1.25rem",
              borderTop: "1px solid #EAEFF5",
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
