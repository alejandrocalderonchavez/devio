"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Users,
  Search,
  Download,
  ArrowUpDown,
  Calendar,
  User,
  X,
  Building2,
  Mail,
  Phone,
  Printer,
  FileSpreadsheet,
  ShieldAlert,
} from "lucide-react";
import AppLayout from "../../../../components/layout/app-layout";
import { useProject } from "../../../../context/project-context";
import { INITIAL_CLIENTS, ClientProfile, UnitItem, CoOwner } from "../../../../data/projects-data";
import { exportTableToExcel, exportTableToPDF } from "../../../../lib/export-utils";

export default function ProjectClientsPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;
  const { getProject, formatMoney, showToast, hasPermission } = useProject();
  const project = getProject(projectId);

  // States for search, sorting and time filter
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<keyof ClientProfile>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [timeFilter, setTimeFilter] = useState<"ALL" | "LAST_30" | "THIS_MONTH" | "THIS_YEAR">("ALL");
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);

  // Dynamic clients list derived from project sales and inventory
  const clients = useMemo<ClientProfile[]>(() => {
    if (!project) return [];
    
    const soldUnitsMap = new Map<string, UnitItem>();
    (project.unitsInventory || []).forEach((u) => {
      if (u.status === "VENDIDA") {
        soldUnitsMap.set(u.unit, u);
      }
    });

    const clientMap = new Map<string, ClientProfile>();

    // 1. Process from real active sales records first
    (project.sales || []).forEach((sale) => {
      if (sale.status === "CANCELADA") return;
      if (!soldUnitsMap.has(sale.unit)) return;

      const emailKey = (sale.clientEmail && sale.clientEmail.trim().toLowerCase()) || sale.clientName.toLowerCase().trim();
      const targetClientId = sale.clientId || sale.clientEmail || sale.clientName;
      const uObj = soldUnitsMap.get(sale.unit);

      if (!clientMap.has(emailKey)) {
        clientMap.set(emailKey, {
          id: targetClientId,
          name: sale.clientName || "Cliente",
          email: sale.clientEmail || "-",
          phone: sale.clientPhone || "-",
          rfc: sale.clientRfc || "-",
          totalPaid: sale.paidAmount || 0,
          totalPending: sale.pendingAmount || 0,
          unitsCount: 1,
          ownedUnits: [
            {
              unit: sale.unit,
              type: uObj?.type || "Departamento",
              price: sale.totalPrice,
              ownershipPct: sale.coOwners && sale.coOwners.length > 0 ? (sale.coOwners[0]?.ownershipPct || 100) : 100,
              isPrimary: true,
              saleFolio: sale.folio,
              additionals: sale.additionals && sale.additionals.length > 0 ? sale.additionals : (project.additionals || []).filter(a => a.assignedToUnit === sale.unit),
            },
          ],
        });
      } else {
        const existing = clientMap.get(emailKey)!;
        if (!existing.ownedUnits.some((u) => u.unit === sale.unit)) {
          existing.unitsCount += 1;
          existing.totalPaid += sale.paidAmount || 0;
          existing.totalPending += sale.pendingAmount || 0;
          existing.ownedUnits.push({
            unit: sale.unit,
            type: uObj?.type || "Departamento",
            price: sale.totalPrice,
            ownershipPct: sale.coOwners && sale.coOwners.length > 0 ? (sale.coOwners[0]?.ownershipPct || 100) : 100,
            isPrimary: true,
            saleFolio: sale.folio,
            additionals: sale.additionals && sale.additionals.length > 0 ? sale.additionals : (project.additionals || []).filter(a => a.assignedToUnit === sale.unit),
          });
        }
      }
    });

    // 2. Process remaining from unitsInventory (only sold units not already in map)
    soldUnitsMap.forEach((u) => {
        if (u.status === "VENDIDA" && u.client && u.client !== "-") {
          const matchingAddons = (project.additionals || []).filter(a => a.assignedToUnit === u.unit);
          if (u.coOwners && u.coOwners.length > 0) {
            u.coOwners.forEach((co: CoOwner) => {
              const emailKey = (co.email && co.email.trim().toLowerCase()) || co.name.toLowerCase().trim();
              if (!clientMap.has(emailKey)) {
                clientMap.set(emailKey, {
                  id: co.id || co.email || co.name,
                  name: co.name || "Cliente",
                  email: co.email || "-",
                  phone: co.phone || "-",
                  rfc: co.rfc || "-",
                  totalPaid: Math.round(u.price * (co.ownershipPct / 100) * 0.2),
                  totalPending: Math.round(u.price * (co.ownershipPct / 100) * 0.8),
                  unitsCount: 1,
                  ownedUnits: [
                    {
                      unit: u.unit,
                      type: u.type,
                      price: u.price,
                      ownershipPct: co.ownershipPct,
                      isPrimary: co.isPrimary,
                      saleFolio: u.saleFolio,
                      additionals: matchingAddons,
                    },
                  ],
                });
              }
            });
          } else {
            const emailKey = u.client.toLowerCase().trim();
            if (!clientMap.has(emailKey)) {
              clientMap.set(emailKey, {
                id: u.client,
                name: u.client,
                email: "-",
                phone: "-",
                rfc: "-",
                totalPaid: Math.round(u.price * 0.2),
                totalPending: Math.round(u.price * 0.8),
                unitsCount: 1,
                ownedUnits: [
                  {
                    unit: u.unit,
                    type: u.type,
                    price: u.price,
                    ownershipPct: 100,
                    isPrimary: true,
                    saleFolio: u.saleFolio,
                    additionals: matchingAddons,
                  },
                ],
              });
            }
          }
        }
      });

    return Array.from(clientMap.values());
  }, [project]);

  // Sorting handler
  const handleSort = (field: keyof ClientProfile) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filtered & Sorted Clients
  const processedClients = useMemo(() => {
    let result = [...clients];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          c.ownedUnits.some((u) => u.unit.toLowerCase().includes(q))
      );
    }

    // Time filter simulation
    if (timeFilter === "LAST_30") {
      result = result.slice(0, 5);
    } else if (timeFilter === "THIS_MONTH") {
      result = result.slice(0, 4);
    } else if (timeFilter === "THIS_YEAR") {
      result = result.slice(0, 6);
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === "string") {
        return sortDirection === "asc"
          ? (aVal as string).localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal as string);
      }

      if (typeof aVal === "number") {
        return sortDirection === "asc"
          ? (aVal as number) - (bVal as number)
          : (bVal as number) - (aVal as number);
      }

      return 0;
    });

    return result;
  }, [clients, searchQuery, sortField, sortDirection, timeFilter]);

  // Excel Export Handler (Exact to current filters & sorting)
  const handleExportExcel = () => {
    if (!project) return;
    const dataToExport = processedClients.map((c) => ({
      "Nombre": c.name,
      "Correo": c.email,
      "Teléfono": c.phone,
      "Total Pagado": c.totalPaid,
      "Total Pendiente": c.totalPending,
      "# Unidades": c.unitsCount,
      "Unidades en Posesión": c.ownedUnits.map((u) => `${u.unit} (${u.ownershipPct}%)`).join(", "),
    }));

    exportTableToExcel(dataToExport, `Clientes_${project.name.replace(/\s+/g, "_")}`, "Clientes");
    showToast("Excel Exportado", `Se descargó el archivo con ${processedClients.length} registros.`);
    setShowExportMenu(false);
  };

  // PDF Export Handler (Exact to current filters & sorting)
  const handleExportPDF = () => {
    if (!project) return;
    const headers = ["Nombre", "Correo", "Teléfono", "Total Pagado", "Total Pendiente", "# Unidades"];
    const rows = processedClients.map((c) => [
      c.name,
      c.email,
      c.phone,
      formatMoney(c.totalPaid),
      formatMoney(c.totalPending),
      c.unitsCount,
    ]);

    const totalPaidSum = processedClients.reduce((acc, c) => acc + c.totalPaid, 0);
    const totalPendingSum = processedClients.reduce((acc, c) => acc + c.totalPending, 0);
    const summary = `Total de Clientes: ${processedClients.length} | Total Cobrado: ${formatMoney(totalPaidSum)} | Total Pendiente: ${formatMoney(totalPendingSum)}`;

    exportTableToPDF("Directorio de Clientes", project.name, headers, rows, summary);
    showToast("PDF Generado", "Se abrió la vista de impresión/exportación a PDF.");
    setShowExportMenu(false);
  };

  const getTimeFilterLabel = () => {
    switch (timeFilter) {
      case "LAST_30":
        return "Últimos 30 días";
      case "THIS_MONTH":
        return "Este mes";
      case "THIS_YEAR":
        return "Este año 2026";
      default:
        return "Todos los periodos";
    }
  };

  if (!project) return null;

  if (!hasPermission("clients.view")) {
    return (
      <AppLayout activeProjectId={projectId} projectSubTab="clients">
        <main style={{ padding: "3rem 2rem", flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1.25rem", padding: "3rem", textAlign: "center", maxWidth: "480px", border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "#FEF2F2", color: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem auto" }}>
              <ShieldAlert size={28} />
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1F3652", marginBottom: "0.5rem" }}>Acceso Restringido</h2>
            <p style={{ fontSize: "0.88rem", color: "#64748B", lineHeight: 1.5, margin: 0 }}>
              Tu perfil de usuario no cuenta con permisos para ver o consultar el directorio de clientes de este desarrollo. Contacta a un administrador si requieres acceso.
            </p>
          </div>
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout activeProjectId={projectId} projectSubTab="clients">
      <main style={{ padding: "1.25rem 2rem 2rem 2rem", flex: 1, overflowY: "auto" }}>
        
        {/* ENCABEZADO PRINCIPAL (Exacto a Screenshot 1) */}
        <div style={{ marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
              Clientes
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
          {/* BARRA SUPERIOR DE BÚSQUEDA, FILTROS Y ACCIÓN */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
            {/* Input Buscar cliente */}
            <div style={{ position: "relative", flex: 1, maxWidth: "600px" }}>
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
                placeholder="Buscar cliente"
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

            {/* Filtro de Tiempo & Botones de Exportación */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              {/* Filtro de tiempo interactivo */}
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setShowTimeDropdown(!showTimeDropdown)}
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
                  <Calendar size={15} color="#64748B" />
                  {getTimeFilterLabel()}
                </button>

                {showTimeDropdown && (
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
                      minWidth: "180px",
                    }}
                  >
                    {[
                      { id: "ALL", label: "Todos los periodos" },
                      { id: "LAST_30", label: "Últimos 30 días" },
                      { id: "THIS_MONTH", label: "Este mes" },
                      { id: "THIS_YEAR", label: "Este año 2026" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setTimeFilter(opt.id as any);
                          setShowTimeDropdown(false);
                        }}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "0.5rem 0.85rem",
                          borderRadius: "0.5rem",
                          border: "none",
                          background: timeFilter === opt.id ? "rgba(31, 54, 82, 0.08)" : "transparent",
                          color: timeFilter === opt.id ? "#1F3652" : "#64748B",
                          fontSize: "0.8rem",
                          fontWeight: timeFilter === opt.id ? 700 : 500,
                          cursor: "pointer",
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Botón Descargar Clientes (Excel / PDF) */}
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
                  <Download size={15} /> Descargar Clientes (Excel / PDF)
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
            </div>
          </div>

          {/* TABLA DE CLIENTES (Exacta a Screenshot 1) */}
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
                    onClick={() => handleSort("name")}
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
                      <ArrowUpDown size={13} style={{ opacity: sortField === "name" ? 1 : 0.4 }} />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort("email")}
                    style={{
                      padding: "0.85rem 1rem",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      Correo
                      <ArrowUpDown size={13} style={{ opacity: sortField === "email" ? 1 : 0.4 }} />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort("phone")}
                    style={{
                      padding: "0.85rem 1rem",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      Teléfono
                      <ArrowUpDown size={13} style={{ opacity: sortField === "phone" ? 1 : 0.4 }} />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort("totalPaid")}
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
                      Total Pagado
                      <ArrowUpDown size={13} style={{ opacity: sortField === "totalPaid" ? 1 : 0.4 }} />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort("totalPending")}
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
                      Total Pendiente
                      <ArrowUpDown size={13} style={{ opacity: sortField === "totalPending" ? 1 : 0.4 }} />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort("unitsCount")}
                    style={{
                      padding: "0.85rem 1.25rem",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      borderTopRightRadius: "0.75rem",
                      borderBottomRightRadius: "0.75rem",
                      cursor: "pointer",
                      userSelect: "none",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                      # Unidades
                      <ArrowUpDown size={13} style={{ opacity: sortField === "unitsCount" ? 1 : 0.4 }} />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {processedClients.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "4rem 2rem", textAlign: "center" }}>
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
                          <Users size={28} />
                        </div>
                        <h4 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--devio-blue-dark)", margin: "0 0 0.35rem 0" }}>
                          {searchQuery.trim() ? "No se encontraron clientes" : "No hay clientes registrados"}
                        </h4>
                        <p style={{ fontSize: "0.85rem", color: "var(--devio-neutral-3)", maxWidth: "440px", margin: "0 0 1.25rem 0", lineHeight: 1.5 }}>
                          {searchQuery.trim()
                            ? "No hay resultados que coincidan con los términos de búsqueda ingresados."
                            : "Los clientes y copropietarios se registrarán automáticamente cuando formalices una venta en este desarrollo."}
                        </p>
                        {!searchQuery.trim() && (
                          <button
                            type="button"
                            onClick={() => router.push(`/projects/${projectId}/sales`)}
                            style={{
                              backgroundColor: "var(--devio-blue-dark)",
                              color: "var(--devio-white)",
                              padding: "0.6rem 1.4rem",
                              borderRadius: "9999px",
                              fontSize: "0.82rem",
                              fontWeight: 700,
                              border: "none",
                              cursor: "pointer",
                              boxShadow: "0 2px 6px rgba(27, 48, 71, 0.15)",
                            }}
                          >
                            Ir a Registrar Ventas
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  processedClients.map((client, index) => {
                    const hasAvatar = index === 1 || index === 6;

                    return (
                      <tr
                        key={client.id}
                        onClick={() => router.push(`/projects/${projectId}/clients/${client.id}`)}
                        style={{
                          borderBottom: "1px solid #F1F5F9",
                          cursor: "pointer",
                          transition: "background-color 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(31, 54, 82, 0.02)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        {/* Nombre con Avatar */}
                        <td style={{ padding: "1rem 1.25rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            {hasAvatar ? (
                              <div
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  borderRadius: "50%",
                                  overflow: "hidden",
                                  backgroundColor: "#E2E8F0",
                                  flexShrink: 0,
                                }}
                              >
                                <img
                                  src={
                                    index === 1
                                      ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                                      : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
                                  }
                                  alt={client.name}
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                              </div>
                            ) : (
                              <div
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  borderRadius: "50%",
                                  border: "1.5px solid #CBD5E1",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "#64748B",
                                  backgroundColor: "#F8FAFC",
                                  flexShrink: 0,
                                }}
                              >
                                <User size={18} />
                              </div>
                            )}
                            <div>
                              <strong style={{ fontSize: "0.88rem", color: "#1F3652", display: "block" }}>
                                {client.name}
                              </strong>
                              {client.ownedUnits.length > 1 && (
                                <span style={{ fontSize: "0.7rem", color: "#2F80ED", fontWeight: 600 }}>
                                  Múltiples Unidades ({client.ownedUnits.map((u) => u.unit).join(", ")})
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Correo */}
                        <td style={{ padding: "1rem 1rem", fontSize: "0.85rem", color: "#475569" }}>
                          {client.email}
                        </td>

                        {/* Teléfono */}
                        <td style={{ padding: "1rem 1rem", fontSize: "0.85rem", color: "#475569" }}>
                          {client.phone}
                        </td>

                        {/* Total Pagado */}
                        <td style={{ padding: "1rem 1rem", fontSize: "0.85rem", fontWeight: 600, color: client.totalPaid > 0 ? "#00C48C" : "#1F3652", textAlign: "right" }}>
                          {formatMoney(client.totalPaid)}
                        </td>

                        {/* Total Pendiente */}
                        <td style={{ padding: "1rem 1rem", fontSize: "0.85rem", fontWeight: 600, color: "#1F3652", textAlign: "right" }}>
                          {formatMoney(client.totalPending)}
                        </td>

                        {/* # Unidades */}
                        <td style={{ padding: "1rem 1.25rem", fontSize: "0.88rem", fontWeight: 700, color: "#1F3652", textAlign: "center" }}>
                          {client.unitsCount}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer de resumen */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid #F1F5F9", fontSize: "0.78rem", color: "#64748B" }}>
            <span>Mostrando <strong>{processedClients.length}</strong> de <strong>{clients.length}</strong> clientes registrados</span>
            <span>Total Cartera en Proyecto: <strong>{formatMoney(clients.reduce((acc, c) => acc + c.totalPending + c.totalPaid, 0))}</strong></span>
          </div>
        </div>

        {/* MODAL DETALLE DE CLIENTE & COPROPIEDADES */}
        {selectedClient && (
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
                maxWidth: "600px",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                padding: "2rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(47, 128, 237, 0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#2F80ED",
                    }}
                  >
                    <User size={24} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                      {selectedClient.name}
                    </h2>
                    <span style={{ fontSize: "0.78rem", color: "#64748B" }}>
                      RFC: {selectedClient.rfc} • {selectedClient.unitsCount} Unidad(es) adquirida(s)
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedClient(null)}
                  style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Métricas del cliente */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                <div style={{ backgroundColor: "#F8FAFC", borderRadius: "0.85rem", padding: "1rem", border: "1px solid #E2E8F0" }}>
                  <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block", marginBottom: "0.25rem" }}>Total Pagado</span>
                  <strong style={{ fontSize: "1.2rem", color: "#00C48C" }}>{formatMoney(selectedClient.totalPaid)}</strong>
                </div>
                <div style={{ backgroundColor: "#F8FAFC", borderRadius: "0.85rem", padding: "1rem", border: "1px solid #E2E8F0" }}>
                  <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block", marginBottom: "0.25rem" }}>Total Pendiente</span>
                  <strong style={{ fontSize: "1.2rem", color: "#1F3652" }}>{formatMoney(selectedClient.totalPending)}</strong>
                </div>
              </div>

              {/* Datos de contacto */}
              <div style={{ marginBottom: "1.5rem", backgroundColor: "#F8FAFC", borderRadius: "0.85rem", padding: "1rem", border: "1px solid #E2E8F0" }}>
                <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1F3652", margin: "0 0 0.75rem" }}>Datos de Contacto</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.82rem", color: "#475569" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Mail size={15} color="#64748B" />
                    <span>{selectedClient.email}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Phone size={15} color="#64748B" />
                    <span>{selectedClient.phone}</span>
                  </div>
                </div>
              </div>

              {/* Unidades Compradas */}
              <div>
                <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1F3652", margin: "0 0 0.75rem" }}>
                  Unidades en Propiedad & Copropiedad
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {selectedClient.ownedUnits.map((u, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "0.75rem 1rem",
                        borderRadius: "0.65rem",
                        border: "1px solid #E2E8F0",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <Building2 size={18} color="#2F80ED" />
                        <div>
                          <strong style={{ fontSize: "0.85rem", color: "#1F3652" }}>Unidad {u.unit}</strong>
                          <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block" }}>{u.type} • {u.ownershipPct}% Titularidad</span>
                        </div>
                      </div>
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1F3652" }}>
                        {formatMoney(u.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: "1.75rem", display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setSelectedClient(null)}
                  style={{
                    padding: "0.55rem 1.25rem",
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
        )}
      </main>
    </AppLayout>
  );
}
