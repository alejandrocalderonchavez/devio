"use client";

import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import AppLayout from "../../../../components/layout/app-layout";
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
  ShieldCheck,
  ShieldAlert,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import {
  PostventaIncident,
  PostventaStatus,
  PostventaPriority,
  PostventaCategory,
} from "../../../../data/postventa-data";
import { useProject } from "../../../../context/project-context";
import { formatDateMX } from "../../../../lib/date-utils";
import { exportTableToExcel, exportTableToPDF } from "../../../../lib/export-utils";
import { NewIncidentModal } from "../../../../components/postventa/new-incident-modal";
import { IncidentDetailDrawer } from "../../../../components/postventa/incident-detail-drawer";
import { UnitDeliveryModal, DeliveryUnitData } from "../../../../components/postventa/unit-delivery-modal";

export default function ProjectPostventaPage() {
  const params = useParams();
  const projectId = (params?.id as string) || "p-1";
  const {
    getProject,
    postventaIncidents,
    addPostventaIncident,
    updatePostventaIncident,
    markUnitAsDelivered,
    hasPermission,
  } = useProject();

  const project = getProject(projectId);

  // Main Tab
  const [mainTab, setMainTab] = useState<"incidents" | "deliveries">("incidents");

  // Filters for Incidents
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Sorting
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

  // Filter scoped to this project
  const projectIncidents = useMemo(() => {
    return postventaIncidents.filter((i) => i.projectId === projectId);
  }, [postventaIncidents, projectId]);

  // Project Sold Units
  const projectSoldUnits = useMemo(() => {
    if (!project || !Array.isArray(project.unitsInventory)) return [];
    const list: Array<DeliveryUnitData & {
      price: number;
      saleDate: string;
      activeIncidentsCount: number;
      totalIncidentsCount: number;
    }> = [];

    project.unitsInventory.forEach((u: any) => {
      if (u.status === "VENDIDA" || u.status === "ENTREGADA" || u.client) {
        const unitIncidents = projectIncidents.filter(
          (inc) => inc.unit.toLowerCase().trim() === (u.unit || "").toLowerCase().trim()
        );
        const activeCount = unitIncidents.filter(
          (i) => i.status !== "Cerrada" && i.status !== "Resuelta"
        ).length;

        list.push({
          projectId: project.id,
          projectName: project.name,
          unitNumber: u.unit,
          unitType: u.type || "Unidad",
          clientName: u.client || "Cliente sin asignar",
          price: u.price || 0,
          saleDate: u.saleDate ? formatDateMX(u.saleDate, "short") : "-",
          isDelivered: Boolean(u.isDelivered || u.status === "ENTREGADA"),
          deliveredAt: u.deliveredAt ? formatDateMX(u.deliveredAt, "short") : undefined,
          deliveryActUrl: u.deliveryActUrl,
          warrantyExpiresAt: u.warrantyExpiresAt ? formatDateMX(u.warrantyExpiresAt, "short") : undefined,
          activeIncidentsCount: activeCount,
          totalIncidentsCount: unitIncidents.length,
        });
      }
    });

    return list;
  }, [project, projectIncidents]);

  // Deliveries KPIs
  const deliveryKpis = useMemo(() => {
    const total = projectSoldUnits.length;
    const delivered = projectSoldUnits.filter((u) => u.isDelivered).length;
    const pending = total - delivered;
    const activeWithIssues = projectSoldUnits.filter((u) => u.isDelivered && u.activeIncidentsCount > 0).length;
    const rate = total > 0 ? Math.round((delivered / total) * 100) : 0;
    return { total, delivered, pending, activeWithIssues, rate };
  }, [projectSoldUnits]);

  // Filtered Sold Units
  const filteredSoldUnits = useMemo(() => {
    return projectSoldUnits.filter((u) => {
      if (deliveryStatusFilter === "DELIVERED" && !u.isDelivered) return false;
      if (deliveryStatusFilter === "PENDING" && u.isDelivered) return false;
      if (deliverySearch.trim()) {
        const q = deliverySearch.toLowerCase();
        const matchUnit = u.unitNumber.toLowerCase().includes(q);
        const matchClient = u.clientName.toLowerCase().includes(q);
        if (!matchUnit && !matchClient) return false;
      }
      return true;
    });
  }, [projectSoldUnits, deliveryStatusFilter, deliverySearch]);

  // KPI calculations
  const kpis = useMemo(() => {
    const total = projectIncidents.length;
    const openCases = projectIncidents.filter(
      (i) => i.status !== "Cerrada" && i.status !== "Resuelta"
    ).length;
    const expiredCases = projectIncidents.filter((i) => i.slaExpired).length;
    const reopenedCases = projectIncidents.filter((i) => i.isReopened).length;

    const ratedIncidents = projectIncidents.filter((i) => i.csat && i.csat.rating);
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
      firstResponseTime: total > 0 ? "40 min" : "-",
      avgResolutionTime: total > 0 ? "2.1 días" : "-",
      expiredCases,
      avgCsat,
      reopenedCases,
    };
  }, [projectIncidents]);

  // Filtered & Sorted Incidents
  const filteredIncidents = useMemo(() => {
    return projectIncidents
      .filter((inc) => {
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
    projectIncidents,
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
        return { bg: "rgba(47, 128, 237, 0.08)", color: "#2F80ED", border: "rgba(47, 128, 237, 0.25)" };
      case "En revisión":
        return { bg: "rgba(245, 158, 11, 0.08)", color: "#D97706", border: "rgba(245, 158, 11, 0.25)" };
      case "Asignada":
        return { bg: "rgba(31, 54, 82, 0.08)", color: "#1F3652", border: "rgba(31, 54, 82, 0.25)" };
      case "Visita programada":
        return { bg: "rgba(47, 128, 237, 0.12)", color: "#1B3047", border: "rgba(47, 128, 237, 0.3)" };
      case "En reparación":
        return { bg: "rgba(234, 88, 12, 0.08)", color: "#EA580C", border: "rgba(234, 88, 12, 0.25)" };
      case "Esperando cliente":
        return { bg: "rgba(202, 138, 4, 0.08)", color: "#CA8A04", border: "rgba(202, 138, 4, 0.25)" };
      case "Resuelta":
        return { bg: "rgba(0, 196, 140, 0.1)", color: "#059669", border: "rgba(0, 196, 140, 0.3)" };
      case "Cerrada":
        return { bg: "rgba(100, 116, 139, 0.08)", color: "#475569", border: "rgba(100, 116, 139, 0.25)" };
      case "Reabierta":
        return { bg: "rgba(239, 68, 68, 0.08)", color: "#DC2626", border: "rgba(239, 68, 68, 0.25)" };
    }
  };

  const getPriorityPill = (p: PostventaPriority) => {
    switch (p) {
      case "Urgente":
        return { bg: "rgba(239, 68, 68, 0.1)", color: "#DC2626", text: "🔴 Urgente" };
      case "Alta":
        return { bg: "rgba(245, 158, 11, 0.12)", color: "#D97706", text: "🟠 Alta" };
      case "Media":
        return { bg: "rgba(47, 128, 237, 0.1)", color: "#2F80ED", text: "🔵 Media" };
      default:
        return { bg: "rgba(0, 196, 140, 0.1)", color: "#059669", text: "🟢 Baja" };
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
    exportTableToExcel(data, `Devio_Postventa_${project?.name || "Proyecto"}`);
  };

  const handleExportPDF = () => {
    const headers = [
      "Folio",
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
      `Reporte de Postventa e Incidencias - ${project?.name || "Proyecto"}`,
      project?.name || "Proyecto",
      headers,
      rows,
      summary
    );
  };

  if (!hasPermission("postventa.view")) {
    return (
      <AppLayout activeProjectId={projectId} projectSubTab="postventa">
        <main
          style={{
            padding: "3rem 2rem",
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "1.25rem",
              padding: "3rem",
              textAlign: "center",
              maxWidth: "480px",
              border: "1px solid #EAEFF5",
              boxShadow: "0 4px 12px rgba(31, 54, 82, 0.04)",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                color: "#EF4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem auto",
              }}
            >
              <ShieldAlert size={28} />
            </div>
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: 800,
                color: "#1F3652",
                marginBottom: "0.5rem",
              }}
            >
              Acceso Restringido
            </h2>
            <p style={{ fontSize: "0.88rem", color: "#64748B", lineHeight: 1.5, margin: 0 }}>
              Tu perfil de usuario no cuenta con permisos para ver el módulo de Postventa e Incidencias.
            </p>
          </div>
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout activeProjectId={projectId} projectSubTab="postventa">
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          minHeight: 0,
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
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  backgroundColor: "#1B3047",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 10px rgba(27, 48, 71, 0.15)",
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
                Postventa & Entregas • {project?.name || "Proyecto"}
              </h1>
            </div>
            <p style={{ fontSize: "0.85rem", color: "#64748B", margin: "0.35rem 0 0 0" }}>
              Control centralizado de garantías, incidencias y actas de entrega para {project?.name}.
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
                    padding: "0.55rem 1.15rem",
                    borderRadius: "9999px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.82rem",
                    fontWeight: 600,
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
                    padding: "0.55rem 1.15rem",
                    borderRadius: "9999px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 1px 3px rgba(31, 54, 82, 0.04)",
                  }}
                >
                  <Printer size={15} color="#2F80ED" /> Exportar PDF
                </button>
              </>
            )}

            {hasPermission("postventa.manage") && (
              <button
                type="button"
                onClick={() => {
                  setNewIncidentDefaults({ projectId });
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

        {/* Tab Switcher */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            borderBottom: "2px solid #EAEFF5",
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
            }}
          >
            <Wrench size={16} />
            <span>Incidencias ({projectIncidents.length})</span>
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
            <span>Unidades Vendidas & Entregas ({projectSoldUnits.length})</span>
          </button>
        </div>

        {/* TAB 1: INCIDENCIAS */}
        {mainTab === "incidents" && (
          <>
            {/* KPI Cards (matching units/page.tsx standard) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "1rem",
              }}
            >
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "1.1rem",
                  padding: "1.15rem 1.25rem",
                  border: "1px solid #EAEFF5",
                  boxShadow: "0 2px 8px rgba(31, 54, 82, 0.04)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748B", display: "block" }}>
                    Incidencias Abiertas
                  </span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", marginTop: "0.25rem" }}>
                    <span style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1F3652" }}>
                      {kpis.openCases}
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "#64748B" }}>en proceso</span>
                  </div>
                </div>
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
                  <AlertCircle size={20} />
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "1.1rem",
                  padding: "1.15rem 1.25rem",
                  border: "1px solid #EAEFF5",
                  boxShadow: "0 2px 8px rgba(31, 54, 82, 0.04)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748B", display: "block" }}>
                    1ra Respuesta Promedio
                  </span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", marginTop: "0.25rem" }}>
                    <span style={{ fontSize: "1.6rem", fontWeight: 800, color: "#2F80ED" }}>
                      {kpis.firstResponseTime}
                    </span>
                  </div>
                </div>
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
                  <Clock size={20} />
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "1.1rem",
                  padding: "1.15rem 1.25rem",
                  border: "1px solid #EAEFF5",
                  boxShadow: "0 2px 8px rgba(31, 54, 82, 0.04)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748B", display: "block" }}>
                    Tiempo de Resolución
                  </span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", marginTop: "0.25rem" }}>
                    <span style={{ fontSize: "1.6rem", fontWeight: 800, color: "#00C48C" }}>
                      {kpis.avgResolutionTime}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(0, 196, 140, 0.1)",
                    color: "#00C48C",
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
                  padding: "1.15rem 1.25rem",
                  border: "1px solid #EAEFF5",
                  boxShadow: "0 2px 8px rgba(31, 54, 82, 0.04)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748B", display: "block" }}>
                    Casos Vencidos (SLA)
                  </span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", marginTop: "0.25rem" }}>
                    <span
                      style={{
                        fontSize: "1.6rem",
                        fontWeight: 800,
                        color: kpis.expiredCases > 0 ? "#EF4444" : "#00C48C",
                      }}
                    >
                      {kpis.expiredCases}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "10px",
                    backgroundColor: kpis.expiredCases > 0 ? "rgba(239, 68, 68, 0.1)" : "rgba(0, 196, 140, 0.1)",
                    color: kpis.expiredCases > 0 ? "#EF4444" : "#00C48C",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AlertTriangle size={20} />
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                padding: "0.85rem 1.15rem",
                borderRadius: "1rem",
                border: "1px solid #EAEFF5",
                display: "flex",
                flexWrap: "wrap",
                gap: "0.75rem",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: "0 2px 6px rgba(31, 54, 82, 0.02)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  backgroundColor: "#FAFBFD",
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
                    color: "#1F3652",
                  }}
                />
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  style={{
                    padding: "0.45rem 0.75rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.8rem",
                    color: "#1F3652",
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
                </select>

                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  style={{
                    padding: "0.45rem 0.75rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.8rem",
                    color: "#1F3652",
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
              </div>
            </div>

            {/* Table */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "1rem",
                border: "1px solid #EAEFF5",
                boxShadow: "0 2px 8px rgba(31, 54, 82, 0.04)",
                overflow: "hidden",
              }}
            >
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr
                      style={{
                        backgroundColor: "#F8FAFC",
                        borderBottom: "1px solid #EAEFF5",
                        fontSize: "0.75rem",
                        color: "#1F3652",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.03em",
                      }}
                    >
                      <th
                        style={{ padding: "0.85rem 1rem", cursor: "pointer" }}
                        onClick={() => handleSort("folio")}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          Folio <ArrowUpDown size={12} />
                        </div>
                      </th>
                      <th style={{ padding: "0.85rem 1rem" }}>Unidad</th>
                      <th style={{ padding: "0.85rem 1rem" }}>Cliente</th>
                      <th style={{ padding: "0.85rem 1rem" }}>Categoría & Asunto</th>
                      <th style={{ padding: "0.85rem 1rem" }}>Prioridad</th>
                      <th style={{ padding: "0.85rem 1rem" }}>Estado</th>
                      <th style={{ padding: "0.85rem 1rem" }}>Fecha Reporte</th>
                      <th style={{ padding: "0.85rem 1rem" }}>Responsable</th>
                      <th style={{ padding: "0.85rem 1rem", textAlign: "right" }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIncidents.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ padding: "3rem", textAlign: "center", color: "#94A3B8" }}>
                          <Wrench size={36} style={{ margin: "0 auto 0.5rem auto", opacity: 0.5 }} />
                          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1F3652" }}>
                            No hay incidencias registradas en este proyecto
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredIncidents.map((inc, idx) => {
                        const statusPill = getStatusPill(inc.status);
                        const priorityPill = getPriorityPill(inc.priority);
                        const commentsCount = (inc.comments || []).length;
                        const rowBg = idx % 2 === 0 ? "#FFFFFF" : "#FAFBFD";

                        return (
                          <tr
                            key={inc.id}
                            style={{
                              backgroundColor: rowBg,
                              borderBottom: "1px solid #EAEFF5",
                              fontSize: "0.82rem",
                              transition: "background 0.12s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F1F5F9")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = rowBg)}
                          >
                            <td style={{ padding: "0.85rem 1rem", fontWeight: 800, color: "#1F3652" }}>
                              {inc.folio}
                            </td>
                            <td style={{ padding: "0.85rem 1rem", fontWeight: 800, color: "#2F80ED" }}>
                              {inc.unit}
                            </td>
                            <td style={{ padding: "0.85rem 1rem" }}>
                              <div style={{ fontWeight: 700, color: "#1F3652" }}>{inc.clientName}</div>
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
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                  padding: "0.2rem 0.55rem",
                                  borderRadius: "999px",
                                  backgroundColor: priorityPill.bg,
                                  color: priorityPill.color,
                                }}
                              >
                                {priorityPill.text}
                              </span>
                            </td>
                            <td style={{ padding: "0.85rem 1rem" }}>
                              <span
                                style={{
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                  padding: "0.2rem 0.55rem",
                                  borderRadius: "999px",
                                  backgroundColor: statusPill.bg,
                                  color: statusPill.color,
                                  border: `1px solid ${statusPill.border}`,
                                }}
                              >
                                {inc.status}
                              </span>
                            </td>
                            <td style={{ padding: "0.85rem 1rem", color: "#64748B", fontSize: "0.78rem" }}>
                              {formatDateMX(inc.createdAt, "short")}
                            </td>
                            <td style={{ padding: "0.85rem 1rem" }}>
                              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#1F3652" }}>
                                {inc.assignedTo?.name || "Sin asignar"}
                              </div>
                              {commentsCount > 0 && (
                                <div
                                  style={{
                                    fontSize: "0.68rem",
                                    color: "#2F80ED",
                                    marginTop: "2px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "3px",
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
                                  backgroundColor: "rgba(31, 54, 82, 0.05)",
                                  color: "#1F3652",
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
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "1rem",
              }}
            >
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "1.1rem",
                  padding: "1.15rem 1.25rem",
                  border: "1px solid #EAEFF5",
                  boxShadow: "0 2px 8px rgba(31, 54, 82, 0.04)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748B", display: "block" }}>
                    Total Unidades Vendidas
                  </span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", marginTop: "0.25rem" }}>
                    <span style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1F3652" }}>
                      {deliveryKpis.total}
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "#64748B" }}>en {project?.name}</span>
                  </div>
                </div>
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
                  <Building size={20} />
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "1.1rem",
                  padding: "1.15rem 1.25rem",
                  border: "1px solid #EAEFF5",
                  boxShadow: "0 2px 8px rgba(31, 54, 82, 0.04)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748B", display: "block" }}>
                    Unidades Entregadas
                  </span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", marginTop: "0.25rem" }}>
                    <span style={{ fontSize: "1.6rem", fontWeight: 800, color: "#00C48C" }}>
                      {deliveryKpis.delivered}
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "#00C48C", fontWeight: 700 }}>
                      ({deliveryKpis.rate}%)
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(0, 196, 140, 0.1)",
                    color: "#00C48C",
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
                  padding: "1.15rem 1.25rem",
                  border: "1px solid #EAEFF5",
                  boxShadow: "0 2px 8px rgba(31, 54, 82, 0.04)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748B", display: "block" }}>
                    Pendientes de Entrega
                  </span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", marginTop: "0.25rem" }}>
                    <span style={{ fontSize: "1.6rem", fontWeight: 800, color: "#F59E0B" }}>
                      {deliveryKpis.pending}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "10px",
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
                  padding: "1.15rem 1.25rem",
                  border: "1px solid #EAEFF5",
                  boxShadow: "0 2px 8px rgba(31, 54, 82, 0.04)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748B", display: "block" }}>
                    Entregadas con Incidencias
                  </span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", marginTop: "0.25rem" }}>
                    <span
                      style={{
                        fontSize: "1.6rem",
                        fontWeight: 800,
                        color: deliveryKpis.activeWithIssues > 0 ? "#EF4444" : "#00C48C",
                      }}
                    >
                      {deliveryKpis.activeWithIssues}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "10px",
                    backgroundColor: deliveryKpis.activeWithIssues > 0 ? "rgba(239, 68, 68, 0.1)" : "rgba(0, 196, 140, 0.1)",
                    color: deliveryKpis.activeWithIssues > 0 ? "#EF4444" : "#00C48C",
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
                backgroundColor: "#FFFFFF",
                padding: "0.85rem 1.15rem",
                borderRadius: "1rem",
                border: "1px solid #EAEFF5",
                display: "flex",
                flexWrap: "wrap",
                gap: "0.75rem",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: "0 2px 6px rgba(31, 54, 82, 0.02)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  backgroundColor: "#FAFBFD",
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
                  placeholder="Buscar unidad o cliente..."
                  style={{
                    border: "none",
                    backgroundColor: "transparent",
                    outline: "none",
                    fontSize: "0.82rem",
                    width: "100%",
                    color: "#1F3652",
                  }}
                />
              </div>

              <select
                value={deliveryStatusFilter}
                onChange={(e) => setDeliveryStatusFilter(e.target.value as any)}
                style={{
                  padding: "0.45rem 0.75rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #CBD5E1",
                  fontSize: "0.8rem",
                  color: "#1F3652",
                  backgroundColor: "#FFFFFF",
                  outline: "none",
                }}
              >
                <option value="ALL">Todos los Estatus</option>
                <option value="DELIVERED">✓ Solo Entregadas (Garantía Activa)</option>
                <option value="PENDING">⏳ Solo Pendientes de Entrega</option>
              </select>
            </div>

            {/* Table */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "1rem",
                border: "1px solid #EAEFF5",
                boxShadow: "0 2px 8px rgba(31, 54, 82, 0.04)",
                overflow: "hidden",
              }}
            >
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr
                      style={{
                        backgroundColor: "#F8FAFC",
                        borderBottom: "1px solid #EAEFF5",
                        fontSize: "0.75rem",
                        color: "#1F3652",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.03em",
                      }}
                    >
                      <th style={{ padding: "0.85rem 1rem" }}>Unidad</th>
                      <th style={{ padding: "0.85rem 1rem" }}>Propietario / Cliente</th>
                      <th style={{ padding: "0.85rem 1rem" }}>Fecha Venta</th>
                      <th style={{ padding: "0.85rem 1rem" }}>Estatus Entrega</th>
                      <th style={{ padding: "0.85rem 1rem" }}>Fecha Entrega & Garantía</th>
                      <th style={{ padding: "0.85rem 1rem" }}>Incidencias Activas</th>
                      <th style={{ padding: "0.85rem 1rem", textAlign: "right" }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSoldUnits.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: "3rem", textAlign: "center", color: "#94A3B8" }}>
                          <Building size={36} style={{ margin: "0 auto 0.5rem auto", opacity: 0.5 }} />
                          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1F3652" }}>
                            No se encontraron unidades vendidas en este proyecto
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredSoldUnits.map((u, idx) => {
                        const rowBg = idx % 2 === 0 ? "#FFFFFF" : "#FAFBFD";
                        return (
                          <tr
                            key={`${u.projectId}-${u.unitNumber}-${idx}`}
                            style={{
                              backgroundColor: rowBg,
                              borderBottom: "1px solid #EAEFF5",
                              fontSize: "0.82rem",
                              transition: "background 0.12s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F1F5F9")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = rowBg)}
                          >
                            <td style={{ padding: "0.85rem 1rem" }}>
                              <div style={{ fontSize: "0.85rem", color: "#2F80ED", fontWeight: 800 }}>
                                Unidad {u.unitNumber}
                              </div>
                              <div style={{ fontSize: "0.72rem", color: "#64748B" }}>
                                {u.unitType}
                              </div>
                            </td>
                            <td style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652" }}>
                              {u.clientName}
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
                                    backgroundColor: "rgba(0, 196, 140, 0.1)",
                                    color: "#059669",
                                    border: "1px solid rgba(0, 196, 140, 0.3)",
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
                                    backgroundColor: "rgba(245, 158, 11, 0.1)",
                                    color: "#D97706",
                                    border: "1px solid rgba(245, 158, 11, 0.3)",
                                    padding: "0.25rem 0.65rem",
                                    borderRadius: "999px",
                                    fontSize: "0.74rem",
                                    fontWeight: 700,
                                  }}
                                >
                                  <Clock size={12} /> Pendiente
                                </span>
                              )}
                            </td>
                            <td style={{ padding: "0.85rem 1rem" }}>
                              {u.isDelivered ? (
                                <div>
                                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652" }}>
                                    {u.deliveredAt || "Fecha registrada"}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "0.7rem",
                                      color: "#059669",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "3px",
                                    }}
                                  >
                                    <ShieldCheck size={11} /> Garantía activa
                                  </div>
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
                                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                                    color: "#DC2626",
                                    border: "1px solid rgba(239, 68, 68, 0.3)",
                                    borderRadius: "999px",
                                    padding: "0.15rem 0.55rem",
                                    fontSize: "0.72rem",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                  }}
                                >
                                  🔴 {u.activeIncidentsCount} ticket{u.activeIncidentsCount > 1 ? "s" : ""}
                                </button>
                              ) : (
                                <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                                  {u.totalIncidentsCount > 0
                                    ? `0 activas (${u.totalIncidentsCount} resueltas)`
                                    : "Sin incidencias"}
                                </span>
                              )}
                            </td>
                            <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.45rem" }}>
                                <button
                                  type="button"
                                  onClick={() => setDeliveryModalUnit(u)}
                                  style={{
                                    backgroundColor: u.isDelivered ? "#FAFBFD" : "#1B3047",
                                    color: u.isDelivered ? "#1F3652" : "#FFFFFF",
                                    border: "1px solid #CBD5E1",
                                    borderRadius: "0.45rem",
                                    padding: "0.35rem 0.75rem",
                                    fontSize: "0.74rem",
                                    fontWeight: 700,
                                    cursor: "pointer",
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
                                    backgroundColor: "#2F80ED",
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
                                  <Plus size={12} /> Incidencia
                                </button>
                              </div>
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

        {/* Modal: New Incident */}
        <NewIncidentModal
          isOpen={isNewModalOpen}
          onClose={() => {
            setIsNewModalOpen(false);
            setNewIncidentDefaults(undefined);
          }}
          onSave={handleSaveNewIncident}
          defaultProjectId={newIncidentDefaults?.projectId || projectId}
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
