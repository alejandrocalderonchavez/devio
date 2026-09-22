"use client";

import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  CreditCard,
  Search,
  Download,
  ArrowUpDown,
  Calendar,
  Plus,
  DollarSign,
  X,
  FileSpreadsheet,
  Printer,
  FileText,
  CheckCircle2,
  Building2,
  User,
  ShieldCheck,
  Package,
  Box,
  Edit3,
} from "lucide-react";
import AppLayout from "../../../../components/layout/app-layout";
import { useProject } from "../../../../context/project-context";
import { INITIAL_SALES, SaleRecord, UnitItem, CoOwner } from "../../../../data/projects-data";
import CreateSaleWizardModal from "../../../../components/sales/create-sale-wizard-modal";
import { EditSaleModal } from "../../../../components/sales/edit-sale-modal";
import { exportTableToExcel, exportTableToPDF } from "../../../../lib/export-utils";

export default function ProjectSalesPage() {
  const params = useParams();
  const projectId = (params?.id as string) || "p-1";
  const { projects, getProject, formatMoney, updateUnit, updateProjectAdditionals, showToast, hasPermission } = useProject();
  const project = getProject(projectId);

  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<keyof SaleRecord>("saleDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [dateRangeFilter, setDateRangeFilter] = useState<{ start: string; end: string; label: string }>({
    start: "2026-08-14",
    end: "2026-09-17",
    label: "18 Ago 2026 - 17 Sep 2026",
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);
  const [showEditSaleModal, setShowEditSaleModal] = useState(false);
  const [saleToEdit, setSaleToEdit] = useState<SaleRecord | null>(null);
  const [localSales, setLocalSales] = useState<SaleRecord[] | null>(null);

  // Sales List dynamically derived from project inventory & active sales
  const derivedSales = useMemo<SaleRecord[]>(() => {
    if (!project || !project.unitsInventory) return [];

    const soldUnitsMap = new Map<string, UnitItem>();
    project.unitsInventory.forEach((u) => {
      if (u.status === "VENDIDA") soldUnitsMap.set(u.unit, u);
    });

    // 1. Process from real project.sales
    if (project.sales && project.sales.length > 0) {
      const activeSales = project.sales.filter(
        (s) => s.status !== "CANCELADA" && soldUnitsMap.has(s.unit)
      ).map((s) => {
        const matchingAddons = s.additionals && s.additionals.length > 0
          ? s.additionals
          : (project.additionals || []).filter((a) => a.assignedToUnit === s.unit);
        return {
          ...s,
          additionals: matchingAddons,
        };
      });
      if (activeSales.length > 0) {
        return activeSales;
      }
    }

    // 2. Fallback to sold units in inventory
    const soldUnits = Array.from(soldUnitsMap.values());
    return soldUnits.map((u, i) => {
      const isCoOwnership = (u.coOwners && u.coOwners.length > 1) || false;
      const clientName = u.client && u.client !== "-" ? u.client : "Cliente Propietario";
      const downPayment = u.salePaidAmount !== undefined ? u.salePaidAmount : Math.round(u.price * 0.2);
      const pending = u.salePendingAmount !== undefined ? u.salePendingAmount : Math.max(0, u.price - downPayment);
      const formattedDate = u.saleDate
        ? (u.saleDate.includes("-") ? new Date(u.saleDate).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "2-digit" }) : u.saleDate)
        : "17/09/26";
      const matchingAddons = (project.additionals || []).filter((a) => a.assignedToUnit === u.unit);

      return {
        id: `sale-${u.unit}-${i}`,
        folio: u.saleFolio || `VTA-2026-${(100 + i * 15).toString().padStart(3, "0")}`,
        clientName,
        clientEmail: u.coOwners?.[0]?.email || "-",
        clientPhone: u.coOwners?.[0]?.phone || "-",
        unit: u.unit,
        paymentPlan: u.salePlanName || "Plan Tradicional (20/80)",
        totalPrice: u.price,
        paidAmount: downPayment,
        pendingAmount: pending,
        saleDate: formattedDate,
        status: "ACTIVA" as const,
        isCoOwnership,
        additionals: matchingAddons,
        coOwnersSummary: isCoOwnership
          ? u.coOwners?.map((c: CoOwner) => `${c.name} (${c.ownershipPct}%)`).join(" + ")
          : undefined,
      };
    });
  }, [project]);

  const sales = localSales ?? derivedSales;

  // Sorting handler
  const handleSort = (field: keyof SaleRecord) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filtered and sorted sales
  const processedSales = useMemo(() => {
    let result = [...sales];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.clientName.toLowerCase().includes(q) ||
          s.unit.toLowerCase().includes(q) ||
          s.folio.toLowerCase().includes(q) ||
          s.paymentPlan.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];

      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }

      const strA = String(valA || "").toLowerCase();
      const strB = String(valB || "").toLowerCase();
      return sortDirection === "asc" ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });

    return result;
  }, [sales, searchQuery, sortField, sortDirection]);

  // Export handlers
  const handleExportExcel = () => {
    if (!project) return;
    const data = processedSales.map((s) => ({
      Folio: s.folio,
      Cliente: s.clientName,
      Unidad: s.unit,
      "Plan de Pago": s.paymentPlan,
      "Precio Total": s.totalPrice,
      "Monto Pagado": s.paidAmount,
      "Monto Pendiente": s.pendingAmount,
      "Fecha de Venta": s.saleDate,
      Estado: s.status,
    }));
    exportTableToExcel(data, `Ventas_${project.name}_${new Date().toISOString().slice(0, 10)}`);
    showToast("Excel Exportado", "El libro de ventas se descargó correctamente.");
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    if (!project) return;
    const headers = ["Folio", "Cliente", "Unidad", "Plan", "Precio Total", "Pagado", "Pendiente", "Fecha", "Estado"];
    const rows = processedSales.map((s) => [
      s.folio,
      s.clientName,
      s.unit,
      s.paymentPlan,
      formatMoney(s.totalPrice),
      formatMoney(s.paidAmount),
      formatMoney(s.pendingAmount),
      s.saleDate,
      s.status,
    ]);
    const totalVendido = processedSales.reduce((sum, s) => sum + s.totalPrice, 0);
    const totalCobrado = processedSales.reduce((sum, s) => sum + s.paidAmount, 0);
    const summary = `Total de Ventas: ${processedSales.length} | Valor Facturado: ${formatMoney(totalVendido)} | Total Cobrado: ${formatMoney(totalCobrado)}`;
    exportTableToPDF("Libro de Ventas y Contratos", project.name, headers, rows, summary);
    showToast("PDF Generado", "Se abrió la ventana para imprimir/guardar PDF.");
    setShowExportMenu(false);
  };

  const handleSaleCreated = (salePayload: any) => {
    setShowNewSaleModal(false);
  };

  if (!project) return null;

  if (!hasPermission("sales.view")) {
    return (
      <AppLayout activeProjectId={projectId} projectSubTab="sales">
        <main style={{ padding: "3rem 2rem", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#FEE2E2", color: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
            <CreditCard size={32} />
          </div>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1F3652", marginBottom: "0.5rem" }}>
            Módulo No Autorizado
          </h2>
          <p style={{ fontSize: "0.85rem", color: "#64748B", maxWidth: "420px", lineHeight: 1.5 }}>
            Tu usuario no cuenta con el permiso requerido (<strong>sales.view</strong>) para consultar el libro de ventas y contratos de este proyecto.
          </p>
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout activeProjectId={projectId} projectSubTab="sales">
      <main style={{ padding: "1.25rem 2rem 2rem 2rem", flex: 1, overflowY: "auto" }}>
        
        {/* ENCABEZADO PRINCIPAL (Exacto a Screenshot 2) */}
        <div style={{ marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
              Ventas
            </h1>
          </div>
        </div>

        {/* CONTENEDOR PRINCIPAL BLANCO */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "1.25rem",
            padding: "1.5rem",
            boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
            border: "1px solid rgba(22, 43, 63, 0.05)",
          }}
        >
          {/* BARRA SUPERIOR: BUSCADOR + FECHA + NUEVA VENTA + DESCARGAR */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
            {/* Input Buscar por cliente */}
            <div style={{ position: "relative", flex: 1, maxWidth: "420px" }}>
              <Search
                size={18}
                style={{
                  position: "absolute",
                  left: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94A3B8",
                  pointerEvents: "none",
                }}
              />
              <input
                type="text"
                placeholder="Buscar por cliente"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.65rem 1rem 0.65rem 2.75rem",
                  borderRadius: "9999px",
                  border: "1px solid #E2E8F0",
                  backgroundColor: "#FFFFFF",
                  fontSize: "0.85rem",
                  color: "#1F3652",
                  outline: "none",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  style={{
                    position: "absolute",
                    right: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#94A3B8",
                    cursor: "pointer",
                  }}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Selector de Rango de Fechas (18 Ago 2026 - 17 Sep 2026) */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    padding: "0.6rem 1.1rem",
                    borderRadius: "9999px",
                    border: "1px solid #E2E8F0",
                    backgroundColor: "#FFFFFF",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: "#1F3652",
                    cursor: "pointer",
                  }}
                >
                  {dateRangeFilter.label}
                </button>

                {showDatePicker && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "calc(100% + 6px)",
                      backgroundColor: "#FFFFFF",
                      borderRadius: "0.85rem",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                      border: "1px solid #E2E8F0",
                      padding: "0.5rem",
                      zIndex: 50,
                      minWidth: "220px",
                    }}
                  >
                    {[
                      { label: "18 Ago 2026 - 17 Sep 2026", start: "2026-08-18", end: "2026-09-17" },
                      { label: "Últimos 30 días", start: "2026-08-17", end: "2026-09-17" },
                      { label: "Mes Actual (Septiembre)", start: "2026-09-01", end: "2026-09-30" },
                      { label: "Año Completo 2026", start: "2026-01-01", end: "2026-12-31" },
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setDateRangeFilter(preset);
                          setShowDatePicker(false);
                        }}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "0.5rem 0.85rem",
                          borderRadius: "0.5rem",
                          border: "none",
                          background: dateRangeFilter.label === preset.label ? "rgba(31, 54, 82, 0.08)" : "transparent",
                          color: dateRangeFilter.label === preset.label ? "#1F3652" : "#64748B",
                          fontSize: "0.8rem",
                          fontWeight: dateRangeFilter.label === preset.label ? 700 : 500,
                          cursor: "pointer",
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Botón $ Nueva Venta */}
              {hasPermission("sales.create") && (
                <button
                  type="button"
                  onClick={() => setShowNewSaleModal(true)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    backgroundColor: "#1B3047",
                    color: "#FFFFFF",
                    padding: "0.6rem 1.4rem",
                    borderRadius: "9999px",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(27, 48, 71, 0.15)",
                  }}
                >
                  <DollarSign size={15} /> Nueva Venta
                </button>
              )}

              {/* Botón Descargar Ventas (Excel / PDF) */}
              {hasPermission("sales.export") && (
                <div style={{ position: "relative" }}>
                  <button
                    type="button"
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.45rem",
                      backgroundColor: "#1B3047",
                      color: "#FFFFFF",
                      padding: "0.6rem 1.4rem",
                      borderRadius: "9999px",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(27, 48, 71, 0.15)",
                    }}
                  >
                    <Download size={15} /> Descargar Ventas (Excel)
                  </button>

                {showExportMenu && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "calc(100% + 6px)",
                      backgroundColor: "#FFFFFF",
                      borderRadius: "0.85rem",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                      border: "1px solid #E2E8F0",
                      padding: "0.4rem",
                      zIndex: 50,
                      minWidth: "200px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={handleExportExcel}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "0.6rem 0.85rem",
                        borderRadius: "0.5rem",
                        border: "none",
                        background: "transparent",
                        color: "#1F3652",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <FileSpreadsheet size={16} color="#00C48C" /> Exportar a Excel (.xlsx)
                    </button>
                    <button
                      type="button"
                      onClick={handleExportPDF}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "0.6rem 0.85rem",
                        borderRadius: "0.5rem",
                        border: "none",
                        background: "transparent",
                        color: "#1F3652",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <Printer size={16} color="#2F80ED" /> Imprimir / Exportar a PDF
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

          {/* TABLA DE VENTAS (Exacta a Screenshot 2) */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, textAlign: "left" }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: "#1B3047",
                    color: "#FFFFFF",
                  }}
                >
                  <th
                    onClick={() => handleSort("clientName")}
                    style={{
                      padding: "0.85rem 1.25rem",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      borderTopLeftRadius: "0.75rem",
                      borderBottomLeftRadius: "0.75rem",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      Nombre
                      <ArrowUpDown size={13} style={{ opacity: sortField === "clientName" ? 1 : 0.4 }} />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort("unit")}
                    style={{
                      padding: "0.85rem 1rem",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      Unidad
                      <ArrowUpDown size={13} style={{ opacity: sortField === "unit" ? 1 : 0.4 }} />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort("paymentPlan")}
                    style={{
                      padding: "0.85rem 1rem",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      Plan de pago
                      <ArrowUpDown size={13} style={{ opacity: sortField === "paymentPlan" ? 1 : 0.4 }} />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort("totalPrice")}
                    style={{
                      padding: "0.85rem 1rem",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      userSelect: "none",
                      textAlign: "right",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.4rem" }}>
                      Precio total
                      <ArrowUpDown size={13} style={{ opacity: sortField === "totalPrice" ? 1 : 0.4 }} />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort("paidAmount")}
                    style={{
                      padding: "0.85rem 1rem",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      userSelect: "none",
                      textAlign: "right",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.4rem" }}>
                      Pagado
                      <ArrowUpDown size={13} style={{ opacity: sortField === "paidAmount" ? 1 : 0.4 }} />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort("pendingAmount")}
                    style={{
                      padding: "0.85rem 1rem",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      userSelect: "none",
                      textAlign: "right",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.4rem" }}>
                      Por pagar
                      <ArrowUpDown size={13} style={{ opacity: sortField === "pendingAmount" ? 1 : 0.4 }} />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort("saleDate")}
                    style={{
                      padding: "0.85rem 1.25rem",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      userSelect: "none",
                      textAlign: "right",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.4rem" }}>
                      Fecha de venta
                      <ArrowUpDown size={13} style={{ opacity: sortField === "saleDate" ? 1 : 0.4 }} />
                    </div>
                  </th>

                  <th
                    style={{
                      padding: "0.85rem 1.25rem",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      borderTopRightRadius: "0.75rem",
                      borderBottomRightRadius: "0.75rem",
                      textAlign: "center",
                      userSelect: "none",
                    }}
                  >
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {processedSales.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: "4rem 2rem", textAlign: "center" }}>
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
                          <CreditCard size={28} />
                        </div>
                        <h4 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--devio-blue-dark)", margin: "0 0 0.35rem 0" }}>
                          {searchQuery.trim() ? "No se encontraron ventas" : "No hay ventas registradas"}
                        </h4>
                        <p style={{ fontSize: "0.85rem", color: "var(--devio-neutral-3)", maxWidth: "440px", margin: "0 0 1.25rem 0", lineHeight: 1.5 }}>
                          {searchQuery.trim()
                            ? "No hay resultados que coincidan con los términos de búsqueda ingresados."
                            : "Comienza formalizando tu primera venta seleccionando una unidad disponible y asignando a su comprador."}
                        </p>
                        {!searchQuery.trim() && (
                          <button
                            type="button"
                            onClick={() => setShowNewSaleModal(true)}
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
                            <Plus size={16} /> Crear Primera Venta
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  processedSales.map((sale) => (
                    <tr
                      key={sale.id}
                      onClick={() => setSelectedSale(sale)}
                      style={{
                        borderBottom: "1px solid #F1F5F9",
                        cursor: "pointer",
                        transition: "background-color 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(31, 54, 82, 0.02)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      {/* Nombre */}
                      <td style={{ padding: "1rem 1.25rem", fontWeight: 600, color: "#1F3652", fontSize: "0.85rem" }}>
                        {sale.clientName}
                      </td>

                      {/* Unidad */}
                      <td style={{ padding: "1rem 1rem", fontSize: "0.85rem" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                          <span style={{ fontWeight: 700, color: "#1F3652" }}>{sale.unit}</span>
                          {sale.additionals && sale.additionals.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                              {sale.additionals.map((a, aIdx) => (
                                <span
                                  key={a.id || aIdx}
                                  title={`${a.name} (${a.category}) - ${formatMoney(a.price)}`}
                                  style={{
                                    fontSize: "0.68rem",
                                    fontWeight: 700,
                                    backgroundColor: "rgba(47, 128, 237, 0.08)",
                                    color: "#2F80ED",
                                    padding: "0.1rem 0.4rem",
                                    borderRadius: "4px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.25rem",
                                  }}
                                >
                                  <Package size={10} />
                                  {a.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Plan de pago */}
                      <td style={{ padding: "1rem 1rem", fontSize: "0.85rem", color: "#475569" }}>
                        {sale.paymentPlan}
                      </td>

                      {/* Precio total */}
                      <td style={{ padding: "1rem 1rem", fontSize: "0.85rem", fontWeight: 600, color: "#1F3652", textAlign: "right" }}>
                        {formatMoney(sale.totalPrice)}
                      </td>

                      {/* Pagado */}
                      <td style={{ padding: "1rem 1rem", fontSize: "0.85rem", fontWeight: 600, color: sale.paidAmount > 0 ? "#00C48C" : "#1F3652", textAlign: "right" }}>
                        {formatMoney(sale.paidAmount)}
                      </td>

                      {/* Por pagar */}
                      <td style={{ padding: "1rem 1rem", fontSize: "0.85rem", fontWeight: 600, color: "#1F3652", textAlign: "right" }}>
                        {formatMoney(sale.pendingAmount)}
                      </td>

                      {/* Fecha de venta */}
                      <td style={{ padding: "1rem 1.25rem", fontSize: "0.85rem", color: "#475569", textAlign: "right" }}>
                        {sale.saleDate}
                      </td>

                      {/* Acciones */}
                      <td style={{ padding: "0.75rem 1rem", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                        {hasPermission("sales.edit") ? (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSaleToEdit(sale);
                                setShowEditSaleModal(true);
                              }}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.3rem",
                                backgroundColor: "rgba(47, 128, 237, 0.08)",
                                color: "#2F80ED",
                                border: "1px solid rgba(47, 128, 237, 0.2)",
                                padding: "0.35rem 0.75rem",
                                borderRadius: "0.5rem",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                                whiteSpace: "nowrap",
                              }}
                              title="Editar adicionales, precio y reajuste de cuotas"
                            >
                              <Edit3 size={13} /> Editar
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer de resumen */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid #F1F5F9", fontSize: "0.78rem", color: "#64748B" }}>
            <span>Mostrando <strong>{processedSales.length}</strong> de <strong>{sales.length}</strong> ventas registradas</span>
            <span>Valor Total Vendido: <strong>{formatMoney(sales.reduce((acc, s) => acc + s.totalPrice, 0))}</strong></span>
          </div>
        </div>

        {/* MODAL DETALLE DE VENTA Y CONTRATO */}
        {selectedSale && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "1rem",
              backdropFilter: "blur(4px)",
            }}
          >
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "1.25rem",
                width: "100%",
                maxWidth: "640px",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                padding: "2rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2F80ED", textTransform: "uppercase" }}>
                    Folio {selectedSale.folio}
                  </span>
                  <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#1F3652", margin: "0.2rem 0 0" }}>
                    Detalle de Venta • Unidad {selectedSale.unit}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSale(null)}
                  style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Información del Cliente & Unidad */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                <div style={{ backgroundColor: "#F8FAFC", borderRadius: "0.85rem", padding: "1rem", border: "1px solid #E2E8F0" }}>
                  <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block" }}>Cliente Comprador</span>
                  <strong style={{ fontSize: "0.95rem", color: "#1F3652" }}>{selectedSale.clientName}</strong>
                  <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block", marginTop: "0.25rem" }}>
                    {selectedSale.clientEmail} • {selectedSale.clientPhone}
                  </span>
                </div>

                <div style={{ backgroundColor: "#F8FAFC", borderRadius: "0.85rem", padding: "1rem", border: "1px solid #E2E8F0" }}>
                  <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block" }}>Plan Financiero</span>
                  <strong style={{ fontSize: "0.95rem", color: "#1F3652" }}>{selectedSale.paymentPlan}</strong>
                  <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block", marginTop: "0.25rem" }}>
                    Fecha de cierre: {selectedSale.saleDate}
                  </span>
                </div>
              </div>

              {/* Adicionales / Addons Incluidos */}
              {selectedSale.additionals && selectedSale.additionals.length > 0 && (
                <div style={{ backgroundColor: "#F8FAFC", borderRadius: "0.85rem", padding: "1.25rem", border: "1px solid #E2E8F0", marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                    <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1F3652", margin: 0, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <Package size={15} color="#2F80ED" /> Adicionales / Addons Incluidos ({selectedSale.additionals.length})
                    </h4>
                    <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                      Total Adicionales: <strong style={{ color: "#1F3652" }}>{formatMoney(selectedSale.additionals.reduce((sum, a) => sum + (a.price || 0), 0))}</strong>
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    {selectedSale.additionals.map((addon, aIdx) => (
                      <div
                        key={addon.id || aIdx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          backgroundColor: "#FFFFFF",
                          padding: "0.55rem 0.85rem",
                          borderRadius: "0.5rem",
                          border: "1px solid #E2E8F0",
                          fontSize: "0.82rem",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <Box size={14} color="#2F80ED" />
                          <strong style={{ color: "#1F3652" }}>{addon.name}</strong>
                          <span style={{ fontSize: "0.72rem", color: "#64748B", textTransform: "capitalize", backgroundColor: "#F1F5F9", padding: "0.1rem 0.4rem", borderRadius: "4px" }}>
                            {addon.category}
                          </span>
                          {addon.areaM2 && (
                            <span style={{ fontSize: "0.72rem", color: "#64748B" }}>({addon.areaM2} m²)</span>
                          )}
                        </div>
                        <span style={{ fontWeight: 700, color: "#1F3652" }}>
                          {formatMoney(addon.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Desglose Económico */}
              <div style={{ backgroundColor: "#F8FAFC", borderRadius: "0.85rem", padding: "1.25rem", border: "1px solid #E2E8F0", marginBottom: "1.5rem" }}>
                <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1F3652", margin: "0 0 0.75rem" }}>Desglose de Pago</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.85rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748B" }}>Precio Total Pactado:</span>
                    <strong style={{ color: "#1F3652" }}>{formatMoney(selectedSale.totalPrice)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748B" }}>Monto Total Pagado:</span>
                    <strong style={{ color: "#00C48C" }}>{formatMoney(selectedSale.paidAmount)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #E2E8F0", paddingTop: "0.5rem" }}>
                    <span style={{ color: "#64748B", fontWeight: 600 }}>Saldo Restante Por Pagar:</span>
                    <strong style={{ color: "#1F3652", fontSize: "1rem" }}>{formatMoney(selectedSale.pendingAmount)}</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => {
                    showToast("Contrato Descargado", `Se descargó el contrato en PDF para la venta ${selectedSale.folio}.`);
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    padding: "0.55rem 1.15rem",
                    borderRadius: "9999px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    color: "#1F3652",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <FileText size={15} color="#2F80ED" /> Descargar Contrato (PDF)
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSaleToEdit(selectedSale);
                      setShowEditSaleModal(true);
                      setSelectedSale(null);
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.45rem",
                      padding: "0.55rem 1.15rem",
                      borderRadius: "9999px",
                      border: "1.5px solid #00C48C",
                      backgroundColor: "#FFFFFF",
                      color: "#00C48C",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    <Edit3 size={14} /> Editar Venta & Adicionales
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedSale(null)}
                    style={{
                      padding: "0.55rem 1.35rem",
                      borderRadius: "9999px",
                      backgroundColor: "#1B3047",
                      color: "#FFFFFF",
                      border: "none",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL EDITAR VENTA & ADICIONALES */}
        {showEditSaleModal && saleToEdit && (
          <EditSaleModal
            isOpen={showEditSaleModal}
            onClose={() => {
              setShowEditSaleModal(false);
              setSaleToEdit(null);
            }}
            project={project}
            sale={saleToEdit}
          />
        )}

        {/* MODAL 5-STEP CREAR NUEVA VENTA */}
        <CreateSaleWizardModal
          isOpen={showNewSaleModal}
          onClose={() => setShowNewSaleModal(false)}
          projects={projects}
          initialProjectId={projectId}
          onSaleCreated={handleSaleCreated}
        />
      </main>
    </AppLayout>
  );
}
