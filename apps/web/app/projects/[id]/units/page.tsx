"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Home,
  Building2,
  DollarSign,
  AlertTriangle,
  Search,
  X,
  Package,
  Layers,
  FileSpreadsheet,
  Download,
  ArrowUpDown,
  Edit3,
} from "lucide-react";
import AppLayout from "../../../../components/layout/app-layout";
import { useProject } from "../../../../context/project-context";
import BulkPriceModal, { UnitItem } from "../../../../components/units/bulk-price-modal";
import EditInventoryGridModal from "../../../../components/units/edit-inventory-grid-modal";
import QuoteUnitWizardModal from "../../../../components/units/quote-unit-wizard-modal";
import UnitDetailHistoryModal from "../../../../components/units/unit-detail-history-modal";
import ManageAdditionalsModal from "../../../../components/units/manage-additionals-modal";
import DownloadExportModal from "../../../../components/units/download-export-modal";
import UploadInventoryModal from "../../../../components/units/upload-inventory-modal";
import FloorPlansViewerModal from "../../../../components/units/floor-plans-viewer-modal";
import CreateSaleWizardModal from "../../../../components/sales/create-sale-wizard-modal";
import EditProjectModal from "../../../../components/projects/edit-project-modal";
import RegisterProgressWizardModal from "../../../../components/projects/register-progress-wizard-modal";
import { CoOwnersMiniCards } from "../../../../components/ui/co-owners-mini-cards";

