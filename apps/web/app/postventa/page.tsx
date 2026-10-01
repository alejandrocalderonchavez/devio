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
  ShieldAlert,
  ShieldCheck,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import {
  PostventaIncident,
  PostventaStatus,
  PostventaPriority,
  PostventaCategory,
} from "../../data/postventa-data";
import { useProject } from "../../context/project-context";
import { formatDateMX } from "../../lib/date-utils";
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

  // Sold Units Aggregator (strictly status === "VENDIDA" or status === "ENTREGADA")
  const soldUnits = useMemo(() => {
    const list: Array<DeliveryUnitData & {
      price: number;
      saleDate: string;
      activeIncidentsCount: number;
      totalIncidentsCount: number;
    }> = [];

    projects.forEach((p) => {
      (p.unitsInventory || []).forEach((u: any) => {
        const isSold = u.status === "VENDIDA" || u.status === "ENTREGADA";
        if (isSold) {
          const unitIncidents = incidents.filter(
            (inc) =>
              inc.projectId === p.id &&
              inc.unit.toLowerCase().trim() === (u.unit || "").toLowerCase().trim()
          );
          const activeCount = unitIncidents.filter(
            (i) => i.status !== "Cerrada" && i.status !== "Resuelta"
          ).length;

          list.push({
            projectId: p.id,
            projectName: p.name,
            unitNumber: u.unit,
            unitType: u.type || "Unidad",
            clientName: u.client && u.client !== "-" ? u.client : "Cliente Propietario",
            price: u.price || 0,
            saleDate: u.saleDate && u.saleDate !== "-" ? formatDateMX(u.saleDate, "short") : "Fecha registrada",
            isDelivered: Boolean(u.isDelivered || u.status === "ENTREGADA"),
            deliveredAt: u.deliveredAt ? formatDateMX(u.deliveredAt, "short") : undefined,
            deliveryActUrl: u.deliveryActUrl,
            warrantyExpiresAt: u.warrantyExpiresAt ? formatDateMX(u.warrantyExpiresAt, "short") : undefined,
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
      total,
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

  const getStatusBadge = (status: PostventaStatus) => {
    switch (status) {
      case "Reportada":
        return { bg: "#0F2942", color: "#FFFFFF" };
      case "En revisión":
        return { bg: "#F59E0B", color: "#FFFFFF" };
      case "Asignada":
        return { bg: "#1B3047", color: "#FFFFFF" };
      case "Visita programada":
        return { bg: "#2F80ED", color: "#FFFFFF" };
      case "En reparación":
        return { bg: "#EA580C", color: "#FFFFFF" };
      case "Esperando cliente":
        return { bg: "#D97706", color: "#FFFFFF" };
      case "Resuelta":
      case "Cerrada":
        return { bg: "#10B981", color: "#FFFFFF" };
      case "Reabierta":
        return { bg: "#EF4444", color: "#FFFFFF" };
    }
  };

  const getPriorityBadge = (p: PostventaPriority) => {
    switch (p) {
      case "Urgente":
        return { bg: "#EF4444", color: "#FFFFFF", text: "Urgente" };
      case "Alta":
        return { bg: "#F59E0B", color: "#FFFFFF", text: "Alta" };
      case "Media":
        return { bg: "#2F80ED", color: "#FFFFFF", text: "Media" };
      default:
        return { bg: "#10B981", color: "#FFFFFF", text: "Baja" };
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
      "Fecha Creación": formatDateMX(inc.createdAt, "short"),
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
      formatDateMX(inc.createdAt, "short"),
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
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1.1rem", padding: "3rem", textAlign: "center", maxWidth: "480px", border: "1px solid rgba(22, 43, 63, 0.05)", boxShadow: "0 4px 15px rgba(0,0,0,0.03)" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem auto" }}>
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
      <main
        style={{
          padding: "1.25rem 2rem 2.5rem 2rem",
          flex: "1 1 0%",
          overflowY: "auto",
          height: "calc(100vh - 65px)",
          minHeight: 0,
        }}
      >
        {/* Top Header & Action Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "1.25rem",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  backgroundColor: "#1B3047",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(27, 48, 71, 0.15)",
                }}
              >
                <Wrench size={20} />
              </div>
              <h1
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  color: "#1F3652",
                  margin: 0,
                  letterSpacing: "-0.02em",
                }}
              >
                Postventa, Entregas & Garantías
              </h1>
            </div>
            <p style={{ fontSize: "0.85rem", color: "#64748B", margin: "0.35rem 0 0 0" }}>
              Administra la entrega de unidades, recepción de incidencias, asignación de responsables y seguimiento en tiempo real.
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
                    color: "#1F3652",
                    padding: "0.5rem 1.1rem",
                    borderRadius: "9999px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 1px 3px rgba(31, 54, 82, 0.04)",
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
                    color: "#1F3652",
                    padding: "0.5rem 1.1rem",
                    borderRadius: "9999px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 1px 3px rgba(31, 54, 82, 0.04)",
                  }}
                >
                  <Printer size={15} color="#1B3047" /> Exportar PDF
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
                  padding: "0.5rem 1.35rem",
                  borderRadius: "9999px",
                  border: "none",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(27, 48, 71, 0.15)",
                }}
              >
                <Plus size={16} /> Nueva Incidencia
              </button>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            borderBottom: "2px solid #EAEFF5",
            paddingBottom: "0.15rem",
            marginBottom: "1.25rem",
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
            }}
          >
            <Wrench size={16} />
            <span>Incidencias ({incidents.length})</span>
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
            }}
          >
            <CheckCircle2 size={16} />
            <span>Unidades Vendidas & Entregas ({soldUnits.length})</span>
          </button>
        </div>

        {/* TAB 1: INCIDENCIAS */}
        {mainTab === "incidents" && (
          <>
            {/* 4 KPI Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "1rem",
                marginBottom: "1.25rem",
              }}
            >
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "1.1rem",
                  padding: "1.1rem 1.25rem",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                  border: "1px solid rgba(22, 43, 63, 0.05)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "0.35rem" }}>
                    Incidencias Abiertas
                  </span>
                  <h3 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1F3652", margin: 0, lineHeight: 1 }}>
                    {kpis.openCases}
                  </h3>
                </div>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "0.75rem",
                    backgroundColor: "rgba(31, 54, 82, 0.06)",
                    color: "#1F3652",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AlertCircle size={20} />
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "1.1rem",
                  padding: "1.1rem 1.25rem",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                  border: "1px solid rgba(22, 43, 63, 0.05)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "0.35rem" }}>
                    1ra Respuesta Promedio
                  </span>
                  <h3 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1F3652", margin: 0, lineHeight: 1 }}>
                    {kpis.firstResponseTime}
                  </h3>
                </div>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "0.75rem",
                    backgroundColor: "rgba(31, 54, 82, 0.06)",
                    color: "#1F3652",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Clock size={20} />
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "1.1rem",
                  padding: "1.1rem 1.25rem",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                  border: "1px solid rgba(22, 43, 63, 0.05)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "0.35rem" }}>
                    Tiempo de Resolución
                  </span>
                  <h3 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#10B981", margin: 0, lineHeight: 1 }}>
                    {kpis.avgResolutionTime}
                  </h3>
                </div>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "0.75rem",
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                    color: "#10B981",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckCircle2 size={20} />
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "1.1rem",
                  padding: "1.1rem 1.25rem",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                  border: "1px solid rgba(22, 43, 63, 0.05)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "0.35rem" }}>
                    Casos Vencidos (SLA)
                  </span>
                  <h3
                    style={{
                      fontSize: "1.6rem",
                      fontWeight: 800,
                      color: kpis.expiredCases > 0 ? "#EF4444" : "#10B981",
                      margin: 0,
                      lineHeight: 1,
                    }}
                  >
                    {kpis.expiredCases}
                  </h3>
                </div>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "0.75rem",
                    backgroundColor: kpis.expiredCases > 0 ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)",
                    color: kpis.expiredCases > 0 ? "#EF4444" : "#10B981",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AlertTriangle size={20} />
                </div>
              </div>
            </div>

            {/* Toolbar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "1rem",
                marginBottom: "1rem",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "9999px",
                  padding: "0.5rem 1rem",
                  border: "1px solid #EAEFF5",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                  minWidth: "320px",
                  flex: 1,
                }}
              >
                <Search size={16} color="#94A3B8" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por folio, cliente, unidad o defecto..."
                  style={{
                    border: "none",
                    backgroundColor: "transparent",
                    outline: "none",
                    fontSize: "0.85rem",
                    width: "100%",
                    color: "#1F3652",
                  }}
                />
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "9999px",
                    border: "1px solid #EAEFF5",
                    backgroundColor: "#FFFFFF",
                    color: "#1F3652",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
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
                    padding: "0.5rem 1rem",
                    borderRadius: "9999px",
                    border: "1px solid #EAEFF5",
                    backgroundColor: "#FFFFFF",
                    color: "#1F3652",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
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
                </select>

                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "9999px",
                    border: "1px solid #EAEFF5",
                    backgroundColor: "#FFFFFF",
                    color: "#1F3652",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                    outline: "none",
                  }}
                >
                  <option value="ALL">Todas las Prioridades</option>
                  <option value="Urgente">Urgente</option>
                  <option value="Alta">Alta</option>
                  <option value="Media">Media</option>
                  <option value="Baja">Baja</option>
                </select>
              </div>
            </div>

            {/* Incidents Table */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "1rem",
                overflow: "hidden",
                boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
                border: "1px solid rgba(22, 43, 63, 0.05)",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #EAEFF5" }}>
                    <th
                      style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652", cursor: "pointer", userSelect: "none" }}
                      onClick={() => handleSort("folio")}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        Folio <ArrowUpDown size={12} color="#1B3047" />
                      </div>
                    </th>
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652" }}>Proyecto & Unidad</th>
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652" }}>Cliente</th>
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652" }}>Categoría & Asunto</th>
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652" }}>Prioridad</th>
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652" }}>Estado</th>
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652" }}>Fecha Reporte</th>
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652" }}>Responsable</th>
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652", textAlign: "right" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIncidents.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ padding: "3.5rem 1rem", textAlign: "center", color: "#64748B" }}>
                        <Wrench size={36} color="#94A3B8" style={{ margin: "0 auto 0.75rem auto", display: "block" }} />
                        <strong style={{ fontSize: "0.95rem", color: "#1F3652", display: "block", marginBottom: "0.25rem" }}>
                          No se encontraron incidencias
                        </strong>
                        <span style={{ fontSize: "0.82rem", color: "#94A3B8" }}>
                          Prueba ajustando los filtros de búsqueda o registra una nueva incidencia.
                        </span>
                      </td>
                    </tr>
                  ) : (
                    filteredIncidents.map((inc, i) => {
                      const statusBadge = getStatusBadge(inc.status);
                      const priorityBadge = getPriorityBadge(inc.priority);
                      const commentsCount = (inc.comments || []).length;

                      return (
                        <tr
                          key={inc.id}
                          style={{
                            borderBottom: "1px solid #EAEFF5",
                            backgroundColor: i % 2 === 0 ? "#FFFFFF" : "#FAFBFD",
                            transition: "background-color 0.15s ease",
                          }}
                        >
                          <td style={{ padding: "0.85rem 1rem", fontWeight: 800, color: "#1F3652" }}>
                            {inc.folio}
                          </td>
                          <td style={{ padding: "0.85rem 1rem" }}>
                            <div style={{ fontWeight: 800, color: "#1F3652" }}>{inc.projectName}</div>
                            <div style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 500 }}>
                              Depto {inc.unit}
                            </div>
                          </td>
                          <td style={{ padding: "0.85rem 1rem" }}>
                            <div style={{ fontWeight: 600, color: "#1F3652" }}>{inc.clientName}</div>
                            {inc.clientPhone && (
                              <div style={{ fontSize: "0.72rem", color: "#64748B" }}>{inc.clientPhone}</div>
                            )}
                          </td>
                          <td style={{ padding: "0.85rem 1rem", maxWidth: "260px" }}>
                            <div style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 600 }}>
                              {inc.category}
                            </div>
                            <div
                              style={{
                                fontWeight: 600,
                                color: "#1F3652",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {inc.title}
                            </div>
                          </td>
                          <td style={{ padding: "0.85rem 1rem" }}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "0.25rem 0.75rem",
                                borderRadius: "9999px",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                backgroundColor: priorityBadge.bg,
                                color: priorityBadge.color,
                              }}
                            >
                              {priorityBadge.text}
                            </span>
                          </td>
                          <td style={{ padding: "0.85rem 1rem" }}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "0.25rem 0.75rem",
                                borderRadius: "9999px",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                backgroundColor: statusBadge.bg,
                                color: statusBadge.color,
                              }}
                            >
                              {inc.status}
                            </span>
                          </td>
                          <td style={{ padding: "0.85rem 1rem", color: "#64748B", fontWeight: 500 }}>
                            {formatDateMX(inc.createdAt, "short")}
                          </td>
                          <td style={{ padding: "0.85rem 1rem" }}>
                            <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1F3652" }}>
                              {inc.assignedTo?.name || "Sin asignar"}
                            </div>
                            {commentsCount > 0 && (
                              <div
                                style={{
                                  fontSize: "0.68rem",
                                  color: "#1B3047",
                                  marginTop: "2px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "3px",
                                  fontWeight: 600,
                                }}
                              >
                                <MessageSquare size={10} /> {commentsCount} mensaje{commentsCount > 1 ? "s" : ""}
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
                                gap: "0.35rem",
                                backgroundColor: "#1B3047",
                                color: "#FFFFFF",
                                border: "none",
                                padding: "0.45rem 0.95rem",
                                borderRadius: "9999px",
                                fontSize: "0.78rem",
                                fontWeight: 700,
                                cursor: "pointer",
                                boxShadow: "0 2px 6px rgba(27, 48, 71, 0.15)",
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
          </>
        )}

        {/* TAB 2: UNIDADES VENDIDAS & ENTREGAS */}
        {mainTab === "deliveries" && (
          <>
            {/* 4 KPI CARDS */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "1rem",
                marginBottom: "1.25rem",
              }}
            >
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "1.1rem",
                  padding: "1.1rem 1.25rem",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                  border: "1px solid rgba(22, 43, 63, 0.05)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "0.35rem" }}>
                    Total Unidades Vendidas
                  </span>
                  <h3 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1F3652", margin: 0, lineHeight: 1 }}>
                    {deliveryKpis.total}
                  </h3>
                </div>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "0.75rem",
                    backgroundColor: "rgba(31, 54, 82, 0.06)",
                    color: "#1F3652",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Building size={20} />
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "1.1rem",
                  padding: "1.1rem 1.25rem",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                  border: "1px solid rgba(22, 43, 63, 0.05)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "0.35rem" }}>
                    Unidades Entregadas
                  </span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem" }}>
                    <h3 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#10B981", margin: 0, lineHeight: 1 }}>
                      {deliveryKpis.delivered}
                    </h3>
                    <span style={{ fontSize: "0.75rem", color: "#10B981", fontWeight: 700 }}>
                      ({deliveryKpis.rate}%)
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "0.75rem",
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                    color: "#10B981",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckCircle2 size={20} />
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "1.1rem",
                  padding: "1.1rem 1.25rem",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                  border: "1px solid rgba(22, 43, 63, 0.05)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "0.35rem" }}>
                    Pendientes de Entrega
                  </span>
                  <h3 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#F59E0B", margin: 0, lineHeight: 1 }}>
                    {deliveryKpis.pending}
                  </h3>
                </div>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "0.75rem",
                    backgroundColor: "rgba(245, 158, 11, 0.1)",
                    color: "#F59E0B",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Clock size={20} />
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "1.1rem",
                  padding: "1.1rem 1.25rem",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                  border: "1px solid rgba(22, 43, 63, 0.05)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "0.35rem" }}>
                    Entregadas con Incidencias
                  </span>
                  <h3
                    style={{
                      fontSize: "1.6rem",
                      fontWeight: 800,
                      color: deliveryKpis.activeWithIssues > 0 ? "#EF4444" : "#10B981",
                      margin: 0,
                      lineHeight: 1,
                    }}
                  >
                    {deliveryKpis.activeWithIssues}
                  </h3>
                </div>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "0.75rem",
                    backgroundColor: deliveryKpis.activeWithIssues > 0 ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)",
                    color: deliveryKpis.activeWithIssues > 0 ? "#EF4444" : "#10B981",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ShieldAlert size={20} />
                </div>
              </div>
            </div>

            {/* Toolbar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "1rem",
                marginBottom: "1rem",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "9999px",
                  padding: "0.5rem 1rem",
                  border: "1px solid #EAEFF5",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                  minWidth: "320px",
                  flex: 1,
                }}
              >
                <Search size={16} color="#94A3B8" />
                <input
                  type="text"
                  value={deliverySearch}
                  onChange={(e) => setDeliverySearch(e.target.value)}
                  placeholder="Buscar unidad, cliente o desarrollo..."
                  style={{
                    border: "none",
                    backgroundColor: "transparent",
                    outline: "none",
                    fontSize: "0.85rem",
                    width: "100%",
                    color: "#1F3652",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "9999px",
                    border: "1px solid #EAEFF5",
                    backgroundColor: "#FFFFFF",
                    color: "#1F3652",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
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
                    padding: "0.5rem 1rem",
                    borderRadius: "9999px",
                    border: "1px solid #EAEFF5",
                    backgroundColor: "#FFFFFF",
                    color: "#1F3652",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                    outline: "none",
                  }}
                >
                  <option value="ALL">Todos los Estatus de Entrega</option>
                  <option value="DELIVERED">✓ Solo Entregadas (Garantía Activa)</option>
                  <option value="PENDING">⏳ Solo Pendientes de Entrega</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "1rem",
                overflow: "hidden",
                boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
                border: "1px solid rgba(22, 43, 63, 0.05)",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #EAEFF5" }}>
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652" }}>Desarrollo & Unidad</th>
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652" }}>Propietario / Cliente</th>
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652" }}>Fecha de Venta</th>
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652" }}>Estatus de Entrega</th>
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652" }}>Fecha de Entrega & Garantía</th>
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652" }}>Incidencias Activas</th>
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652", textAlign: "right" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSoldUnits.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: "3.5rem 1rem", textAlign: "center", color: "#64748B" }}>
                        <Building size={36} color="#94A3B8" style={{ margin: "0 auto 0.75rem auto", display: "block" }} />
                        <strong style={{ fontSize: "0.95rem", color: "#1F3652", display: "block", marginBottom: "0.25rem" }}>
                          No se encontraron unidades vendidas
                        </strong>
                        <span style={{ fontSize: "0.82rem", color: "#94A3B8" }}>
                          Cuando formalices ventas en los proyectos, aparecerán aquí para gestionar sus entregas y garantías.
                        </span>
                      </td>
                    </tr>
                  ) : (
                    filteredSoldUnits.map((u, i) => (
                      <tr
                        key={`${u.projectId}-${u.unitNumber}-${i}`}
                        style={{
                          borderBottom: "1px solid #EAEFF5",
                          backgroundColor: i % 2 === 0 ? "#FFFFFF" : "#FAFBFD",
                          transition: "background-color 0.15s ease",
                        }}
                      >
                        <td style={{ padding: "0.85rem 1rem" }}>
                          <div style={{ fontWeight: 800, color: "#1F3652" }}>{u.projectName}</div>
                          <div style={{ fontSize: "0.78rem", color: "#64748B", fontWeight: 500 }}>
                            Unidad {u.unitNumber} {u.unitType ? `(${u.unitType})` : ""}
                          </div>
                        </td>
                        <td style={{ padding: "0.85rem 1rem", fontWeight: 600, color: "#1F3652" }}>
                          {u.clientName}
                        </td>
                        <td style={{ padding: "0.85rem 1rem", color: "#64748B", fontWeight: 500 }}>
                          {u.saleDate}
                        </td>
                        <td style={{ padding: "0.85rem 1rem" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "0.3rem 0.85rem",
                              borderRadius: "9999px",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              backgroundColor: u.isDelivered ? "#10B981" : "#F59E0B",
                              color: "#FFFFFF",
                            }}
                          >
                            {u.isDelivered ? "Entregada" : "Pendiente"}
                          </span>
                        </td>
                        <td style={{ padding: "0.85rem 1rem" }}>
                          {u.isDelivered ? (
                            <div>
                              <span style={{ fontWeight: 700, color: "#1F3652", fontSize: "0.82rem", display: "block" }}>
                                {u.deliveredAt || "Fecha registrada"}
                              </span>
                              <span style={{ fontSize: "0.72rem", color: "#059669", display: "inline-flex", alignItems: "center", gap: "3px", fontWeight: 600 }}>
                                <ShieldCheck size={12} /> Garantía hasta {u.warrantyExpiresAt || "1 año"}
                              </span>
                            </div>
                          ) : (
                            <span style={{ fontSize: "0.78rem", color: "#94A3B8" }}>
                              Sin entrega formal aún
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "0.85rem 1rem" }}>
                          {u.activeIncidentsCount > 0 ? (
                            <button
                              type="button"
                              onClick={() => {
                                setMainTab("incidents");
                                setSearchQuery(u.unitNumber);
                              }}
                              style={{
                                backgroundColor: "rgba(239, 68, 68, 0.1)",
                                color: "#DC2626",
                                border: "1px solid rgba(239, 68, 68, 0.25)",
                                borderRadius: "9999px",
                                padding: "0.2rem 0.65rem",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              🔴 {u.activeIncidentsCount} ticket{u.activeIncidentsCount > 1 ? "s" : ""}
                            </button>
                          ) : (
                            <span style={{ fontSize: "0.78rem", color: "#64748B" }}>
                              {u.totalIncidentsCount > 0
                                ? `0 activas (${u.totalIncidentsCount} resueltas)`
                                : "Sin incidencias"}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.45rem", alignItems: "center" }}>
                            <button
                              type="button"
                              onClick={() => setDeliveryModalUnit(u)}
                              style={{
                                padding: "0.45rem 0.95rem",
                                borderRadius: "9999px",
                                backgroundColor: u.isDelivered ? "#FFFFFF" : "#1B3047",
                                color: u.isDelivered ? "#1F3652" : "#FFFFFF",
                                fontSize: "0.78rem",
                                fontWeight: 700,
                                border: u.isDelivered ? "1px solid #CBD5E1" : "none",
                                cursor: "pointer",
                                boxShadow: u.isDelivered ? "none" : "0 2px 6px rgba(27, 48, 71, 0.15)",
                              }}
                            >
                              {u.isDelivered ? "Editar Entrega" : "Marcar como Entregada"}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setNewIncidentDefaults({
                                  projectId: u.projectId,
                                  unit: u.unitNumber,
                                });
                                setIsNewModalOpen(true);
                              }}
                              style={{
                                padding: "0.45rem 0.95rem",
                                borderRadius: "9999px",
                                backgroundColor: "#1B3047",
                                color: "#FFFFFF",
                                fontSize: "0.78rem",
                                fontWeight: 700,
                                border: "none",
                                cursor: "pointer",
                                boxShadow: "0 2px 6px rgba(27, 48, 71, 0.15)",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <Plus size={13} /> Incidencia
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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
      </main>
    </AppLayout>
  );
}
