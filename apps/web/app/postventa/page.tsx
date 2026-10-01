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
  ShieldCheck,
  Check,
  ChevronRight,
  ExternalLink,
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
import { UnitDeliveryModal, DeliveryUnitData } from "../../components/postventa/unit-delivery-modal";

export default function PostventaPage() {
  const {
    projects,
    postventaIncidents,
    addPostventaIncident,
    updatePostventaIncident,
    markUnitAsDelivered,
    hasPermission,
  } = useProject();

  const incidents = postventaIncidents;

  // Main Tab: "incidents" vs "deliveries"
  const [mainTab, setMainTab] = useState<"incidents" | "deliveries">("incidents");

  // Filters for Incidents
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Sorting for Incidents
  const [sortField, setSortField] = useState<keyof PostventaIncident>("createdAt");
  const [sortAsc, setSortAsc] = useState(false);

  // Filters for Deliveries Tab
  const [deliverySearch, setDeliverySearch] = useState("");
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState<"ALL" | "DELIVERED" | "PENDING">("ALL");

  // Modals & Drawer State
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newIncidentDefaults, setNewIncidentDefaults] = useState<{ projectId?: string; unit?: string } | undefined>(undefined);
  const [selectedIncident, setSelectedIncident] = useState<PostventaIncident | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [deliveryModalUnit, setDeliveryModalUnit] = useState<DeliveryUnitData | null>(null);

  // Sold Units Aggregator
  const soldUnits = useMemo(() => {
    const list: Array<DeliveryUnitData & {
      price: number;
      saleDate: string;
      activeIncidentsCount: number;
      totalIncidentsCount: number;
    }> = [];

    projects.forEach((p) => {
      (p.unitsInventory || []).forEach((u: any) => {
        if (u.status === "VENDIDA") {
          const unitIncidents = incidents.filter(
            (inc) =>
              inc.projectId === p.id &&
              inc.unit.toLowerCase().trim() === u.unit.toLowerCase().trim()
          );
          const activeCount = unitIncidents.filter(
            (i) => i.status !== "Cerrada" && i.status !== "Resuelta"
          ).length;

          list.push({
            projectId: p.id,
            projectName: p.name,
            unitNumber: u.unit,
            unitType: u.type,
            clientName: u.client || "Cliente sin registrar",
            price: u.price,
            saleDate: u.saleDate || "-",
            isDelivered: Boolean(u.isDelivered),
            deliveredAt: u.deliveredAt,
            deliveryActUrl: u.deliveryActUrl,
            warrantyExpiresAt: u.warrantyExpiresAt,
            activeIncidentsCount: activeCount,
            totalIncidentsCount: unitIncidents.length,
          });
        }
      });
    });

    return list;
  }, [projects, incidents]);

  // Deliveries KPIs
  const deliveryKpis = useMemo(() => {
    const total = soldUnits.length;
    const delivered = soldUnits.filter((u) => u.isDelivered).length;
    const pending = total - delivered;
    const activeWithIssues = soldUnits.filter((u) => u.isDelivered && u.activeIncidentsCount > 0).length;
    const rate = total > 0 ? Math.round((delivered / total) * 100) : 0;
    return { total, delivered, pending, activeWithIssues, rate };
  }, [soldUnits]);

  // Filtered Sold Units
  const filteredSoldUnits = useMemo(() => {
    return soldUnits.filter((u) => {
      if (selectedProject !== "ALL" && u.projectId !== selectedProject) return false;
      if (deliveryStatusFilter === "DELIVERED" && !u.isDelivered) return false;
      if (deliveryStatusFilter === "PENDING" && u.isDelivered) return false;
      if (deliverySearch.trim()) {
        const q = deliverySearch.toLowerCase();
        const matchUnit = u.unitNumber.toLowerCase().includes(q);
        const matchClient = u.clientName.toLowerCase().includes(q);
        const matchProject = u.projectName.toLowerCase().includes(q);
        if (!matchUnit && !matchClient && !matchProject) return false;
      }
      return true;
    });
  }, [soldUnits, selectedProject, deliveryStatusFilter, deliverySearch]);

  // KPI calculations for Incidents
  const kpis = useMemo(() => {
    const total = incidents.length;
    const openCases = incidents.filter(
      (i) => i.status !== "Cerrada" && i.status !== "Resuelta"
    ).length;
    const expiredCases = incidents.filter((i) => i.slaExpired).length;
    const reopenedCases = incidents.filter((i) => i.isReopened).length;

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
        if (selectedProject !== "ALL" && inc.projectId !== selectedProject) return false;
        if (selectedStatus !== "ALL" && inc.status !== selectedStatus) return false;
        if (selectedPriority !== "ALL" && inc.priority !== selectedPriority) return false;
        if (selectedCategory !== "ALL" && inc.category !== selectedCategory) return false;

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

  const handleSaveNewIncident = (newInc: PostventaIncident) => {
    addPostventaIncident(newInc);
    setSelectedIncident(newInc);
    setIsDrawerOpen(true);
  };

  const handleUpdateIncident = (updated: PostventaIncident) => {
    updatePostventaIncident(updated);
    setSelectedIncident(updated);
  };

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
      Categoría: inc.category,
      Prioridad: inc.priority,
      Estado: inc.status,
      Proveedor: inc.supplier?.name || "Sin asignar",
      "Horas SLA": inc.slaHours,
      "SLA Vencido": inc.slaExpired ? "Sí" : "No",
      "Fecha Creación": inc.createdAt,
    }));
    exportTableToExcel(data, "Devio_Postventa_Incidencias");
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
          gap: "1.25rem",
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
                Postventa, Entregas & Garantías
              </h1>
            </div>
            <p style={{ fontSize: "0.85rem", color: "#64748B", margin: "0.35rem 0 0 0" }}>
              Administra la entrega de unidades, recepción de incidencias, asignación de responsables y chat en tiempo real con propietarios.
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
                onClick={() => {
                  setNewIncidentDefaults(undefined);
                  setIsNewModalOpen(true);
                }}
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

        {/* Tab Switcher: Incidencias vs Unidades Vendidas & Entregas */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            borderBottom: "2px solid #E2E8F0",
            paddingBottom: "0.15rem",
          }}
        >
          <button
            onClick={() => setMainTab("incidents")}
            style={{
              padding: "0.65rem 1.25rem",
              borderRadius: "0.6rem 0.6rem 0 0",
              border: "none",
              backgroundColor: mainTab === "incidents" ? "#1B3047" : "transparent",
              color: mainTab === "incidents" ? "#FFFFFF" : "#64748B",
              fontWeight: 700,
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <Wrench size={16} />
            <span>Incidencias & Reportes</span>
            <span
              style={{
                backgroundColor: mainTab === "incidents" ? "rgba(255,255,255,0.25)" : "#E2E8F0",
                color: mainTab === "incidents" ? "#FFFFFF" : "#475569",
                fontSize: "0.72rem",
                padding: "0.1rem 0.45rem",
                borderRadius: "999px",
                fontWeight: 800,
              }}
            >
              {incidents.length}
            </span>
          </button>

          <button
            onClick={() => setMainTab("deliveries")}
            style={{
              padding: "0.65rem 1.25rem",
              borderRadius: "0.6rem 0.6rem 0 0",
              border: "none",
              backgroundColor: mainTab === "deliveries" ? "#1B3047" : "transparent",
              color: mainTab === "deliveries" ? "#FFFFFF" : "#64748B",
              fontWeight: 700,
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <CheckCircle2 size={16} />
            <span>Unidades Vendidas & Entregas</span>
            <span
              style={{
                backgroundColor: mainTab === "deliveries" ? "rgba(255,255,255,0.25)" : "#E2E8F0",
                color: mainTab === "deliveries" ? "#FFFFFF" : "#475569",
                fontSize: "0.72rem",
                padding: "0.1rem 0.45rem",
                borderRadius: "999px",
                fontWeight: 800,
              }}
            >
              {soldUnits.length}
            </span>
          </button>
        </div>

        {/* TAB 1: INCIDENCIAS & REPORTES */}
        {mainTab === "incidents" && (
          <>
            {/* 6 Indicadores Clave de Postventa */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                gap: "1rem",
              }}
            >
              <div style={{ backgroundColor: "#FFFFFF", borderRadius: "0.85rem", padding: "1rem 1.15rem", border: "1px solid #E2E8F0", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
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

              <div style={{ backgroundColor: "#FFFFFF", borderRadius: "0.85rem", padding: "1rem 1.15rem", border: "1px solid #E2E8F0", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748B", display: "block" }}>
                  1ra Respuesta Promedio
                </span>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", marginTop: "0.35rem" }}>
                  <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#2563EB" }}>
                    {kpis.firstResponseTime}
                  </span>
                </div>
              </div>

              <div style={{ backgroundColor: "#FFFFFF", borderRadius: "0.85rem", padding: "1rem 1.15rem", border: "1px solid #E2E8F0", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748B", display: "block" }}>
                  Tiempo de Resolución
                </span>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", marginTop: "0.35rem" }}>
                  <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#00C48C" }}>
                    {kpis.avgResolutionTime}
                  </span>
                </div>
              </div>

              <div style={{ backgroundColor: "#FFFFFF", borderRadius: "0.85rem", padding: "1rem 1.15rem", border: "1px solid #E2E8F0", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748B", display: "block" }}>
                  Casos Vencidos (SLA)
                </span>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", marginTop: "0.35rem" }}>
                  <span style={{ fontSize: "1.5rem", fontWeight: 800, color: kpis.expiredCases > 0 ? "#DC2626" : "#059669" }}>
                    {kpis.expiredCases}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "#64748B" }}>
                    {kpis.expiredCases === 0 ? "100% en tiempo" : "requieren atención"}
                  </span>
                </div>
              </div>

              <div style={{ backgroundColor: "#FFFFFF", borderRadius: "0.85rem", padding: "1rem 1.15rem", border: "1px solid #E2E8F0", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
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

              <div style={{ backgroundColor: "#FFFFFF", borderRadius: "0.85rem", padding: "1rem 1.15rem", border: "1px solid #E2E8F0", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
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
                  placeholder="Buscar por folio, cliente, unidad o título..."
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

              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
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
                  <option value="ALL">Todos los Estados</option>
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
                  <option value="Plomería / Hidráulico">Plomería</option>
                  <option value="Eléctrico">Eléctrico</option>
                  <option value="Acabados / Pintura">Acabados</option>
                  <option value="Carpintería">Carpintería</option>
                  <option value="Cancelaría / Vidrio">Cancelaría</option>
                  <option value="Aire Acondicionado / HVAC">Climas</option>
                  <option value="Impermeabilización / Humedad">Humedad</option>
                </select>
              </div>
            </div>

            {/* Incidents Table */}
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
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", fontSize: "0.75rem", color: "#64748B", textTransform: "uppercase" }}>
                      <th style={{ padding: "0.85rem 1rem", cursor: "pointer" }} onClick={() => handleSort("folio")}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          Folio <ArrowUpDown size={12} />
                        </div>
                      </th>
                      <th style={{ padding: "0.85rem 1rem" }}>Proyecto & Unidad</th>
                      <th style={{ padding: "0.85rem 1rem" }}>Cliente / Reportante</th>
                      <th style={{ padding: "0.85rem 1rem" }}>Categoría & Asunto</th>
                      <th style={{ padding: "0.85rem 1rem" }}>Prioridad</th>
                      <th style={{ padding: "0.85rem 1rem" }}>Estado</th>
                      <th style={{ padding: "0.85rem 1rem" }}>Asignado A</th>
                      <th style={{ padding: "0.85rem 1rem" }}>SLA</th>
                      <th style={{ padding: "0.85rem 1rem", textAlign: "right" }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIncidents.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ padding: "3rem", textAlign: "center", color: "#94A3B8" }}>
                          <Wrench size={36} style={{ margin: "0 auto 0.5rem auto", opacity: 0.5 }} />
                          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#64748B" }}>
                            No se encontraron incidencias
                          </div>
                          <div style={{ fontSize: "0.8rem", color: "#94A3B8", marginTop: "0.2rem" }}>
                            Prueba ajustando los filtros de búsqueda o registra una nueva incidencia.
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredIncidents.map((inc) => {
                        const statusPill = getStatusPill(inc.status);
                        const priorityPill = getPriorityPill(inc.priority);
                        const commentsCount = (inc.comments || []).length;

                        return (
                          <tr
                            key={inc.id}
                            style={{
                              borderBottom: "1px solid #F1F5F9",
                              fontSize: "0.82rem",
                              transition: "background 0.1s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                          >
                            <td style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1B3047" }}>
                              {inc.folio}
                            </td>
                            <td style={{ padding: "0.85rem 1rem" }}>
                              <div style={{ fontWeight: 700, color: "#1E293B" }}>{inc.projectName}</div>
                              <div style={{ fontSize: "0.75rem", color: "#2563EB", fontWeight: 600 }}>
                                Depto {inc.unit}
                              </div>
                            </td>
                            <td style={{ padding: "0.85rem 1rem" }}>
                              <div style={{ fontWeight: 600, color: "#1E293B" }}>{inc.clientName}</div>
                              <div style={{ fontSize: "0.72rem", color: "#64748B" }}>{inc.clientPhone}</div>
                            </td>
                            <td style={{ padding: "0.85rem 1rem", maxWidth: "260px" }}>
                              <div style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 600 }}>
                                {inc.category}
                              </div>
                              <div style={{ fontWeight: 600, color: "#1E293B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {inc.title}
                              </div>
                            </td>
                            <td style={{ padding: "0.85rem 1rem" }}>
                              <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "999px", backgroundColor: priorityPill.bg, color: priorityPill.color }}>
                                {priorityPill.text}
                              </span>
                            </td>
                            <td style={{ padding: "0.85rem 1rem" }}>
                              <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "999px", backgroundColor: statusPill.bg, color: statusPill.color, border: `1px solid ${statusPill.border}` }}>
                                {inc.status}
                              </span>
                            </td>
                            <td style={{ padding: "0.85rem 1rem" }}>
                              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#334155" }}>
                                {inc.assignedTo?.name || "Sin asignar"}
                              </div>
                              <div style={{ fontSize: "0.68rem", color: "#94A3B8" }}>
                                {inc.assignedTo?.role || ""}
                              </div>
                            </td>
                            <td style={{ padding: "0.85rem 1rem" }}>
                              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: inc.slaExpired ? "#DC2626" : "#059669" }}>
                                {inc.slaHours}h {inc.slaExpired ? "(Vencido)" : ""}
                              </div>
                              {commentsCount > 0 && (
                                <div style={{ fontSize: "0.68rem", color: "#2563EB", marginTop: "2px" }}>
                                  💬 {commentsCount} mensaje{commentsCount > 1 ? "s" : ""}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                              <button
                                type="button"
                                onClick={() => {
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
                                <Eye size={13} /> Gestionar & Chat
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: UNIDADES VENDIDAS & ENTREGAS */}
        {mainTab === "deliveries" && (
          <>
            {/* Delivery Stats KPI Bar */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                gap: "1rem",
              }}
            >
              <div style={{ backgroundColor: "#FFFFFF", borderRadius: "0.85rem", padding: "1rem 1.15rem", border: "1px solid #E2E8F0", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748B", display: "block" }}>
                  Total Unidades Vendidas
                </span>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", marginTop: "0.35rem" }}>
                  <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1E293B" }}>
                    {deliveryKpis.total}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "#64748B" }}>unidades formalizadas</span>
                </div>
              </div>

              <div style={{ backgroundColor: "#FFFFFF", borderRadius: "0.85rem", padding: "1rem 1.15rem", border: "1px solid #E2E8F0", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748B", display: "block" }}>
                  Unidades Entregadas
                </span>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", marginTop: "0.35rem" }}>
                  <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#059669" }}>
                    {deliveryKpis.delivered}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "#059669", fontWeight: 700 }}>
                    ({deliveryKpis.rate}% de entregas)
                  </span>
                </div>
              </div>

              <div style={{ backgroundColor: "#FFFFFF", borderRadius: "0.85rem", padding: "1rem 1.15rem", border: "1px solid #E2E8F0", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748B", display: "block" }}>
                  Pendientes de Entrega
                </span>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", marginTop: "0.35rem" }}>
                  <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#D97706" }}>
                    {deliveryKpis.pending}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "#64748B" }}>en construcción</span>
                </div>
              </div>

              <div style={{ backgroundColor: "#FFFFFF", borderRadius: "0.85rem", padding: "1rem 1.15rem", border: "1px solid #E2E8F0", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748B", display: "block" }}>
                  Entregadas con Incidencias
                </span>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", marginTop: "0.35rem" }}>
                  <span style={{ fontSize: "1.5rem", fontWeight: 800, color: deliveryKpis.activeWithIssues > 0 ? "#DC2626" : "#059669" }}>
                    {deliveryKpis.activeWithIssues}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "#64748B" }}>con tickets abiertos</span>
                </div>
              </div>
            </div>

            {/* Toolbar for Deliveries */}
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
                  value={deliverySearch}
                  onChange={(e) => setDeliverySearch(e.target.value)}
                  placeholder="Buscar unidad, cliente o desarrollo..."
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

              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
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

                <select
                  value={deliveryStatusFilter}
                  onChange={(e) => setDeliveryStatusFilter(e.target.value as any)}
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
                  <option value="ALL">Todos los Estatus de Entrega</option>
                  <option value="DELIVERED">✓ Solo Entregadas (Garantía Activa)</option>
                  <option value="PENDING">⏳ Solo Pendientes de Entrega</option>
                </select>
              </div>
            </div>

            {/* Table: Sold Units & Handover Status */}
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
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", fontSize: "0.75rem", color: "#64748B", textTransform: "uppercase" }}>
                      <th style={{ padding: "0.85rem 1rem" }}>Desarrollo & Unidad</th>
                      <th style={{ padding: "0.85rem 1rem" }}>Propietario / Cliente</th>
                      <th style={{ padding: "0.85rem 1rem" }}>Fecha de Venta</th>
                      <th style={{ padding: "0.85rem 1rem" }}>Estatus de Entrega</th>
                      <th style={{ padding: "0.85rem 1rem" }}>Fecha de Entrega & Garantía</th>
                      <th style={{ padding: "0.85rem 1rem" }}>Incidencias Activas</th>
                      <th style={{ padding: "0.85rem 1rem", textAlign: "right" }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSoldUnits.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: "3rem", textAlign: "center", color: "#94A3B8" }}>
                          <Building size={36} style={{ margin: "0 auto 0.5rem auto", opacity: 0.5 }} />
                          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#64748B" }}>
                            No se encontraron unidades vendidas con los filtros actuales
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredSoldUnits.map((u, idx) => (
                        <tr
                          key={`${u.projectId}-${u.unitNumber}-${idx}`}
                          style={{
                            borderBottom: "1px solid #F1F5F9",
                            fontSize: "0.82rem",
                            transition: "background 0.1s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          <td style={{ padding: "0.85rem 1rem" }}>
                            <div style={{ fontWeight: 700, color: "#1E293B" }}>{u.projectName}</div>
                            <div style={{ fontSize: "0.78rem", color: "#2563EB", fontWeight: 700 }}>
                              Unidad {u.unitNumber} {u.unitType ? `(${u.unitType})` : ""}
                            </div>
                          </td>
                          <td style={{ padding: "0.85rem 1rem" }}>
                            <div style={{ fontWeight: 700, color: "#1E293B" }}>{u.clientName}</div>
                          </td>
                          <td style={{ padding: "0.85rem 1rem", color: "#64748B" }}>
                            {u.saleDate}
                          </td>
                          <td style={{ padding: "0.85rem 1rem" }}>
                            {u.isDelivered ? (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.3rem",
                                  backgroundColor: "#ECFDF5",
                                  color: "#065F46",
                                  border: "1px solid #A7F3D0",
                                  padding: "0.25rem 0.65rem",
                                  borderRadius: "999px",
                                  fontSize: "0.74rem",
                                  fontWeight: 700,
                                }}
                              >
                                <CheckCircle2 size={12} /> Entregada
                              </span>
                            ) : (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.3rem",
                                  backgroundColor: "#FEF3C7",
                                  color: "#92400E",
                                  border: "1px solid #FDE68A",
                                  padding: "0.25rem 0.65rem",
                                  borderRadius: "999px",
                                  fontSize: "0.74rem",
                                  fontWeight: 700,
                                }}
                              >
                                <Clock size={12} /> Pendiente de Entrega
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "0.85rem 1rem" }}>
                            {u.isDelivered ? (
                              <div>
                                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1E293B" }}>
                                  {u.deliveredAt || "Fecha registrada"}
                                </div>
                                <div style={{ fontSize: "0.7rem", color: "#059669", display: "flex", alignItems: "center", gap: "3px" }}>
                                  <ShieldCheck size={11} /> Garantía hasta {u.warrantyExpiresAt || "1 año"}
                                </div>
                                {u.deliveryActUrl && (
                                  <div style={{ fontSize: "0.68rem", color: "#64748B" }}>
                                    Acta: {u.deliveryActUrl}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
                                Sin entrega formal aún
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "0.85rem 1rem" }}>
                            {u.activeIncidentsCount > 0 ? (
                              <button
                                onClick={() => {
                                  setMainTab("incidents");
                                  setSearchQuery(u.unitNumber);
                                }}
                                style={{
                                  backgroundColor: "#FEF2F2",
                                  color: "#DC2626",
                                  border: "1px solid #FECACA",
                                  borderRadius: "999px",
                                  padding: "0.15rem 0.55rem",
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                🔴 {u.activeIncidentsCount} ticket{u.activeIncidentsCount > 1 ? "s" : ""} abierto{u.activeIncidentsCount > 1 ? "s" : ""}
                              </button>
                            ) : (
                              <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                                {u.totalIncidentsCount > 0 ? `0 activas (${u.totalIncidentsCount} resueltas)` : "Sin incidencias"}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.45rem" }}>
                              {/* Mark / Edit Delivery */}
                              <button
                                type="button"
                                onClick={() => setDeliveryModalUnit(u)}
                                style={{
                                  backgroundColor: u.isDelivered ? "#F1F5F9" : "#1B3047",
                                  color: u.isDelivered ? "#1B3047" : "#FFFFFF",
                                  border: "1px solid #CBD5E1",
                                  borderRadius: "0.45rem",
                                  padding: "0.35rem 0.75rem",
                                  fontSize: "0.74rem",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                {u.isDelivered ? "Editar Entrega" : "Marcar como Entregada"}
                              </button>

                              {/* Create incident directly for this unit */}
                              <button
                                type="button"
                                onClick={() => {
                                  setNewIncidentDefaults({ projectId: u.projectId, unit: u.unitNumber });
                                  setIsNewModalOpen(true);
                                }}
                                style={{
                                  backgroundColor: "#2563EB",
                                  color: "#FFFFFF",
                                  border: "none",
                                  borderRadius: "0.45rem",
                                  padding: "0.35rem 0.75rem",
                                  fontSize: "0.74rem",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <Plus size={12} /> Reportar Incidencia
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Modal: New Incident */}
        <NewIncidentModal
          isOpen={isNewModalOpen}
          onClose={() => {
            setIsNewModalOpen(false);
            setNewIncidentDefaults(undefined);
          }}
          onSave={handleSaveNewIncident}
          defaultProjectId={newIncidentDefaults?.projectId}
          defaultUnit={newIncidentDefaults?.unit}
        />

        {/* Modal: Unit Delivery Handover */}
        <UnitDeliveryModal
          unitData={deliveryModalUnit}
          isOpen={Boolean(deliveryModalUnit)}
          onClose={() => setDeliveryModalUnit(null)}
          onConfirm={(isDelivered, deliveredAt, deliveryActUrl, warrantyExpiresAt) => {
            if (deliveryModalUnit) {
              markUnitAsDelivered(
                deliveryModalUnit.projectId,
                deliveryModalUnit.unitNumber,
                isDelivered,
                deliveredAt,
                deliveryActUrl,
                warrantyExpiresAt
              );
              setDeliveryModalUnit(null);
            }
          }}
        />

        {/* Drawer: Incident Detail Workspace & Live Chat */}
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
