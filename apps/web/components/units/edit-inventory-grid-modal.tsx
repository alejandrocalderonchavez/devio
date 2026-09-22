"use client";

import React, { useState } from "react";
import {
  X,
  Plus,
  Upload,
  Maximize2,
  Minimize2,
  Trash2,
  Lock,
  Check,
  Save,
  AlertCircle,
  Sparkles,
  Layers,
  FileSpreadsheet,
  CheckCircle2
} from "lucide-react";
import { UnitItem } from "./bulk-price-modal";

export interface EditInventoryGridModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialUnits: UnitItem[];
  currency?: "MXN" | "USD";
  onSaveUnits: (updatedUnits: UnitItem[]) => void;
}

export default function EditInventoryGridModal({
  isOpen,
  onClose,
  initialUnits,
  currency = "MXN",
  onSaveUnits,
}: EditInventoryGridModalProps) {
  const [units, setUnits] = useState<UnitItem[]>(initialUnits);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [customColumns, setCustomColumns] = useState<string[]>(["Piso / Nivel", "Recámaras"]);
  const [newColumnName, setNewColumnName] = useState("");
  const [showAddColInput, setShowAddColInput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const handleAddUnit = () => {
    const defaultPrice = units.length > 0
      ? Math.round(units.reduce((sum, u) => sum + (u.price || 0), 0) / units.length)
      : 3500000;
    const newUnitNumber = `${units.length + 1}A`;
    const newUnit: UnitItem = {
      id: `u-${Date.now()}`,
      unit: newUnitNumber,
      type: "Departamento",
      price: defaultPrice,
      areaM2: 75,
      floor: 1,
      status: "DISPONIBLE",
      client: "Sin asignar",
      deliveryDate: "",
    };
    setUnits([...units, newUnit]);
  };

  const handleUpdateUnitField = (index: number, field: keyof UnitItem, value: any) => {
    setUnits((prev) =>
      prev.map((u, i) => (i === index ? { ...u, [field]: value } : u))
    );
  };

  const handleDeleteUnit = (index: number) => {
    const target = units[index];
    if (!target) return;

    // RULE: Cannot delete sold or reserved units
    if (target.status === "VENDIDA" || target.status === "APARTADA") {
      alert(`No se puede eliminar la unidad ${target.unit} porque ya está ${target.status}. Solo se pueden eliminar unidades Disponibles.`);
      return;
    }

    setUnits(units.filter((_, i) => i !== index));
  };

  const handleAddCustomColumn = () => {
    if (newColumnName.trim() && !customColumns.includes(newColumnName.trim())) {
      setCustomColumns([...customColumns, newColumnName.trim()]);
      setNewColumnName("");
      setShowAddColInput(false);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      onSaveUnits(units);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 600);
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
        padding: isFullscreen ? 0 : "1rem",
      }}
    >
      <div
        style={{
          backgroundColor: "var(--devio-white)",
          borderRadius: isFullscreen ? 0 : "1.25rem",
          width: isFullscreen ? "100vw" : "100%",
          maxWidth: isFullscreen ? "100vw" : "960px",
          height: isFullscreen ? "100vh" : "88vh",
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
            alignItems: "center",
          }}
        >
          <div>
            <h3 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--devio-blue-dark)", margin: 0, letterSpacing: "-0.02em" }}>
              Editar Inventario
            </h3>
            <p style={{ fontSize: "0.82rem", color: "var(--devio-neutral-3)", marginTop: "2px", margin: 0 }}>
              Administra las unidades de tu proyecto: agrega, edita o importa múltiples unidades de forma rápida.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "0.4rem",
                borderRadius: "6px",
                color: "var(--devio-neutral-3)",
              }}
              title={isFullscreen ? "Restaurar" : "Pantalla Completa"}
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "0.4rem",
                borderRadius: "50%",
                color: "var(--devio-neutral-3)",
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Action Toolbar */}
        <div
          style={{
            padding: "0.75rem 1.75rem",
            borderBottom: "1px solid var(--devio-neutral-1)",
            backgroundColor: "#F8FAFC",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={handleAddUnit}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.55rem 1.1rem",
                borderRadius: "9999px",
                backgroundColor: "var(--devio-blue-dark)",
                color: "var(--devio-white)",
                fontSize: "0.82rem",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
              }}
            >
              <Plus size={15} /> Agregar Unidad
            </button>

            <button
              type="button"
              onClick={() => alert("Función para importar CSV/Excel con mapeo automático de columnas.")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.55rem 1.1rem",
                borderRadius: "9999px",
                backgroundColor: "var(--devio-blue)",
                color: "var(--devio-white)",
                fontSize: "0.82rem",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
              }}
            >
              <FileSpreadsheet size={15} /> Importar CSV
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem", color: "var(--devio-neutral-3)" }}>
            <Lock size={13} style={{ color: "var(--devio-blue-matte)" }} />
            <span>Los precios se actualizan desde &ldquo;Cambiar precios&rdquo;</span>
          </div>
        </div>

        {/* Excel-like Editable Grid (Screenshot 4) */}
        <div style={{ flex: 1, overflow: "auto", padding: "1rem 1.75rem" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: 0,
              fontSize: "0.82rem",
              textAlign: "left",
              border: "1px solid var(--devio-neutral-1)",
              borderRadius: "0.6rem",
              overflow: "hidden",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#F1F5F9", color: "var(--devio-blue-dark)", fontWeight: 700 }}>
                <th style={{ width: "45px", padding: "0.6rem 0.5rem", textAlign: "center", borderBottom: "1.5px solid var(--devio-neutral-1)" }}>#</th>
                <th style={{ padding: "0.6rem 0.75rem", borderBottom: "1.5px solid var(--devio-neutral-1)" }}>Unidad</th>
                <th style={{ padding: "0.6rem 0.75rem", borderBottom: "1.5px solid var(--devio-neutral-1)" }}>Superficie (m²)</th>
                <th style={{ padding: "0.6rem 0.75rem", borderBottom: "1.5px solid var(--devio-neutral-1)" }}>
                  Precio Lista <span style={{ fontSize: "0.68rem", color: "var(--devio-neutral-3)", fontWeight: 500 }}>(Solo Lectura)</span>
                </th>
                <th style={{ padding: "0.6rem 0.75rem", borderBottom: "1.5px solid var(--devio-neutral-1)" }}>Fecha de entrega</th>
                <th style={{ padding: "0.6rem 0.75rem", borderBottom: "1.5px solid var(--devio-neutral-1)" }}>Tipo</th>
                {customColumns.map((col, idx) => (
                  <th key={idx} style={{ padding: "0.6rem 0.75rem", borderBottom: "1.5px solid var(--devio-neutral-1)" }}>{col}</th>
                ))}
                <th style={{ padding: "0.6rem 0.75rem", borderBottom: "1.5px solid var(--devio-neutral-1)" }}>
                  {showAddColInput ? (
                    <div style={{ display: "flex", gap: "0.25rem" }}>
                      <input
                        type="text"
                        placeholder="Nueva col..."
                        value={newColumnName}
                        onChange={(e) => setNewColumnName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddCustomColumn()}
                        style={{ padding: "0.2rem 0.4rem", fontSize: "0.75rem", borderRadius: "4px", border: "1px solid var(--devio-neutral-2)", width: "100px" }}
                        autoFocus
                      />
                      <button type="button" onClick={handleAddCustomColumn} style={{ background: "var(--devio-blue)", color: "#FFF", border: "none", borderRadius: "4px", padding: "0 0.4rem", cursor: "pointer" }}>
                        ✓
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAddColInput(true)}
                      style={{ background: "none", border: "none", color: "var(--devio-blue)", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}
                    >
                      + Columna
                    </button>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {units.map((u, index) => {
                const isSold = u.status === "VENDIDA";
                const isReserved = u.status === "APARTADA";
                const isLocked = isSold || isReserved;

                return (
                  <tr key={index} style={{ borderBottom: "1px solid var(--devio-neutral-1)", backgroundColor: index % 2 === 0 ? "#FFF" : "#FAFBFD" }}>
                    {/* Row number & Delete / Lock */}
                    <td style={{ padding: "0.4rem 0.3rem", textAlign: "center", borderRight: "1px solid var(--devio-neutral-1)" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.2rem" }}>
                        <span style={{ color: "var(--devio-neutral-3)", fontSize: "0.75rem", fontWeight: 600 }}>{index + 1}</span>
                        {isLocked ? (
                          <span title={`Unidad ${u.status} (No eliminable)`} style={{ color: "var(--devio-neutral-2)" }}>
                            <Lock size={12} />
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDeleteUnit(index)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--devio-red)",
                              cursor: "pointer",
                              padding: 0,
                              display: "flex",
                            }}
                            title="Eliminar unidad disponible"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Unidad */}
                    <td style={{ padding: "0.3rem 0.5rem", borderRight: "1px solid var(--devio-neutral-1)" }}>
                      <input
                        type="text"
                        value={u.unit}
                        onChange={(e) => handleUpdateUnitField(index, "unit", e.target.value)}
                        style={{ width: "100%", border: "1px solid transparent", padding: "0.25rem 0.4rem", borderRadius: "4px", fontWeight: 700, color: "var(--devio-blue-dark)" }}
                        onFocus={(e) => (e.currentTarget.style.border = "1px solid var(--devio-blue)")}
                        onBlur={(e) => (e.currentTarget.style.border = "1px solid transparent")}
                      />
                    </td>

                    {/* Superficie */}
                    <td style={{ padding: "0.3rem 0.5rem", borderRight: "1px solid var(--devio-neutral-1)" }}>
                      <input
                        type="number"
                        value={u.areaM2}
                        onChange={(e) => handleUpdateUnitField(index, "areaM2", parseFloat(e.target.value) || 0)}
                        style={{ width: "100%", border: "1px solid transparent", padding: "0.25rem 0.4rem", borderRadius: "4px", color: "var(--devio-neutral-5)" }}
                        onFocus={(e) => (e.currentTarget.style.border = "1px solid var(--devio-blue)")}
                        onBlur={(e) => (e.currentTarget.style.border = "1px solid transparent")}
                      />
                    </td>

                    {/* Precio */}
                    <td style={{ padding: "0.3rem 0.5rem", borderRight: "1px solid var(--devio-neutral-1)", backgroundColor: isLocked ? "rgba(31, 54, 82, 0.02)" : "transparent" }}>
                      {isLocked ? (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.25rem 0.4rem" }}>
                          <span style={{ fontWeight: 700, color: "var(--devio-blue-dark)" }}>{formatMoney(u.price)}</span>
                          <Lock size={12} style={{ color: "var(--devio-neutral-2)" }} />
                        </div>
                      ) : (
                        <input
                          type="number"
                          value={u.price || ""}
                          onChange={(e) => handleUpdateUnitField(index, "price", parseFloat(e.target.value) || 0)}
                          style={{
                            width: "100%",
                            border: "1px solid transparent",
                            padding: "0.25rem 0.4rem",
                            borderRadius: "4px",
                            fontWeight: 700,
                            color: "var(--devio-blue-dark)",
                          }}
                          onFocus={(e) => (e.currentTarget.style.border = "1px solid var(--devio-blue)")}
                          onBlur={(e) => (e.currentTarget.style.border = "1px solid transparent")}
                        />
                      )}
                    </td>

                    {/* Fecha de entrega */}
                    <td style={{ padding: "0.3rem 0.5rem", borderRight: "1px solid var(--devio-neutral-1)" }}>
                      <input
                        type="text"
                        value={u.deliveryDate || ""}
                        onChange={(e) => handleUpdateUnitField(index, "deliveryDate", e.target.value)}
                        style={{ width: "100%", border: "1px solid transparent", padding: "0.25rem 0.4rem", borderRadius: "4px", color: "var(--devio-neutral-5)" }}
                        onFocus={(e) => (e.currentTarget.style.border = "1px solid var(--devio-blue)")}
                        onBlur={(e) => (e.currentTarget.style.border = "1px solid transparent")}
                      />
                    </td>

                    {/* Tipo */}
                    <td style={{ padding: "0.3rem 0.5rem", borderRight: "1px solid var(--devio-neutral-1)" }}>
                      <select
                        value={u.type}
                        onChange={(e) => handleUpdateUnitField(index, "type", e.target.value)}
                        style={{ width: "100%", border: "1px solid transparent", padding: "0.25rem 0.2rem", borderRadius: "4px", backgroundColor: "transparent", cursor: "pointer" }}
                      >
                        <option value="Departamento">Departamento</option>
                        <option value="Penthouse">Penthouse</option>
                        <option value="Townhouse">Townhouse</option>
                        <option value="Local Comercial">Local Comercial</option>
                        <option value="Oficina">Oficina</option>
                      </select>
                    </td>

                    {/* Dynamic Custom Columns */}
                    {customColumns.map((_, cIdx) => (
                      <td key={cIdx} style={{ padding: "0.3rem 0.5rem", borderRight: "1px solid var(--devio-neutral-1)" }}>
                        <input
                          type="text"
                          defaultValue={cIdx === 0 ? `Nivel ${u.floor}` : "2 Rec."}
                          style={{ width: "100%", border: "1px solid transparent", padding: "0.25rem 0.4rem", borderRadius: "4px" }}
                          onFocus={(e) => (e.currentTarget.style.border = "1px solid var(--devio-blue)")}
                          onBlur={(e) => (e.currentTarget.style.border = "1px solid transparent")}
                        />
                      </td>
                    ))}

                    <td style={{ padding: "0.3rem 0.5rem" }} />
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "1rem 1.75rem",
            borderTop: "1px solid var(--devio-neutral-1)",
            backgroundColor: "#FAFBFD",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "0.82rem", color: "var(--devio-neutral-3)" }}>
            Total en inventario: <strong>{units.length} unidades</strong> ({units.filter((u) => u.status === "DISPONIBLE").length} disponibles)
          </span>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.6rem 1.25rem",
                borderRadius: "9999px",
                border: "1px solid var(--devio-neutral-2)",
                backgroundColor: "transparent",
                color: "var(--devio-neutral-4)",
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
              disabled={isSaving}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                padding: "0.6rem 1.6rem",
                borderRadius: "9999px",
                backgroundColor: saveSuccess ? "var(--devio-green)" : "var(--devio-blue)",
                color: "var(--devio-white)",
                fontSize: "0.875rem",
                fontWeight: 700,
                border: "none",
                cursor: isSaving ? "not-allowed" : "pointer",
              }}
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 size={16} /> ¡Inventario Guardado!
                </>
              ) : isSaving ? (
                "Guardando..."
              ) : (
                <>
                  <Save size={15} /> Guardar Inventario
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