export default function ProjectUnitsPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = (params?.id as string) || "p-1";
  const { projects, getProject, currency, formatMoney, updateBulkPrices, updateUnit, updateMultipleUnits, bulkImportUnits, bulkImportAdditionals, unsellUnit, addSale, updateProjectProgress, updateProjectAdditionals, showToast, hasPermission } = useProject();

  const project = getProject(projectId);

  // Modales del módulo de Unidades
  const [showBulkPriceModal, setShowBulkPriceModal] = useState(false);
  const [showEditInventoryModal, setShowEditInventoryModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showUnitDetailModal, setShowUnitDetailModal] = useState(false);
  const [showAdditionalsModal, setShowAdditionalsModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFloorPlansModal, setShowFloorPlansModal] = useState(false);
  const [selectedUnitForAction, setSelectedUnitForAction] = useState<UnitItem | null>(null);

  // Modales adicionales de proyecto
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);

  // Filtros & Sorting
  const [unitStatusFilter, setUnitStatusFilter] = useState("ALL");
  const [unitSearchQuery, setUnitSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"unit" | "type" | "areaM2" | "price" | "status" | "client">("unit");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleOpenUnitDetail = (unit: UnitItem) => {
    setSelectedUnitForAction(unit);
    setShowUnitDetailModal(true);
  };

  const handleOpenQuoteWizard = (unit: UnitItem) => {
    setSelectedUnitForAction(unit);
    setShowQuoteModal(true);
  };

  // Redirigir al estado de cuenta del cliente (o titular principal en copropiedad) para unidades vendidas
  const handleNavigateToClient = (unit: UnitItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // 1. Buscar en project.sales
    const matchedSale = (project?.sales || []).find(
      (s) =>
        s.status !== "CANCELADA" &&
        (s.unit === unit.unit || (typeof s.unit === "object" && (s.unit as any)?.unitNumber === unit.unit))
    );

    if (matchedSale) {
      if (matchedSale.coOwners && matchedSale.coOwners.length > 0) {
        const primaryCo = matchedSale.coOwners.find((co: any) => co.isPrimary) || matchedSale.coOwners[0];
        const targetId = primaryCo?.id || primaryCo?.email || primaryCo?.name;
        if (targetId) {
          router.push(`/projects/${projectId}/clients/${encodeURIComponent(targetId)}?unit=${encodeURIComponent(unit.unit)}`);
          return;
        }
      }

      const targetId =
        (matchedSale.clientId && matchedSale.clientId !== "primary-1" ? matchedSale.clientId : null) ||
        (matchedSale as any).primaryClientId ||
        matchedSale.clientEmail ||
        matchedSale.clientName;

      if (targetId) {
        router.push(`/projects/${projectId}/clients/${encodeURIComponent(targetId)}?unit=${encodeURIComponent(unit.unit)}`);
        return;
      }
    }

    // 2. Buscar en unit.coOwners
    if (unit.coOwners && unit.coOwners.length > 0) {
      const primaryCo = unit.coOwners.find((co: any) => co.isPrimary) || unit.coOwners[0];
      const targetId = primaryCo?.id || primaryCo?.email || primaryCo?.name;
      if (targetId) {
        router.push(`/projects/${projectId}/clients/${encodeURIComponent(targetId)}?unit=${encodeURIComponent(unit.unit)}`);
        return;
      }
    }

    // 3. Buscar en project.clients
    const matchedClient = (project?.clients || []).find((c) =>
      c.ownedUnits?.some((ou) => ou.unit.toLowerCase().trim() === unit.unit.toLowerCase().trim())
    );
    if (matchedClient) {
      const targetId = matchedClient.id || matchedClient.email || matchedClient.name;
      router.push(`/projects/${projectId}/clients/${encodeURIComponent(targetId)}?unit=${encodeURIComponent(unit.unit)}`);
      return;
    }

    // 4. Si tiene nombre de cliente asignado
    if (unit.client && unit.client !== "-" && unit.client !== "Sin asignar") {
      router.push(`/projects/${projectId}/clients/${encodeURIComponent(unit.client)}?unit=${encodeURIComponent(unit.unit)}`);
      return;
    }

    // Fallback si no está vendida o no tiene cliente
    handleOpenUnitDetail(unit);
  };

  const handleApplyPriceAdjustment = (updatedUnits: UnitItem[], logSummary: string) => {
    if (!project) return;
    updateMultipleUnits(project.id, updatedUnits);
    showToast("Ajuste de Precios Aplicado", logSummary);
  };

  const handleSaveInventoryGrid = (updatedUnits: UnitItem[]) => {
    if (!project) return;
    updateMultipleUnits(project.id, updatedUnits);
    showToast("Inventario Actualizado", `Se guardaron los cambios en ${updatedUnits.length} unidades.`);
  };

  const handleSaveSingleUnit = (updatedFields: any) => {
    if (!project) return;
    if (selectedUnitForAction) {
      updateUnit(project.id, selectedUnitForAction.unit, updatedFields);
      showToast("Unidad Actualizada", `Se guardaron los cambios de la unidad ${selectedUnitForAction.unit}.`);
    }
  };

  const unitsList = project?.unitsInventory || [];

  if (!project) return null;

  if (!hasPermission("units.view")) {
    return (
      <AppLayout activeProjectId={projectId} projectSubTab="units">
        <main style={{ padding: "3rem 2rem", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#FEE2E2", color: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
            <AlertTriangle size={32} />
          </div>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1F3652", marginBottom: "0.5rem" }}>
            Módulo No Autorizado
          </h2>
          <p style={{ fontSize: "0.85rem", color: "#64748B", maxWidth: "420px", lineHeight: 1.5 }}>
            Tu usuario no cuenta con el permiso requerido (<strong>units.view</strong>) para consultar el inventario de unidades de este proyecto.
          </p>
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      activeProjectId={projectId}
      projectSubTab="units"
      onOpenBulkPrice={() => setShowBulkPriceModal(true)}
      onOpenEditInventory={() => setShowEditInventoryModal(true)}
      onOpenNewSale={() => setShowNewSaleModal(true)}
      onOpenEditProject={() => setShowEditProjectModal(true)}
      onOpenProgress={() => setShowProgressModal(true)}
    >
      <main style={{ padding: "1.25rem 2rem 2rem 2rem", flex: 1, overflowY: "auto" }}>
        {/* 4 STAT KPI CARDS (Foto 1: Total, Disponibles, Vendidas, Bloqueadas) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.25rem" }}>
          {/* 1. Total de Unidades */}
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
                Total de Unidades
              </span>
              <h3 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1F3652", margin: 0, lineHeight: 1 }}>
                {unitsList.length}
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
              <Home size={22} />
            </div>
          </div>

          {/* 2. Unidades Disponibles */}
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
                Unidades Disponibles
              </span>
              <h3 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1F3652", margin: 0, lineHeight: 1 }}>
                {unitsList.filter((u) => u.status === "DISPONIBLE").length}
              </h3>
            </div>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "0.75rem",
                backgroundColor: "rgba(47, 128, 237, 0.08)",
                color: "#2F80ED",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Building2 size={22} />
            </div>
          </div>

          {/* 3. Unidades Vendidas */}
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
                Unidades Vendidas
              </span>
              <h3 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1F3652", margin: 0, lineHeight: 1 }}>
                {unitsList.filter((u) => u.status === "VENDIDA").length}
              </h3>
            </div>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "0.75rem",
                backgroundColor: "rgba(0, 196, 140, 0.1)",
                color: "#00C48C",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <DollarSign size={22} />
            </div>
          </div>

          {/* 4. Unidades Bloqueadas */}
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
                Unidades bloqueadas
              </span>
              <h3 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1F3652", margin: 0, lineHeight: 1 }}>
                {unitsList.filter((u) => u.status === "BLOQUEADA").length}
              </h3>
            </div>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "0.75rem",
                backgroundColor: "rgba(224, 83, 69, 0.1)",
                color: "#E05345",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AlertTriangle size={22} />
            </div>
          </div>
        </div>

        {/* BARRA DE BÚSQUEDA Y ACCIONES (Foto 1) */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "1rem",
            padding: "0.85rem 1.25rem",
            marginBottom: "1rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            border: "1px solid rgba(22, 43, 63, 0.05)",
          }}
        >
          {/* Input Buscar por # Unidad */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flex: 1, maxWidth: "340px", backgroundColor: "#F8FAFC", padding: "0.55rem 0.85rem", borderRadius: "9999px", border: "1px solid #E2E8F0" }}>
            <Search size={16} color="#8B9BB0" />
            <input
              type="text"
              placeholder="Buscar por # Unidad, cliente o tipo..."
              value={unitSearchQuery}
              onChange={(e) => setUnitSearchQuery(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                backgroundColor: "transparent",
                fontSize: "0.85rem",
                color: "#1F3652",
                width: "100%",
              }}
            />
            {unitSearchQuery && (
              <button
                type="button"
                onClick={() => setUnitSearchQuery("")}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#8B9BB0" }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filtros rápidos de estado (Pills) */}
          <div style={{ display: "flex", gap: "0.35rem" }}>
            {["ALL", "DISPONIBLE", "VENDIDA", "BLOQUEADA"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setUnitStatusFilter(st)}
                style={{
                  padding: "0.35rem 0.75rem",
                  borderRadius: "9999px",
                  border: "none",
                  backgroundColor: unitStatusFilter === st ? "#1B3047" : "#F1F5F9",
                  color: unitStatusFilter === st ? "#FFFFFF" : "#64748B",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {st === "ALL" ? "Todas" : st === "DISPONIBLE" ? "Disponibles" : st === "VENDIDA" ? "Vendidas" : "Bloqueadas"}
              </button>
            ))}
          </div>

          {/* Botones de Acción Derecha */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {hasPermission("projects.catalog_manage") && (
              <button
                type="button"
                onClick={() => setShowAdditionalsModal(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.5rem 1rem",
                  borderRadius: "9999px",
                  backgroundColor: "#1B3047",
                  color: "#FFFFFF",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(27, 48, 71, 0.15)",
                }}
              >
                <Package size={15} /> Adicionales
                {project.additionals && project.additionals.length > 0 && (
                  <span
                    style={{
                      backgroundColor: "#00C48C",
                      color: "#1F3652",
                      fontSize: "0.68rem",
                      fontWeight: 800,
                      padding: "0.1rem 0.45rem",
                      borderRadius: "9999px",
                      marginLeft: "0.2rem",
                    }}
                  >
                    {project.additionals.length}
                  </span>
                )}
              </button>
            )}

            {hasPermission("projects.catalog_manage") && (
              <button
                type="button"
                onClick={() => setShowFloorPlansModal(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.5rem 1rem",
                  borderRadius: "9999px",
                  backgroundColor: "#1B3047",
                  color: "#FFFFFF",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(27, 48, 71, 0.15)",
                }}
              >
                <Layers size={15} /> Plantas Conjunto
              </button>
            )}

            {hasPermission("units.bulk_import") && (
              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.5rem 1rem",
                  borderRadius: "9999px",
                  backgroundColor: "#1B3047",
                  color: "#FFFFFF",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(27, 48, 71, 0.15)",
                }}
              >
                <FileSpreadsheet size={15} /> Subir (.xlsx)
              </button>
            )}

            {hasPermission("units.export") && (
              <button
                type="button"
                onClick={() => setShowDownloadModal(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.5rem 1.1rem",
                  borderRadius: "9999px",
                  backgroundColor: "#1B3047",
                  color: "#FFFFFF",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(27, 48, 71, 0.15)",
                }}
              >
                <Download size={15} /> Descargar
              </button>
            )}
          </div>
        </div>

        {/* TABLA DE INVENTARIO CON SORTING POR COLUMNA (Foto 1) */}
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
                  onClick={() => {
                    if (sortField === "unit") setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                    else { setSortField("unit"); setSortDirection("asc"); }
                  }}
                  style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652", cursor: "pointer", userSelect: "none" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    Numero {sortField === "unit" && <ArrowUpDown size={12} color="#1B3047" />}
                  </div>
                </th>

                <th
                  onClick={() => {
                    if (sortField === "type") setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                    else { setSortField("type"); setSortDirection("asc"); }
                  }}
                  style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652", cursor: "pointer", userSelect: "none" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    Tipo {sortField === "type" && <ArrowUpDown size={12} color="#1B3047" />}
                  </div>
                </th>

                <th
                  onClick={() => {
                    if (sortField === "areaM2") setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                    else { setSortField("areaM2"); setSortDirection("asc"); }
                  }}
                  style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652", cursor: "pointer", userSelect: "none" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    Superficie (m²) {sortField === "areaM2" && <ArrowUpDown size={12} color="#1B3047" />}
                  </div>
                </th>

                <th
                  onClick={() => {
                    if (sortField === "price") setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                    else { setSortField("price"); setSortDirection("asc"); }
                  }}
                  style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652", cursor: "pointer", userSelect: "none" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    Precio {sortField === "price" && <ArrowUpDown size={12} color="#1B3047" />}
                  </div>
                </th>

                <th
                  onClick={() => {
                    if (sortField === "status") setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                    else { setSortField("status"); setSortDirection("asc"); }
                  }}
                  style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652", cursor: "pointer", userSelect: "none" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    Estado {sortField === "status" && <ArrowUpDown size={12} color="#1B3047" />}
                  </div>
                </th>

                <th
                  onClick={() => {
                    if (sortField === "client") setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                    else { setSortField("client"); setSortDirection("asc"); }
                  }}
                  style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652", cursor: "pointer", userSelect: "none" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    Cliente {sortField === "client" && <ArrowUpDown size={12} color="#1B3047" />}
                  </div>
                </th>

                <th style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652", textAlign: "center" }}>
                  Editar
                </th>

                <th style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652", textAlign: "center" }}>
                  Cotización
                </th>
              </tr>
            </thead>
            <tbody>
              {unitsList
                .filter((u) => {
                  if (unitStatusFilter !== "ALL" && u.status !== unitStatusFilter) return false;
                  if (!unitSearchQuery.trim()) return true;
                  const q = unitSearchQuery.toLowerCase();
                  return (
                    u.unit.toLowerCase().includes(q) ||
                    (u.client && u.client.toLowerCase().includes(q)) ||
                    u.type.toLowerCase().includes(q)
                  );
                })
                .sort((a, b) => {
                  if (sortField === "unit") {
                    return sortDirection === "asc"
                      ? a.unit.localeCompare(b.unit, undefined, { numeric: true, sensitivity: "base" })
                      : b.unit.localeCompare(a.unit, undefined, { numeric: true, sensitivity: "base" });
                  }
                  if (sortField === "areaM2" || sortField === "price") {
                    const numA = Number(a[sortField]) || 0;
                    const numB = Number(b[sortField]) || 0;
                    return sortDirection === "asc" ? numA - numB : numB - numA;
                  }
                  let valA = (a[sortField] || "").toString().toLowerCase();
                  let valB = (b[sortField] || "").toString().toLowerCase();
                  if (valA < valB) return sortDirection === "asc" ? -1 : 1;
                  if (valA > valB) return sortDirection === "asc" ? 1 : -1;
                  return 0;
                })
                .map((u, i) => (
                  <tr
                    key={u.id || i}
                    onClick={() => {
                      if (u.status === "VENDIDA") {
                        handleNavigateToClient(u);
                      } else {
                        handleOpenUnitDetail(u);
                      }
                    }}
                    style={{
                      borderBottom: "1px solid #EAEFF5",
                      backgroundColor: i % 2 === 0 ? "#FFFFFF" : "#FAFBFD",
                      transition: "background-color 0.15s ease",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(31, 54, 82, 0.04)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = i % 2 === 0 ? "#FFFFFF" : "#FAFBFD")}
                  >
                    {/* 1. Numero */}
                    <td style={{ padding: "0.85rem 1rem", fontWeight: 800, color: "#1F3652" }}>
                      {u.unit}
                    </td>

                    {/* 2. Tipo */}
                    <td style={{ padding: "0.85rem 1rem", color: "#64748B", fontWeight: 500 }}>
                      {u.type}
                    </td>

                    {/* 3. Superficie */}
                    <td style={{ padding: "0.85rem 1rem", color: "#1F3652", fontWeight: 600 }}>
                      {u.areaM2}
                    </td>

                    {/* 4. Precio */}
                    <td style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652" }}>
                      {formatMoney(u.price)}
                    </td>

                    {/* 5. Estado */}
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "0.3rem 0.85rem",
                          borderRadius: "9999px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          backgroundColor:
                            u.status === "VENDIDA"
                              ? "#0F2942"
                              : u.status === "BLOQUEADA"
                              ? "#EF4444"
                              : u.status === "APARTADA"
                              ? "#F59E0B"
                              : "#10B981",
                          color: "#FFFFFF",
                        }}
                      >
                        {u.status === "DISPONIBLE"
                          ? "Disponible"
                          : u.status === "VENDIDA"
                          ? "Vendida"
                          : u.status === "BLOQUEADA"
                          ? "Bloqueada"
                          : "Apartada"}
                      </span>
                    </td>

                    {/* 6. Cliente / Copropiedad */}
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <CoOwnersMiniCards
                        clientName={u.client}
                        coOwners={u.coOwners}
                        onCoOwnerClick={u.status === "VENDIDA" ? (co, e) => {
                          e.stopPropagation();
                          const targetId = co.id || co.email || co.name;
                          router.push(`/projects/${projectId}/clients/${encodeURIComponent(targetId)}?unit=${encodeURIComponent(u.unit)}`);
                        } : undefined}
                      />
                    </td>

                    {/* 7. Editar / Ver estado de cuenta */}
                    <td style={{ padding: "0.85rem 1rem", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (u.status === "VENDIDA") {
                            handleNavigateToClient(u, e);
                          } else {
                            handleOpenUnitDetail(u);
                          }
                        }}
                        title={u.status === "VENDIDA" ? "Ver estado de cuenta de la unidad vendida" : "Editar información de la unidad"}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "#1B3047",
                          color: "#FFFFFF",
                          padding: "0.45rem 1.25rem",
                          borderRadius: "9999px",
                          border: "none",
                          cursor: "pointer",
                          boxShadow: "0 2px 4px rgba(27, 48, 71, 0.15)",
                          transition: "transform 0.15s ease",
                        }}
                      >
                        <Edit3 size={14} />
                      </button>
                    </td>

                    {/* 8. Cotización */}
                    <td style={{ padding: "0.85rem 1rem", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                      {hasPermission("units.quote") ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenQuoteWizard(u);
                          }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#1B3047",
                            color: "#FFFFFF",
                            padding: "0.45rem 1.25rem",
                            borderRadius: "9999px",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            boxShadow: "0 2px 4px rgba(27, 48, 71, 0.15)",
                            transition: "transform 0.15s ease",
                          }}
                        >
                          Cotizar
                        </button>
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>-</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modales del Módulo de Unidades */}
      {showBulkPriceModal && (
        <BulkPriceModal
          isOpen={showBulkPriceModal}
          onClose={() => setShowBulkPriceModal(false)}
          units={unitsList}
          currency={currency}
          onApplyAdjustment={handleApplyPriceAdjustment}
        />
      )}

      {showEditInventoryModal && (
        <EditInventoryGridModal
          isOpen={showEditInventoryModal}
          onClose={() => setShowEditInventoryModal(false)}
          initialUnits={unitsList}
          project={project}
          currency={currency}
          onSaveUnits={handleSaveInventoryGrid}
        />
      )}

      {showQuoteModal && selectedUnitForAction && (
        <QuoteUnitWizardModal
          isOpen={showQuoteModal}
          onClose={() => {
            setShowQuoteModal(false);
            setSelectedUnitForAction(null);
          }}
          unit={selectedUnitForAction}
          projectName={project.name}
          currency={currency}
          initialAdditionals={project.additionals || []}
          onQuoteGenerated={(quoteData) => {
            setShowQuoteModal(false);
            setSelectedUnitForAction(null);
            showToast("Cotización Generada", `PDF emitido para ${quoteData.clientName || "cliente"}.`);
          }}
        />
      )}

      {showUnitDetailModal && selectedUnitForAction && (
        <UnitDetailHistoryModal
          isOpen={showUnitDetailModal}
          onClose={() => {
            setShowUnitDetailModal(false);
            setSelectedUnitForAction(null);
          }}
          unit={selectedUnitForAction}
          project={project}
          currency={currency}
          additionals={project.additionals || []}
          onSaveUnit={handleSaveSingleUnit}
          onInitiateSale={(unit) => {
            setSelectedUnitForAction(unit);
            setShowUnitDetailModal(false);
            setShowNewSaleModal(true);
          }}
          onInitiateQuote={(unit) => {
            setSelectedUnitForAction(unit);
            setShowUnitDetailModal(false);
            setShowQuoteModal(true);
          }}
        />
      )}

      {showAdditionalsModal && (
        <ManageAdditionalsModal
          isOpen={showAdditionalsModal}
          onClose={() => setShowAdditionalsModal(false)}
          currency={currency}
          initialAdditionals={project.additionals || []}
          onSaveAdditionals={(updated) => {
            updateProjectAdditionals(project.id, updated);
            showToast("Adicionales Actualizados", `Se guardaron los cambios en los adicionales (${updated.length} items).`);
          }}
        />
      )}

      {showDownloadModal && (
        <DownloadExportModal
          isOpen={showDownloadModal}
          onClose={() => setShowDownloadModal(false)}
          units={unitsList}
          projectName={project.name}
          currency={currency}
        />
      )}

      {showUploadModal && (
        <UploadInventoryModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onImportUnits={(importedUnits) => {
            bulkImportUnits(project.id, importedUnits as any);
          }}
          onImportAddons={(importedAddons) => {
            bulkImportAdditionals(project.id, importedAddons);
          }}
        />
      )}

      {showFloorPlansModal && (
        <FloorPlansViewerModal
          isOpen={showFloorPlansModal}
          onClose={() => setShowFloorPlansModal(false)}
          project={project}
          onOpenUnitDetail={(unit) => {
            setShowFloorPlansModal(false);
            if (unit.status === "VENDIDA") {
              handleNavigateToClient(unit);
            } else {
              handleOpenUnitDetail(unit);
            }
          }}
          onOpenQuoteWizard={(unit) => {
            setShowFloorPlansModal(false);
            handleOpenQuoteWizard(unit);
          }}
          onOpenNewSale={(unit) => {
            setShowFloorPlansModal(false);
            setSelectedUnitForAction(unit);
            setShowNewSaleModal(true);
          }}
        />
      )}

      {/* Modales Proyecto */}
      {showNewSaleModal && (
        <CreateSaleWizardModal
          isOpen={showNewSaleModal}
          onClose={() => setShowNewSaleModal(false)}
          currency={currency}
          initialProjectId={project.id}
          projects={projects}
          onSaleCreated={(saleData) => {
            setShowNewSaleModal(false);
          }}
        />
      )}

      {showEditProjectModal && (
        <EditProjectModal
          isOpen={showEditProjectModal}
          onClose={() => setShowEditProjectModal(false)}
          project={project}
          onSave={() => {
            setShowEditProjectModal(false);
            showToast("Proyecto Actualizado", "La información general y el equipo han sido guardados.");
          }}
        />
      )}

      {showProgressModal && (
        <RegisterProgressWizardModal
          isOpen={showProgressModal}
          onClose={() => setShowProgressModal(false)}
          project={project}
          projectName={project.name}
          currentProgressPct={project.progressPct}
          onProgressSaved={() => {
            setShowProgressModal(false);
          }}
        />
      )}
    </AppLayout>
  );
}
