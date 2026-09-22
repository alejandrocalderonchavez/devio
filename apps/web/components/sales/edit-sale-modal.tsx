"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  Plus,
  Trash2,
  DollarSign,
  Package,
  Layers,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Building2,
  Calendar,
  Sparkles,
} from "lucide-react";
import { useProject } from "../../context/project-context";
import { ProjectItem, SaleRecord, ProjectAdditional } from "../../data/projects-data";
import { InfoTooltip } from "../ui/tooltip";

interface EditSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectItem;
  sale: SaleRecord;
}

export function EditSaleModal({
  isOpen,
  onClose,
  project,
  sale,
}: EditSaleModalProps) {
  const { updateSaleDetailsAndAdditionals, formatMoney, showToast } = useProject();

  const unitObj = useMemo(() => {
    return project.unitsInventory.find((u) => u.unit === sale.unit);
  }, [project, sale]);

  // Initial additionals assigned to this sale
  const [assignedAdditionals, setAssignedAdditionals] = useState<ProjectAdditional[]>(() => {
    return sale.additionals || (project.additionals || []).filter((a) => a.assignedToUnit === sale.unit);
  });

  // Schedule adjustment strategy
  const [adjustScheduleMode, setAdjustScheduleMode] = useState<"liquidation" | "proportional">("liquidation");

  // Custom additionals creation form
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customForm, setCustomForm] = useState<{
    name: string;
    category: "estacionamiento" | "bodega" | "acabados" | "terraza" | "otro";
    price: number;
    notes: string;
  }>({
    name: "",
    category: "estacionamiento",
    price: 150000,
    notes: "",
  });

  if (!isOpen) return null;

  // Calculate base unit price
  const initialAdditionalsTotal = (sale.additionals || []).reduce((sum, a) => sum + (Number(a.price) || 0), 0);
  const baseUnitPrice = Math.max(0, (unitObj?.price || sale.totalPrice) - initialAdditionalsTotal);

  // New additionals total and new sale price
  const newAdditionalsTotal = assignedAdditionals.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
  const newTotalPrice = baseUnitPrice + newAdditionalsTotal;
  const priceDifference = newTotalPrice - sale.totalPrice;
  const newPendingAmount = Math.max(0, newTotalPrice - sale.paidAmount);

  // Available additionals from project catalog not yet assigned to any unit
  const availableAdditionals = useMemo(() => {
    return (project.additionals || []).filter(
      (a) =>
        (a.status === "DISPONIBLE" || !a.status || !a.assignedToUnit) &&
        a.status !== "VENDIDO" &&
        a.assignedToUnit !== sale.unit &&
        !assignedAdditionals.some((curr) => curr.id === a.id)
    );
  }, [project.additionals, assignedAdditionals, sale.unit]);

  // Add an existing unassigned project additional
  const handleAddCatalogAdditional = (additionalId: string) => {
    const found = (project.additionals || []).find((a) => a.id === additionalId);
    if (!found) return;
    setAssignedAdditionals([...assignedAdditionals, { ...found, assignedToUnit: sale.unit, status: "ASIGNADO" }]);
  };

  // Remove an additional from the sale
  const handleRemoveAdditional = (additionalId: string) => {
    setAssignedAdditionals(assignedAdditionals.filter((a) => a.id !== additionalId));
  };

  // Add a newly created custom additional
  const handleAddCustomAdditional = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customForm.name.trim() || customForm.price <= 0) return;

    const newAddon: ProjectAdditional = {
      id: `add-custom-${Date.now()}`,
      name: customForm.name.trim(),
      category: customForm.category,
      price: Number(customForm.price),
      notes: customForm.notes.trim() || undefined,
      status: "ASIGNADO",
      assignedToUnit: sale.unit,
    };

    setAssignedAdditionals([...assignedAdditionals, newAddon]);
    setCustomForm({ name: "", category: "estacionamiento", price: 150000, notes: "" });
    setShowAddCustom(false);
  };

  // Save changes
  const handleSave = () => {
    updateSaleDetailsAndAdditionals(project.id, sale.unit, {
      additionals: assignedAdditionals,
      adjustScheduleMode,
    });
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1.5rem",
        backdropFilter: "blur(5px)",
      }}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "1.5rem",
          width: "100%",
          maxWidth: "720px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: "1.5rem 2rem",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            backgroundColor: "#F8FAFC",
          }}
        >
          <div>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 800,
                color: "#2F80ED",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Administración de Venta
            </span>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#1F3652", margin: "0.2rem 0 0.15rem" }}>
              Editar Venta & Adicionales ({sale.folio})
            </h2>
            <p style={{ fontSize: "0.82rem", color: "#64748B", margin: 0 }}>
              Unidad: <strong>{sale.unit}</strong> • Cliente: <strong>{sale.clientName}</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              color: "#64748B",
              cursor: "pointer",
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div style={{ padding: "1.75rem 2rem", overflowY: "auto", flex: 1 }}>
          {/* FINANCIAL OVERVIEW STRIP */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "0.75rem",
              backgroundColor: "#F1F5F9",
              borderRadius: "1rem",
              padding: "1rem",
              marginBottom: "1.5rem",
            }}
          >
            <div>
              <span style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
                Precio Base Unidad
              </span>
              <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#1F3652" }}>
                {formatMoney(baseUnitPrice)}
              </div>
            </div>

            <div>
              <span style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
                Total Adicionales
              </span>
              <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#2F80ED" }}>
                +{formatMoney(newAdditionalsTotal)}
              </div>
            </div>

            <div>
              <span style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
                Nuevo Total Venta
              </span>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1F3652" }}>
                {formatMoney(newTotalPrice)}
              </div>
              {priceDifference !== 0 && (
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: priceDifference > 0 ? "#16A34A" : "#EF4444" }}>
                  {priceDifference > 0 ? `+${formatMoney(priceDifference)}` : formatMoney(priceDifference)}
                </div>
              )}
            </div>

            <div>
              <span style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
                Nuevo Saldo Insoluto
              </span>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: newPendingAmount === 0 ? "#16A34A" : "#E05345" }}>
                {formatMoney(newPendingAmount)}
              </div>
            </div>
          </div>

          {/* SECTION: AVAILABLE CATALOG ADDITIONALS PICKER */}
          {availableAdditionals.length > 0 && (
            <div
              style={{
                backgroundColor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "1rem",
                padding: "1rem 1.25rem",
                marginBottom: "1.5rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Package size={16} color="#2F80ED" />
                  <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#1F3652" }}>
                    Catálogo de Adicionales Disponibles ({availableAdditionals.length})
                  </span>
                  <InfoTooltip
                    title="Adicionales Disponibles"
                    content="Cajones, bodegas y acabados registrados en el inventario del proyecto que aún no han sido vendidos ni asignados."
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.6rem" }}>
                {availableAdditionals.map((add) => (
                  <div
                    key={add.id}
                    style={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #CBD5E1",
                      borderRadius: "0.65rem",
                      padding: "0.6rem 0.75rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1F3652", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {add.name}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.15rem" }}>
                        <span
                          style={{
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            color: "#64748B",
                            textTransform: "uppercase",
                            backgroundColor: "#F1F5F9",
                            padding: "0.05rem 0.35rem",
                            borderRadius: "3px",
                          }}
                        >
                          {add.category}
                        </span>
                        <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#00C48C" }}>
                          {formatMoney(add.price)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddCatalogAdditional(add.id)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.2rem",
                        padding: "0.35rem 0.65rem",
                        borderRadius: "0.45rem",
                        backgroundColor: "#1B3047",
                        color: "#FFFFFF",
                        fontSize: "0.74rem",
                        fontWeight: 700,
                        border: "none",
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      <Plus size={13} /> Asignar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION: ASSIGNED ADDITIONALS */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                  Adicionales Asignados ({assignedAdditionals.length})
                </h3>
                <InfoTooltip
                  title="Adicionales de la Venta"
                  content="Cajones extras, bodegas o paquetes de acabados que incrementan el valor comercial de la venta."
                />
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowAddCustom(!showAddCustom)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    padding: "0.4rem 0.85rem",
                    borderRadius: "0.5rem",
                    backgroundColor: "rgba(47, 128, 237, 0.1)",
                    color: "#2F80ED",
                    border: "1px solid rgba(47, 128, 237, 0.25)",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <Plus size={14} /> Crear Personalizado
                </button>
              </div>
            </div>

            {/* CUSTOM ADDON FORM */}
            {showAddCustom && (
              <form
                onSubmit={handleAddCustomAdditional}
                style={{
                  backgroundColor: "#F8FAFC",
                  border: "1.5px dashed #CBD5E1",
                  borderRadius: "0.85rem",
                  padding: "1rem",
                  marginBottom: "1rem",
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.25rem" }}>
                      Nombre del Adicional
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Cajón E-14 (Sótano 2)"
                      value={customForm.name}
                      onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "0.5rem 0.75rem",
                        borderRadius: "0.5rem",
                        border: "1px solid #CBD5E1",
                        fontSize: "0.82rem",
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.25rem" }}>
                      Categoría
                    </label>
                    <select
                      value={customForm.category}
                      onChange={(e) => setCustomForm({ ...customForm, category: e.target.value as any })}
                      style={{
                        width: "100%",
                        padding: "0.5rem 0.75rem",
                        borderRadius: "0.5rem",
                        border: "1px solid #CBD5E1",
                        fontSize: "0.82rem",
                        backgroundColor: "#FFFFFF",
                      }}
                    >
                      <option value="estacionamiento">Estacionamiento / Cajón</option>
                      <option value="bodega">Bodega</option>
                      <option value="acabados">Acabados</option>
                      <option value="terraza">Terraza</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.25rem" }}>
                      Precio ($ MXN)
                    </label>
                    <input
                      type="number"
                      value={customForm.price}
                      onChange={(e) => setCustomForm({ ...customForm, price: Number(e.target.value) })}
                      style={{
                        width: "100%",
                        padding: "0.5rem 0.75rem",
                        borderRadius: "0.5rem",
                        border: "1px solid #CBD5E1",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                      }}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => setShowAddCustom(false)}
                    style={{
                      padding: "0.4rem 0.85rem",
                      borderRadius: "0.4rem",
                      border: "1px solid #CBD5E1",
                      backgroundColor: "#FFFFFF",
                      fontSize: "0.78rem",
                      cursor: "pointer",
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: "0.4rem 1rem",
                      borderRadius: "0.4rem",
                      border: "none",
                      backgroundColor: "#2F80ED",
                      color: "#FFFFFF",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Agregar a Venta
                  </button>
                </div>
              </form>
            )}

            {/* LIST OF ASSIGNED ADDITIONALS */}
            {assignedAdditionals.length === 0 ? (
              <div
                style={{
                  padding: "2rem",
                  textAlign: "center",
                  border: "1px dashed #E2E8F0",
                  borderRadius: "0.85rem",
                  color: "#94A3B8",
                  fontSize: "0.82rem",
                }}
              >
                No hay adicionales asignados a esta venta. El precio total equivale únicamente al valor base de la unidad.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {assignedAdditionals.map((add) => (
                  <div
                    key={add.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.75rem 1rem",
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "0.75rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span
                        style={{
                          backgroundColor:
                            add.category === "estacionamiento"
                              ? "#EFF6FF"
                              : add.category === "bodega"
                              ? "#FEF3C7"
                              : "#F0FDF4",
                          color:
                            add.category === "estacionamiento"
                              ? "#1D4ED8"
                              : add.category === "bodega"
                              ? "#B45309"
                              : "#15803D",
                          padding: "0.2rem 0.55rem",
                          borderRadius: "0.4rem",
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          textTransform: "uppercase",
                        }}
                      >
                        {add.category}
                      </span>
                      <div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1F3652" }}>
                          {add.name}
                        </div>
                        {add.notes && (
                          <div style={{ fontSize: "0.74rem", color: "#64748B" }}>{add.notes}</div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <span style={{ fontSize: "0.92rem", fontWeight: 800, color: "#1F3652" }}>
                        {formatMoney(add.price)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAdditional(add.id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#EF4444",
                          cursor: "pointer",
                          padding: "4px",
                        }}
                        title="Quitar adicional"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION: SCHEDULE ADJUSTMENT STRATEGY */}
          <div
            style={{
              backgroundColor: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "1rem",
              padding: "1.25rem",
              marginBottom: "1rem",
            }}
          >
            <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#1F3652", marginBottom: "0.5rem" }}>
              Estrategia de Ajuste del Calendario de Pagos
            </div>
            <p style={{ fontSize: "0.78rem", color: "#64748B", margin: "0 0 0.85rem" }}>
              ¿Cómo deseas reflejar la variación de precio (+{formatMoney(priceDifference)}) en el plan de financiamiento?
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.65rem",
                  padding: "0.85rem",
                  borderRadius: "0.75rem",
                  border: adjustScheduleMode === "liquidation" ? "2px solid #2F80ED" : "1px solid #CBD5E1",
                  backgroundColor: adjustScheduleMode === "liquidation" ? "#EFF6FF" : "#FFFFFF",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="scheduleMode"
                  checked={adjustScheduleMode === "liquidation"}
                  onChange={() => setAdjustScheduleMode("liquidation")}
                  style={{ marginTop: "3px" }}
                />
                <div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#1F3652" }}>
                    Ajustar Liquidación Final (Recomendado)
                  </div>
                  <div style={{ fontSize: "0.74rem", color: "#64748B", marginTop: "0.15rem" }}>
                    Mantiene intactas las mensualidades fijas y absorbe la diferencia en el pago de liquidación/escrituración.
                  </div>
                </div>
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.65rem",
                  padding: "0.85rem",
                  borderRadius: "0.75rem",
                  border: adjustScheduleMode === "proportional" ? "2px solid #2F80ED" : "1px solid #CBD5E1",
                  backgroundColor: adjustScheduleMode === "proportional" ? "#EFF6FF" : "#FFFFFF",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="scheduleMode"
                  checked={adjustScheduleMode === "proportional"}
                  onChange={() => setAdjustScheduleMode("proportional")}
                  style={{ marginTop: "3px" }}
                />
                <div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#1F3652" }}>
                    Prorratear en Cuotas Pendientes
                  </div>
                  <div style={{ fontSize: "0.74rem", color: "#64748B", marginTop: "0.15rem" }}>
                    Distribuye proporcionalmente la diferencia en todas las mensualidades no pagadas.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* BANNER NOTIFICATION */}
          <div
            style={{
              backgroundColor: "#FFFBEB",
              border: "1px solid #FCD34D",
              borderRadius: "0.75rem",
              padding: "0.85rem 1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.65rem",
              fontSize: "0.78rem",
              color: "#92400E",
            }}
          >
            <CheckCircle2 size={17} color="#D97706" style={{ flexShrink: 0 }} />
            <div>
              <strong>Seguridad Contable:</strong> Los abonos y transferencias ya cobrados ({formatMoney(sale.paidAmount)}) se conservarán y se redistribuirán en cascada de inmediato.
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div
          style={{
            padding: "1.25rem 2rem",
            borderTop: "1px solid #E2E8F0",
            backgroundColor: "#F8FAFC",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "0.65rem 1.5rem",
              borderRadius: "9999px",
              border: "1px solid #CBD5E1",
              backgroundColor: "#FFFFFF",
              color: "#64748B",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.65rem 1.75rem",
              borderRadius: "9999px",
              border: "none",
              backgroundColor: "#1B3047",
              color: "#FFFFFF",
              fontSize: "0.85rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(27, 48, 71, 0.2)",
            }}
          >
            <CheckCircle2 size={16} /> Guardar Cambios en Venta ({formatMoney(newTotalPrice)})
          </button>
        </div>
      </div>
    </div>
  );
}
