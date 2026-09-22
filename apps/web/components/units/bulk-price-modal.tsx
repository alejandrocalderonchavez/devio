"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  TrendingUp,
  TrendingDown,
  Percent,
  CheckCircle2,
  AlertCircle,
  Save,
  DollarSign,
  Check,
  Search,
  ArrowRight,
  Layers,
  Building,
  Info
} from "lucide-react";
import { UnitItem } from "../../data/projects-data";
export type { UnitItem };

export interface BulkPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  units: UnitItem[];
  currency?: "MXN" | "USD";
  onApplyAdjustment: (updatedUnits: UnitItem[], logSummary: string) => void;
}

export default function BulkPriceModal({
  isOpen,
  onClose,
  units,
  currency = "MXN",
  onApplyAdjustment,
}: BulkPriceModalProps) {
  // Scope: all available vs manual selection
  const [targetScope, setTargetScope] = useState<"available_only" | "selected_units">("available_only");
  const [adjustmentType, setAdjustmentType] = useState<"increase" | "discount">("increase");
  
  // Clean initial state (NO pre-loaded fake data)
  const [pctChangeStr, setPctChangeStr] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedUnitNumbers, setSelectedUnitNumbers] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Available units only can have price adjustments
  const availableUnits = useMemo(() => {
    return units.filter((u) => u.status === "DISPONIBLE");
  }, [units]);

  // Sync selected units on first load or when units change
  React.useEffect(() => {
    if (availableUnits.length > 0) {
      setSelectedUnitNumbers(availableUnits.map((u) => u.unit));
    }
  }, [availableUnits]);

  if (!isOpen) return null;

  const pctChange = parseFloat(pctChangeStr) || 0;

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const calculateNewPrice = (currentPrice: number) => {
    if (pctChange === 0) return currentPrice;
    const multiplier = adjustmentType === "increase" ? 1 + pctChange / 100 : 1 - pctChange / 100;
    return Math.round(currentPrice * multiplier);
  };

  // Determine which units are being updated based on scope
  const targetUnits = targetScope === "available_only"
    ? availableUnits
    : availableUnits.filter((u) => selectedUnitNumbers.includes(u.unit));

  // Filtered target units for the table search
  const displayedUnits = availableUnits.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.unit.toLowerCase().includes(q) ||
      u.type.toLowerCase().includes(q) ||
      (u.floor && `piso ${u.floor}`.includes(q))
    );
  });

  // Calculate aggregate metrics for preview
  const currentTotalVal = targetUnits.reduce((acc, u) => acc + (u.price || 0), 0);
  const projectedTotalVal = targetUnits.reduce((acc, u) => acc + calculateNewPrice(u.price || 0), 0);
  const netDifference = projectedTotalVal - currentTotalVal;

  const handleToggleUnitSelection = (unitNumber: string) => {
    if (selectedUnitNumbers.includes(unitNumber)) {
      setSelectedUnitNumbers(selectedUnitNumbers.filter((id) => id !== unitNumber));
    } else {
      setSelectedUnitNumbers([...selectedUnitNumbers, unitNumber]);
    }
  };

  const handleSelectAll = () => {
    if (selectedUnitNumbers.length === availableUnits.length) {
      setSelectedUnitNumbers([]);
    } else {
      setSelectedUnitNumbers(availableUnits.map((u) => u.unit));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (pctChange <= 0) {
      alert("Por favor ingresa un porcentaje mayor a 0%.");
      return;
    }
    if (!reason.trim()) {
      alert("Por favor ingresa el motivo del ajuste para el historial y bitácora de precios.");
      return;
    }
    if (targetScope === "selected_units" && selectedUnitNumbers.length === 0) {
      alert("Por favor selecciona al menos una unidad para aplicar el ajuste.");
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      const unitsToUpdateNumbers = targetScope === "available_only"
        ? availableUnits.map((u) => u.unit)
        : selectedUnitNumbers;

      const currentDateStr = new Date().toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      const updatedAllUnits = units.map((u) => {
        if (unitsToUpdateNumbers.includes(u.unit) && u.status === "DISPONIBLE") {
          const oldPrice = u.price;
          const newPrice = calculateNewPrice(oldPrice);
          const historyEntry = {
            date: currentDateStr,
            previousPrice: oldPrice,
            newPrice: newPrice,
            pctChange: adjustmentType === "increase" ? pctChange : -pctChange,
            reason: reason.trim(),
            user: "Administrador",
          };

          return {
            ...u,
            price: newPrice,
            priceHistory: [...(u.priceHistory || []), historyEntry],
          };
        }
        return u;
      });

      onApplyAdjustment(
        updatedAllUnits,
        `Se aplicó un ${adjustmentType === "increase" ? "aumento" : "descuento"} del ${pctChange}% a ${unitsToUpdateNumbers.length} unidades disponibles.`
      );

      setIsSaving(false);
      setShowSuccessToast(true);
      setTimeout(() => {
        setShowSuccessToast(false);
        onClose();
      }, 700);
    }, 500);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(10, 25, 47, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
      }}
    >
      <div
        style={{
          backgroundColor: "var(--devio-white)",
          borderRadius: "1.25rem",
          width: "100%",
          maxWidth: "880px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 70px rgba(0, 0, 0, 0.3)",
          border: "1px solid var(--devio-neutral-1)",
          overflow: "hidden",
          animation: "fadeIn 0.2s ease-out",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.25rem 1.75rem",
            borderBottom: "1px solid var(--devio-neutral-1)",
            backgroundColor: "#FAFBFD",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  backgroundColor: adjustmentType === "increase" ? "rgba(111, 172, 156, 0.15)" : "rgba(239, 68, 68, 0.12)",
                  color: adjustmentType === "increase" ? "var(--devio-green)" : "#EF4444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {adjustmentType === "increase" ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
              </div>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--devio-blue-dark)", margin: 0, letterSpacing: "-0.02em" }}>
                Actualizar Precios Masivamente
              </h3>
            </div>
            <p style={{ fontSize: "0.82rem", color: "var(--devio-neutral-3)", marginTop: "4px", margin: 0 }}>
              Aplica un ajuste porcentual a las unidades disponibles con previsualización en tiempo real y registro en la bitácora histórica.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "0.3rem",
              borderRadius: "50%",
              color: "var(--devio-neutral-3)",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} style={{ flex: 1, overflowY: "auto", padding: "1.5rem 1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* QUESTION: ¿A qué unidades deseas aplicar el cambio? */}
          <div>
            <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.5rem" }}>
              1. Alcance de las unidades a modificar *
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
              {/* Option 1: Solo disponibles */}
              <div
                onClick={() => setTargetScope("available_only")}
                style={{
                  border: targetScope === "available_only" ? "2px solid var(--devio-blue)" : "1px solid var(--devio-neutral-1)",
                  borderRadius: "0.75rem",
                  padding: "0.85rem 1rem",
                  backgroundColor: targetScope === "available_only" ? "rgba(31, 54, 82, 0.04)" : "#F8FAFC",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  transition: "all 0.15s ease",
                }}
              >
                <div
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    border: targetScope === "available_only" ? "5px solid var(--devio-blue)" : "2px solid var(--devio-neutral-2)",
                    backgroundColor: "var(--devio-white)",
                    flexShrink: 0,
                  }}
                />
                <div>
                  <span style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--devio-blue-dark)", display: "block" }}>
                    Todas las unidades disponibles ({availableUnits.length})
                  </span>
                  <span style={{ fontSize: "0.74rem", color: "var(--devio-neutral-3)" }}>
                    Aplica el cambio a todas las unidades libres del inventario.
                  </span>
                </div>
              </div>

              {/* Option 2: Seleccionar unidades */}
              <div
                onClick={() => setTargetScope("selected_units")}
                style={{
                  border: targetScope === "selected_units" ? "2px solid var(--devio-blue)" : "1px solid var(--devio-neutral-1)",
                  borderRadius: "0.75rem",
                  padding: "0.85rem 1rem",
                  backgroundColor: targetScope === "selected_units" ? "rgba(31, 54, 82, 0.04)" : "#F8FAFC",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  transition: "all 0.15s ease",
                }}
              >
                <div
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    border: targetScope === "selected_units" ? "5px solid var(--devio-blue)" : "2px solid var(--devio-neutral-2)",
                    backgroundColor: "var(--devio-white)",
                    flexShrink: 0,
                  }}
                />
                <div>
                  <span style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--devio-blue-dark)", display: "block" }}>
                    Selección manual ({selectedUnitNumbers.length} seleccionadas)
                  </span>
                  <span style={{ fontSize: "0.74rem", color: "var(--devio-neutral-3)" }}>
                    Elige manualmente qué unidades cambiarán de precio.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* TIPO DE AJUSTE (Aumento vs Descuento) */}
          <div>
            <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.5rem" }}>
              2. Dirección del Ajuste *
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
              {/* Aumento */}
              <div
                onClick={() => setAdjustmentType("increase")}
                style={{
                  border: adjustmentType === "increase" ? "2px solid var(--devio-green)" : "1px solid var(--devio-neutral-1)",
                  borderRadius: "0.75rem",
                  padding: "0.75rem 1rem",
                  backgroundColor: adjustmentType === "increase" ? "rgba(111, 172, 156, 0.1)" : "#F8FAFC",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      border: adjustmentType === "increase" ? "5px solid var(--devio-green)" : "2px solid var(--devio-neutral-2)",
                      backgroundColor: "var(--devio-white)",
                    }}
                  />
                  <div>
                    <span style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--devio-green)", display: "block" }}>
                      Incremento (+)
                    </span>
                    <span style={{ fontSize: "0.74rem", color: "var(--devio-neutral-3)" }}>Aumentar lista de precios</span>
                  </div>
                </div>
                <TrendingUp size={20} style={{ color: "var(--devio-green)" }} />
              </div>

              {/* Descuento */}
              <div
                onClick={() => setAdjustmentType("discount")}
                style={{
                  border: adjustmentType === "discount" ? "2px solid #EF4444" : "1px solid var(--devio-neutral-1)",
                  borderRadius: "0.75rem",
                  padding: "0.75rem 1rem",
                  backgroundColor: adjustmentType === "discount" ? "rgba(239, 68, 68, 0.08)" : "#F8FAFC",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      border: adjustmentType === "discount" ? "5px solid #EF4444" : "2px solid var(--devio-neutral-2)",
                      backgroundColor: "var(--devio-white)",
                    }}
                  />
                  <div>
                    <span style={{ fontSize: "0.88rem", fontWeight: 800, color: "#EF4444", display: "block" }}>
                      Descuento (-)
                    </span>
                    <span style={{ fontSize: "0.74rem", color: "var(--devio-neutral-3)" }}>Disminuir lista de precios</span>
                  </div>
                </div>
                <TrendingDown size={20} style={{ color: "#EF4444" }} />
              </div>
            </div>
          </div>

          {/* INPUTS: Cambio % y Motivo (CLEAN - NO PRECARGADO) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.35rem" }}>
                Porcentaje de Cambio (%) *
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="100"
                  value={pctChangeStr}
                  onChange={(e) => setPctChangeStr(e.target.value)}
                  placeholder="Ej. 5"
                  style={{
                    width: "100%",
                    padding: "0.7rem 2rem 0.7rem 0.9rem",
                    borderRadius: "0.6rem",
                    border: "1.5px solid var(--devio-neutral-2)",
                    fontSize: "0.95rem",
                    fontWeight: 800,
                    color: "var(--devio-blue-dark)",
                  }}
                  required
                />
                <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", fontWeight: 800, color: "var(--devio-neutral-3)" }}>
                  %
                </span>
              </div>
            </div>

            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.35rem" }}>
                Motivo del Ajuste (Para Bitácora y Expediente) *
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej. Ajuste anual por inflación, avance de obra 50%, preventa Fase 2..."
                style={{
                  width: "100%",
                  padding: "0.7rem 0.9rem",
                  borderRadius: "0.6rem",
                  border: "1.5px solid var(--devio-neutral-2)",
                  fontSize: "0.88rem",
                  color: "var(--devio-blue-dark)",
                }}
                required
              />
            </div>
          </div>

          {/* ================================================================ */}
          {/* PREVIEW EN TIEMPO REAL */}
          {/* ================================================================ */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginTop: "0.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Percent size={16} color="var(--devio-blue)" />
                <span style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--devio-blue-dark)" }}>
                  Previsualización del Impacto en Precios ({targetUnits.length} unidades afectadas)
                </span>
              </div>

              {targetScope === "selected_units" && (
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--devio-blue)", background: "none", border: "none", cursor: "pointer" }}
                  >
                    {selectedUnitNumbers.length === availableUnits.length ? "Deseleccionar todas" : "Seleccionar todas"}
                  </button>
                </div>
              )}
            </div>

            {/* Impact Metric Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
              <div style={{ backgroundColor: "#F8FAFC", border: "1px solid var(--devio-neutral-1)", borderRadius: "0.65rem", padding: "0.75rem 1rem" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--devio-neutral-3)", display: "block" }}>Valor Actual Inventario</span>
                <strong style={{ fontSize: "1rem", color: "var(--devio-blue-dark)" }}>{formatMoney(currentTotalVal)}</strong>
              </div>

              <div style={{ backgroundColor: "#F8FAFC", border: "1px solid var(--devio-neutral-1)", borderRadius: "0.65rem", padding: "0.75rem 1rem" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--devio-neutral-3)", display: "block" }}>Nuevo Valor Proyectado</span>
                <strong style={{ fontSize: "1rem", color: adjustmentType === "increase" ? "var(--devio-green)" : "#EF4444" }}>
                  {formatMoney(projectedTotalVal)}
                </strong>
              </div>

              <div style={{ backgroundColor: "#F8FAFC", border: "1px solid var(--devio-neutral-1)", borderRadius: "0.65rem", padding: "0.75rem 1rem" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--devio-neutral-3)", display: "block" }}>Diferencia Neta Total</span>
                <strong style={{ fontSize: "1rem", color: netDifference >= 0 ? "var(--devio-green)" : "#EF4444" }}>
                  {netDifference > 0 ? `+ ${formatMoney(netDifference)}` : formatMoney(netDifference)}
                  {pctChange > 0 && <span style={{ fontSize: "0.75rem", marginLeft: "4px" }}>({adjustmentType === "increase" ? `+${pctChange}%` : `-${pctChange}%`})</span>}
                </strong>
              </div>
            </div>

            {/* Search within preview table */}
            <div style={{ position: "relative", marginTop: "0.25rem" }}>
              <Search size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--devio-neutral-3)" }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrar tabla por número de unidad o nivel..."
                style={{
                  width: "100%",
                  padding: "0.45rem 0.75rem 0.45rem 2.2rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #CBD5E1",
                  fontSize: "0.8rem",
                  backgroundColor: "#FFFFFF",
                }}
              />
            </div>

            {/* PREVIEW TABLE */}
            <div
              style={{
                borderRadius: "0.75rem",
                border: "1px solid var(--devio-neutral-1)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  backgroundColor: "var(--devio-blue-dark)",
                  color: "var(--devio-white)",
                  padding: "0.65rem 1rem",
                  display: "grid",
                  gridTemplateColumns: targetScope === "selected_units" ? "40px 1.2fr 1.2fr 1.5fr 1.2fr" : "1.2fr 1.2fr 1.5fr 1.2fr",
                  alignItems: "center",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                }}
              >
                {targetScope === "selected_units" && (
                  <input
                    type="checkbox"
                    checked={selectedUnitNumbers.length === availableUnits.length && availableUnits.length > 0}
                    onChange={handleSelectAll}
                    style={{ width: "15px", height: "15px", cursor: "pointer" }}
                  />
                )}
                <span>Unidad / Tipo</span>
                <span>Precio Actual</span>
                <span>Nuevo Precio Proyectado</span>
                <span style={{ textAlign: "right" }}>Diferencia ($)</span>
              </div>

              <div style={{ maxHeight: "200px", overflowY: "auto", backgroundColor: "var(--devio-white)" }}>
                {displayedUnits.length === 0 ? (
                  <div style={{ padding: "1.5rem", textAlign: "center", fontSize: "0.8rem", color: "var(--devio-neutral-3)" }}>
                    No hay unidades disponibles para mostrar con ese filtro.
                  </div>
                ) : (
                  displayedUnits.map((u, idx) => {
                    const isChecked = selectedUnitNumbers.includes(u.unit);
                    const willUpdate = targetScope === "available_only" || isChecked;
                    const newPrice = willUpdate ? calculateNewPrice(u.price) : u.price;
                    const diff = newPrice - u.price;
                    const priceM2Current = u.areaM2 ? Math.round(u.price / u.areaM2) : 0;
                    const priceM2New = u.areaM2 ? Math.round(newPrice / u.areaM2) : 0;

                    return (
                      <div
                        key={u.unit}
                        onClick={() => {
                          if (targetScope === "selected_units") {
                            handleToggleUnitSelection(u.unit);
                          }
                        }}
                        style={{
                          display: "grid",
                          gridTemplateColumns: targetScope === "selected_units" ? "40px 1.2fr 1.2fr 1.5fr 1.2fr" : "1.2fr 1.2fr 1.5fr 1.2fr",
                          alignItems: "center",
                          padding: "0.55rem 1rem",
                          borderBottom: "1px solid var(--devio-neutral-1)",
                          fontSize: "0.82rem",
                          backgroundColor: willUpdate ? (idx % 2 === 0 ? "#FFF" : "#FAFBFD") : "#F1F5F9",
                          opacity: willUpdate ? 1 : 0.45,
                          cursor: targetScope === "selected_units" ? "pointer" : "default",
                        }}
                      >
                        {targetScope === "selected_units" && (
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            style={{ width: "15px", height: "15px", cursor: "pointer" }}
                          />
                        )}
                        <div>
                          <strong style={{ color: "var(--devio-blue-dark)", display: "block" }}>Unidad {u.unit}</strong>
                          <span style={{ fontSize: "0.7rem", color: "var(--devio-neutral-3)" }}>{u.type || "Depto"} • {u.areaM2 || 0} m²</span>
                        </div>
                        <div>
                          <span style={{ color: "var(--devio-neutral-4)", fontWeight: 600 }}>{formatMoney(u.price)}</span>
                          {priceM2Current > 0 && <span style={{ fontSize: "0.68rem", color: "#94A3B8", display: "block" }}>${priceM2Current.toLocaleString("es-MX")}/m²</span>}
                        </div>
                        <div>
                          <strong style={{ color: pctChange === 0 ? "var(--devio-blue-dark)" : adjustmentType === "increase" ? "var(--devio-green)" : "#EF4444" }}>
                            {formatMoney(newPrice)}
                          </strong>
                          {priceM2New > 0 && willUpdate && pctChange > 0 && (
                            <span style={{ fontSize: "0.68rem", color: adjustmentType === "increase" ? "var(--devio-green)" : "#EF4444", display: "block" }}>
                              ${priceM2New.toLocaleString("es-MX")}/m²
                            </span>
                          )}
                        </div>
                        <div style={{ textAlign: "right" }}>
                          {pctChange === 0 || !willUpdate ? (
                            <span style={{ fontSize: "0.74rem", color: "#94A3B8" }}>Sin cambio</span>
                          ) : (
                            <span
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                padding: "0.15rem 0.45rem",
                                borderRadius: "0.3rem",
                                backgroundColor: diff > 0 ? "rgba(111, 172, 156, 0.15)" : "rgba(239, 68, 68, 0.12)",
                                color: diff > 0 ? "var(--devio-green)" : "#EF4444",
                              }}
                            >
                              {diff > 0 ? `+${formatMoney(diff)}` : formatMoney(diff)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Footer Save Button */}
          <div
            style={{
              paddingTop: "0.75rem",
              borderTop: "1px solid var(--devio-neutral-1)",
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem",
              alignItems: "center",
              marginTop: "auto",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.65rem 1.4rem",
                borderRadius: "9999px",
                border: "1px solid var(--devio-neutral-2)",
                backgroundColor: "transparent",
                color: "var(--devio-blue-dark)",
                fontSize: "0.875rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSaving || pctChange <= 0 || targetUnits.length === 0}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.65rem 1.75rem",
                borderRadius: "9999px",
                backgroundColor: showSuccessToast ? "var(--devio-green)" : "var(--devio-blue-dark)",
                color: "var(--devio-white)",
                fontSize: "0.875rem",
                fontWeight: 800,
                border: "none",
                cursor: isSaving || pctChange <= 0 || targetUnits.length === 0 ? "not-allowed" : "pointer",
                opacity: pctChange <= 0 || targetUnits.length === 0 ? 0.6 : 1,
                boxShadow: "0 4px 14px rgba(22, 43, 63, 0.3)",
                transition: "all 0.15s ease",
              }}
            >
              {showSuccessToast ? (
                <>
                  <CheckCircle2 size={18} /> ¡Precios Actualizados!
                </>
              ) : isSaving ? (
                "Aplicando Ajuste..."
              ) : (
                <>
                  <Save size={16} /> Aplicar Ajuste a {targetUnits.length} Unidades
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
