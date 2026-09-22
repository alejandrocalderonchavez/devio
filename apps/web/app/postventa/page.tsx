"use client";

import React, { useState, useMemo } from "react";
import AppLayout from "../../components/layout/app-layout";
import {
  Wrench,
  Plus,
  Search,
  FileSpreadsheet,
  Printer,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Star,
  ArrowUpDown,
  Filter,
  Eye,
  Building,
  User,
  Truck,
  ShieldAlert,
} from "lucide-react";
import {
  PostventaIncident,
  PostventaStatus,
  PostventaPriority,
  PostventaCategory,
  INITIAL_INCIDENTS,
} from "../../data/postventa-data";
import { useProject } from "../../context/project-context";
import { exportTableToExcel, exportTableToPDF } from "../../lib/export-utils";
import { NewIncidentModal } from "../../components/postventa/new-incident-modal";
import { IncidentDetailDrawer } from "../../components/postventa/incident-detail-drawer";

export default function PostventaPage() {
  const { projects, postventaIncidents, addPostventaIncident, updatePostventaIncident, hasPermission } = useProject();
  const incidents = postventaIncidents;

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Sorting
  const [sortField, setSortField] = useState<keyof PostventaIncident>("createdAt");
  const [sortAsc, setSortAsc] = useState(false);

  // Modals & Drawer State
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<PostventaIncident | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // KPI calculations
  const kpis = useMemo(() => {
    const total = incidents.length;
    const openCases = incidents.filter(
      (i) => i.status !== "Cerrada" && i.status !== "Resuelta"
    ).length;
    const expiredCases = incidents.filter((i) => i.slaExpired).length;
    const reopenedCases = incidents.filter((i) => i.isReopened).length;

    // Calculate avg CSAT
    const ratedIncidents = incidents.filter((i) => i.csat && i.csat.rating);
    const avgCsat =
      ratedIncidents.length > 0
        ? (
            ratedIncidents.reduce((sum, i) => sum + (i.csat?.rating || 0), 0) /
            ratedIncidents.length
          ).toFixed(1)
        : "-";

    return {
      openCases,
      firstResponseTime: total > 0 ? "45 min" : "-",
      avgResolutionTime: total > 0 ? "2.4 días" : "-",
      expiredCases,
      avgCsat,
      reopenedCases,
    };
  }, [incidents]);

  // Filtered & Sorted Incidents
  const filteredIncidents = useMemo(() => {
    return incidents
      .filter((inc) => {
        // Project filter
        if (selectedProject !== "ALL" && inc.projectId !== selectedProject) return false;
        // Status filter
        if (selectedStatus !== "ALL" && inc.status !== selectedStatus) return false;
        // Priority filter
        if (selectedPriority !== "ALL" && inc.priority !== selectedPriority) return false;
        // Category filter
        if (selectedCategory !== "ALL" && inc.category !== selectedCategory) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchFolio = inc.folio.toLowerCase().includes(q);
          const matchClient = inc.clientName.toLowerCase().includes(q);
          const matchUnit = inc.unit.toLowerCase().includes(q);
          const matchTitle = inc.title.toLowerCase().includes(q);
          const matchSupplier = inc.supplier?.name.toLowerCase().includes(q) ?? false;
          if (!matchFolio && !matchClient && !matchUnit && !matchTitle && !matchSupplier) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        if (typeof valA === "string" && typeof valB === "string") {
          return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        if (typeof valA === "number" && typeof valB === "number") {
          return sortAsc ? valA - valB : valB - valA;
        }
        return 0;
      });
  }, [
    incidents,
    selectedProject,
    selectedStatus,
    selectedPriority,
    selectedCategory,
    searchQuery,
    sortField,
    sortAsc,
  ]);

  const handleSort = (field: keyof PostventaIncident) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Add new incident
  const handleSaveNewIncident = (newInc: PostventaIncident) => {
    addPostventaIncident(newInc);
    setSelectedIncident(newInc);
    setIsDrawerOpen(true);
  };

  // Update existing incident
  const handleUpdateIncident = (updated: PostventaIncident) => {
    updatePostventaIncident(updated);
    setSelectedIncident(updated);
  };

  // Status Badge Helper
  const getStatusPill = (status: PostventaStatus) => {
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

  const getPriorityPill = (p: PostventaPriority) => {
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

  // Export handlers
  const handleExportExcel = () => {
    const data = filteredIncidents.map((inc) => ({
      Folio: inc.folio,
      Proyecto: inc.projectName,
      Unidad: inc.unit,
      Cliente: inc.clientName,
      Teléfono: inc.clientPhone,
      Copropietarios: inc.coOwners?.map((c) => `${c.name} (${c.pct}%)`).join(", ") || "N/A",
      Categoría: inc.category,
      Prioridad: inc.priority,
      Estado: inc.status,
      Título: inc.title,
      "SLA Horas": inc.slaHours,
      Proveedor: inc.supplier?.name || "Sin asignar",
      "Fecha Creación": inc.createdAt,
      "Última Actualización": inc.updatedAt,
      "CSAT Calificación": inc.csat?.rating ? `${inc.csat.rating} / 5` : "Pendiente",
    }));

    exportTableToExcel(data, "Devio_Reporte_Postventa_Incidencias");
  };

  const handleExportPDF = () => {
    const headers = [
      "Folio",
      "Desarrollo",
      "Unidad",
      "Cliente",
      "Categoría",
      "Prioridad",
      "Estado",
      "Proveedor",
      "SLA",
      "Fecha",
    ];

    const rows = filteredIncidents.map((inc) => [
      inc.folio,
      inc.projectName,
      inc.unit,
      inc.clientName,
      inc.category,
      inc.priority,
      inc.status,
      inc.supplier?.name || "Sin asignar",
      `${inc.slaHours}h (${inc.slaExpired ? "Vencido" : "En tiempo"})`,
      inc.createdAt,
    ]);

    const summary = `Total Incidencias: ${filteredIncidents.length} | Casos Abiertos: ${kpis.openCases} | Satisfacción CSAT: ${kpis.avgCsat} ★`;

    exportTableToPDF(
      "Reporte Ejecutivo de Incidencias y Garantías (Postventa)",
      "Todos los Desarrollos",
      headers,
      rows,
      summary
    );
  };

  if (!hasPermission("postventa.view")) {
    return (
      <AppLayout>
        <main style={{ padding: "3rem 2rem", flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1.25rem", padding: "3rem", textAlign: "center", maxWidth: "480px", border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "#FEF2F2", color: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem auto" }}>
              <ShieldAlert size={28} />
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1F3652", marginBottom: "0.5rem" }}>Acceso Restringido</h2>
            <p style={{ fontSize: "0.88rem", color: "#64748B", lineHeight: 1.5, margin: 0 }}>
              Tu perfil de usuario no cuenta con permisos para ver el módulo de Postventa e Incidencias. Contacta a un administrador si requieres acceso.
            </p>
          </div>
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          padding: "1.25rem 2rem 2.5rem 2rem",
          gap: "1.5rem",
        }}
      >
        {/* Top Header & Action Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "10px",
                  backgroundColor: "#1B3047",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Wrench size={20} />
              </div>
              <h1
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  color: "#1B3047",
                  margin: 0,
                  letterSpacing: "-0.02em",
                }}
              >
                Postventa & Back Office de Incidencias
              </h1>
            </div>
            <p style={{ fontSize: "0.85rem", color: "#64748B", margin: "0.35rem 0 0 0" }}>
              Administra la postventa de principio a fin: recepción de reportes, control de contratistas, citas, SLA y CSAT.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            {hasPermission("postventa.view") && (
              <>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    backgroundColor: "#FFFFFF",
                    color: "#1B3047",
                    padding: "0.55rem 1.15rem",
                    borderRadius: "9999px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                >
                  <FileSpreadsheet size={15} color="#059669" /> Exportar Excel
                </button>

                <button
                  type="button"
                  onClick={handleExportPDF}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    backgroundColor: "#FFFFFF",
                    color: "#1B3047",
                    padding: "0.55rem 1.15rem",
                    borderRadius: "9999px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                >
                  <Printer size={15} color="#2563EB" /> Exportar PDF
                </button>
              </>
            )}

            {hasPermission("postventa.manage") && (
              <button
                type="button"
                onClick={() => setIsNewModalOpen(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  backgroundColor: "#1B3047",
                  color: "#FFFFFF",
                  padding: "0.55rem 1.35rem",
                  borderRadius: "9999px",
                  border: "none",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(27, 48, 71, 0.2)",
                }}
              >
                <Plus size={16} /> Nueva Incidencia
              </button>
            )}
          </div>
        </div>

        {/* 6 Indicadores Clave de Postventa */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            gap: "1rem",
          }}
        >
          {/* KPI 1: Incidencias abiertas */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "0.85rem",
              padding: "1rem 1.15rem",
              border: "1px solid #E2E8F0",
              boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
            }}
          >
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748B", display: "block" }}>
              Incidencias Abiertas
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", marginTop: "0.35rem" }}>
              <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1E293B" }}>
                {kpis.openCases}
              </span>
              <span style={{ fontSize: "0.72rem", color: "#64748B" }}>en proceso</span>
            </div>
          </div>

          {/* KPI 2: 1ra Respuesta */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "0.85rem",
              padding: "1rem 1.15rem",
              border: "1px solid #E2E8F0",
              boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
            }}
          >
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748B", display: "block" }}>
              1ra Respuesta Promedio
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", marginTop: "0.35rem" }}>
              <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#2563EB" }}>
                {kpis.firstResponseTime}
              </span>
            </div>
          </div>

          {/* KPI 3: Tiempo de Resolución */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "0.85rem",
              padding: "1rem 1.15rem",
              border: "1px solid #E2E8F0",
              boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
            }}
          >
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748B", display: "block" }}>
              Tiempo de Resolución
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", marginTop: "0.35rem" }}>
              <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#00C48C" }}>
                {kpis.avgResolutionTime}
              </span>
            </div>
          </div>

          {/* KPI 4: Casos Vencidos */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "0.85rem",
              padding: "1rem 1.15rem",
              border: "1px solid #E2E8F0",
              boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
            }}
          >
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748B", display: "block" }}>
              Casos Vencidos (SLA)
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", marginTop: "0.35rem" }}>
              <span
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  color: kpis.expiredCases > 0 ? "#DC2626" : "#059669",
                }}
              >
                {kpis.expiredCases}
              </span>
              <span style={{ fontSize: "0.72rem", color: "#64748B" }}>
                {kpis.expiredCases === 0 ? "100% en tiempo" : "requieren atención"}
              </span>
            </div>
          </div>

          {/* KPI 5: Satisfacción CSAT */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "0.85rem",
              padding: "1rem 1.15rem",
              border: "1px solid #E2E8F0",
              boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
            }}
          >
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748B", display: "block" }}>
              Satisfacción CSAT
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.35rem" }}>
              <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1E293B" }}>
                {kpis.avgCsat}
              </span>
              <div style={{ display: "flex", color: "#EAB308" }}>
                <Star size={16} style={{ fill: "#EAB308" }} />
              </div>
              <span style={{ fontSize: "0.72rem", color: "#64748B" }}>/ 5.0</span>
            </div>
          </div>

          {/* KPI 6: Reincidencias */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "0.85rem",
              padding: "1rem 1.15rem",
              border: "1px solid #E2E8F0",
              boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
            }}
          >
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748B", display: "block" }}>
              Reincidencias / Reabiertas
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", marginTop: "0.35rem" }}>
              <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#EA580C" }}>
                {kpis.reopenedCases}
              </span>
              <span style={{ fontSize: "0.72rem", color: "#64748B" }}>en garantía</span>
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            padding: "1rem 1.25rem",
            borderRadius: "0.85rem",
            border: "1px solid #E2E8F0",
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Search bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              backgroundColor: "#F8FAFC",
              border: "1px solid #CBD5E1",
              borderRadius: "0.6rem",
              padding: "0.45rem 0.85rem",
              minWidth: "280px",
              flex: 1,
            }}
          >
            <Search size={16} style={{ color: "#94A3B8" }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por folio, cliente, unidad o defecto..."
              style={{
                border: "none",
                backgroundColor: "transparent",
                outline: "none",
                fontSize: "0.82rem",
                width: "100%",
                color: "#1E293B",
              }}
            />
          </div>

          {/* Filters Group */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
            {/* Filter: Project */}
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              style={{
                padding: "0.45rem 0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid #CBD5E1",
                fontSize: "0.8rem",
                color: "#475569",
                backgroundColor: "#FFFFFF",
                outline: "none",
              }}
            >
              <option value="ALL">Todos los Proyectos</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Filter: Status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                padding: "0.45rem 0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid #CBD5E1",
                fontSize: "0.8rem",
                color: "#475569",
                backgroundColor: "#FFFFFF",
                outline: "none",
              }}
            >
              <option value="ALL">Todos los Estados (9)</option>
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

            {/* Filter: Priority */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              style={{
                padding: "0.45rem 0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid #CBD5E1",
                fontSize: "0.8rem",
                color: "#475569",
                backgroundColor: "#FFFFFF",
                outline: "none",
              }}
            >
              <option value="ALL">Todas las Prioridades</option>
              <option value="Urgente">Urgente</option>
              <option value="Alta">Alta</option>
              <option value="Media">Media</option>
              <option value="Baja">Baja</option>
            </select>

            {/* Filter: Category */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: "0.45rem 0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid #CBD5E1",
                fontSize: "0.8rem",
                color: "#475569",
                backgroundColor: "#FFFFFF",
                outline: "none",
              }}
            >
              <option value="ALL">Todas las Categorías</option>
              <option value="Plomería / Hidráulico">Plomería / Hidráulico</option>
              <option value="Eléctrico">Eléctrico</option>
              <option value="Acabados / Pintura">Acabados / Pintura</option>
              <option value="Carpintería">Carpintería</option>
              <option value="Cancelaría / Vidrio">Cancelaría / Vidrio</option>
              <option value="Aire Acondicionado / HVAC">Aire Acondicionado / HVAC</option>
              <option value="Impermeabilización / Humedad">Impermeabilización / Humedad</option>
              <option value="Estructural / Albañilería">Estructural / Albañilería</option>
              <option value="Cerrajería / Seguridad">Cerrajería / Seguridad</option>
            </select>
          </div>
        </div>

        {/* Master Table */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "0.85rem",
            border: "1px solid #E2E8F0",
            boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
            overflow: "hidden",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#475569" }}>
                  <th
                    onClick={() => handleSort("folio")}
                    style={{ padding: "0.85rem 1rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      Folio <ArrowUpDown size={12} color="#94A3B8" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("projectName")}
                    style={{ padding: "0.85rem 1rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      Desarrollo / Unidad <ArrowUpDown size={12} color="#94A3B8" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("clientName")}
                    style={{ padding: "0.85rem 1rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      Cliente / Propietario <ArrowUpDown size={12} color="#94A3B8" />
                    </div>
                  </th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                    Categoría & Falla
                  </th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                    Prioridad
                  </th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                    Estado del Ciclo
                  </th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                    Proveedor Asignado
                  </th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                    SLA
                  </th>
                  <th
                    onClick={() => handleSort("createdAt")}
                    style={{ padding: "0.85rem 1rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      Reportado <ArrowUpDown size={12} color="#94A3B8" />
                    </div>
                  </th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 700, textAlign: "right", whiteSpace: "nowrap" }}>
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredIncidents.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ padding: "4rem 2rem", textAlign: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
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
                          <Wrench size={28} />
                        </div>
                        <h4 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--devio-blue-dark)", margin: "0 0 0.35rem 0" }}>
                          {searchQuery.trim() || selectedProject !== "ALL" || selectedStatus !== "ALL" || selectedPriority !== "ALL" || selectedCategory !== "ALL"
                            ? "No se encontraron incidencias"
                            : "No hay reportes de postventa"}
                        </h4>
                        <p style={{ fontSize: "0.85rem", color: "var(--devio-neutral-3)", maxWidth: "440px", margin: "0 0 1.25rem 0", lineHeight: 1.5 }}>
                          {searchQuery.trim() || selectedProject !== "ALL" || selectedStatus !== "ALL" || selectedPriority !== "ALL" || selectedCategory !== "ALL"
                            ? "No hay tickets que coincidan con los filtros seleccionados."
                            : "Registra incidencias de mantenimiento, garantías o vicios ocultos de cualquiera de tus desarrollos."}
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsNewModalOpen(true)}
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
                          <Plus size={16} /> Levantar Primer Reporte
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredIncidents.map((inc) => {
                    const statusPill = getStatusPill(inc.status);
                    const priorityPill = getPriorityPill(inc.priority);

                    return (
                      <tr
                        key={inc.id}
                        onClick={() => {
                          setSelectedIncident(inc);
                          setIsDrawerOpen(true);
                        }}
                        style={{
                          borderBottom: "1px solid #F1F5F9",
                          cursor: "pointer",
                          transition: "background-color 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        {/* Folio */}
                        <td style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1B3047", whiteSpace: "nowrap" }}>
                          {inc.folio}
                        </td>

                        {/* Desarrollo & Unidad */}
                        <td style={{ padding: "0.85rem 1rem", whiteSpace: "nowrap" }}>
                          <span style={{ fontWeight: 700, color: "#1E293B", display: "block" }}>
                            {inc.projectName}
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                            Unidad {inc.unit}
                          </span>
                        </td>

                        {/* Cliente */}
                        <td style={{ padding: "0.85rem 1rem" }}>
                          <span style={{ fontWeight: 600, color: "#1E293B", display: "block" }}>
                            {inc.clientName}
                          </span>
                          {inc.coOwners && inc.coOwners.length > 0 && inc.coOwners[0] ? (
                            <span style={{ fontSize: "0.7rem", color: "#2563EB", display: "block" }}>
                              +{inc.coOwners.length} copropietario ({inc.coOwners[0].pct}%)
                            </span>
                          ) : (
                            <span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>
                              {inc.clientPhone}
                            </span>
                          )}
                        </td>

                        {/* Categoría & Falla */}
                        <td style={{ padding: "0.85rem 1rem", maxWidth: "240px" }}>
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2F80ED", display: "block" }}>
                            {inc.category}
                          </span>
                          <span
                            style={{
                              fontSize: "0.78rem",
                              color: "#334155",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "block",
                            }}
                          >
                            {inc.title}
                          </span>
                        </td>

                        {/* Prioridad */}
                        <td style={{ padding: "0.85rem 1rem", whiteSpace: "nowrap" }}>
                          <span
                            style={{
                              backgroundColor: priorityPill.bg,
                              color: priorityPill.color,
                              padding: "0.2rem 0.55rem",
                              borderRadius: "9999px",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                            }}
                          >
                            {priorityPill.text}
                          </span>
                        </td>

                        {/* Estado */}
                        <td style={{ padding: "0.85rem 1rem", whiteSpace: "nowrap" }}>
                          <span
                            style={{
                              backgroundColor: statusPill.bg,
                              color: statusPill.color,
                              border: `1px solid ${statusPill.border}`,
                              padding: "0.25rem 0.65rem",
                              borderRadius: "9999px",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem",
                            }}
                          >
                            {inc.status}
                          </span>
                        </td>

                        {/* Proveedor */}
                        <td style={{ padding: "0.85rem 1rem", whiteSpace: "nowrap" }}>
                          <span style={{ fontSize: "0.78rem", fontWeight: 600, color: inc.supplier ? "#1E293B" : "#94A3B8" }}>
                            {inc.supplier?.name || "Pendiente"}
                          </span>
                        </td>

                        {/* SLA */}
                        <td style={{ padding: "0.85rem 1rem", whiteSpace: "nowrap" }}>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              color: inc.slaExpired ? "#DC2626" : "#059669",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.25rem",
                            }}
                          >
                            <Clock size={13} /> {inc.slaHours} hrs
                          </span>
                        </td>

                        {/* Reportado */}
                        <td style={{ padding: "0.85rem 1rem", color: "#64748B", fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                          {inc.createdAt}
                        </td>

                        {/* Acción */}
                        <td style={{ padding: "0.85rem 1rem", textAlign: "right", whiteSpace: "nowrap" }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedIncident(inc);
                              setIsDrawerOpen(true);
                            }}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem",
                              backgroundColor: "#F1F5F9",
                              color: "#1B3047",
                              border: "1px solid #CBD5E1",
                              padding: "0.35rem 0.75rem",
                              borderRadius: "9999px",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            <Eye size={13} /> Gestionar
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer Summary */}
          <div
            style={{
              padding: "0.75rem 1.25rem",
              borderTop: "1px solid #E2E8F0",
              backgroundColor: "#F8FAFC",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "0.78rem",
              color: "#64748B",
            }}
          >
            <span>
              Mostrando <strong>{filteredIncidents.length}</strong> de <strong>{incidents.length}</strong> incidencias
            </span>
            <span>Plataforma Devio Postventa v2.4</span>
          </div>
        </div>

        {/* Modal: New Incident */}
        <NewIncidentModal
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          onSave={handleSaveNewIncident}
        />

        {/* Drawer: Incident Detail Workspace */}
        <IncidentDetailDrawer
          incident={selectedIncident}
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onUpdateIncident={handleUpdateIncident}
        />
      </div>
    </AppLayout>
  );
}
