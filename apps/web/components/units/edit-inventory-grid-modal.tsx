"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Plus,
  Maximize2,
  Minimize2,
  Trash2,
  Lock,
  Save,
  FileSpreadsheet,
  CheckCircle2,
} from "lucide-react";
import * as XLSX from "xlsx";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUnits(initialUnits);
    }
  }, [isOpen, initialUnits]);

  if (!isOpen) return null;

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const handleAddUnit = () => {
    const defaultPrice =
      units.length > 0
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
      bedrooms: 2,
      status: "DISPONIBLE",
      client: "Sin asignar",
      deliveryDate: "",
      customAttributes: {},
    };
    setUnits([...units, newUnit]);
  };

  const handleUpdateUnitField = (index: number, field: keyof UnitItem, value: any) => {
    setUnits((prev) =>
      prev.map((u, i) => (i === index ? { ...u, [field]: value } : u))
    );
  };

  const getCustomColumnValue = (u: UnitItem, colName: string): string => {
    const norm = colName.trim().toLowerCase();
    if (norm.includes("piso") || norm.includes("nivel") || norm.includes("floor") || norm.includes("level")) {
      return u.floor !== undefined && u.floor !== null ? String(u.floor) : "";
    }
    if (
      norm.includes("recámara") ||
      norm.includes("recamara") ||
      norm.includes("cuarto") ||
      norm.includes("habitación") ||
      norm.includes("habitacion") ||
      norm.includes("bed")
    ) {
      return u.bedrooms !== undefined && u.bedrooms !== null ? String(u.bedrooms) : "";
    }
    if (norm.includes("baño") || norm.includes("bano") || norm.includes("bath")) {
      return u.bathrooms !== undefined && u.bathrooms !== null ? String(u.bathrooms) : "";
    }
    if (
      norm.includes("estacionamiento") ||
      norm.includes("cajón") ||
      norm.includes("cajon") ||
      norm.includes("parking") ||
      norm.includes("auto")
    ) {
      return u.parkingSpots !== undefined && u.parkingSpots !== null ? String(u.parkingSpots) : "";
    }
    if (norm.includes("bodega") || norm.includes("storage")) {
      return u.storageUnits !== undefined && u.storageUnits !== null ? String(u.storageUnits) : "";
    }
    if (norm.includes("orientaci") || norm.includes("orientation")) {
      return u.orientation || "";
    }
    if (norm.includes("vista") || norm.includes("view")) {
      return u.viewType || "";
    }
    return u.customAttributes?.[colName] !== undefined && u.customAttributes?.[colName] !== null
      ? String(u.customAttributes[colName])
      : "";
  };

  const handleUpdateCustomColumnValue = (index: number, colName: string, rawVal: string) => {
    setUnits((prev) =>
      prev.map((u, i) => {
        if (i !== index) return u;
        const norm = colName.trim().toLowerCase();
        if (norm.includes("piso") || norm.includes("nivel") || norm.includes("floor") || norm.includes("level")) {
          const num = parseInt(rawVal.replace(/\D/g, ""), 10);
          return { ...u, floor: isNaN(num) ? 1 : num };
        }
        if (
          norm.includes("recámara") ||
          norm.includes("recamara") ||
          norm.includes("cuarto") ||
          norm.includes("habitación") ||
          norm.includes("habitacion") ||
          norm.includes("bed")
        ) {
          const num = parseInt(rawVal.replace(/\D/g, ""), 10);
          return { ...u, bedrooms: isNaN(num) ? 0 : num };
        }
        if (norm.includes("baño") || norm.includes("bano") || norm.includes("bath")) {
          const num = parseFloat(rawVal.replace(/[^0-9.]/g, ""));
          return { ...u, bathrooms: isNaN(num) ? 0 : num };
        }
        if (
          norm.includes("estacionamiento") ||
          norm.includes("cajón") ||
          norm.includes("cajon") ||
          norm.includes("parking") ||
          norm.includes("auto")
        ) {
          const num = parseInt(rawVal.replace(/\D/g, ""), 10);
          return { ...u, parkingSpots: isNaN(num) ? 0 : num };
        }
        if (norm.includes("bodega") || norm.includes("storage")) {
          const num = parseInt(rawVal.replace(/\D/g, ""), 10);
          return { ...u, storageUnits: isNaN(num) ? 0 : num };
        }
        if (norm.includes("orientaci") || norm.includes("orientation")) {
          return { ...u, orientation: rawVal };
        }
        if (norm.includes("vista") || norm.includes("view")) {
          return { ...u, viewType: rawVal };
        }
        return {
          ...u,
          customAttributes: {
            ...(u.customAttributes || {}),
            [colName]: rawVal,
          },
        };
      })
    );
  };

  const handleDeleteUnit = (index: number) => {
    const target = units[index];
    if (!target) return;

    // RULE: Cannot delete sold or reserved units
    if (target.status === "VENDIDA" || target.status === "APARTADA") {
      alert(
        `No se puede eliminar la unidad ${target.unit} porque ya está ${target.status}. Solo se pueden eliminar unidades Disponibles.`
      );
      return;
    }

    setUnits(units.filter((_, i) => i !== index));
  };

  const handleAddCustomColumn = () => {
    const colTrim = newColumnName.trim();
    if (colTrim && !customColumns.includes(colTrim)) {
      setCustomColumns([...customColumns, colTrim]);
      setNewColumnName("");
      setShowAddColInput(false);
    }
  };

  const handleRemoveCustomColumn = (colToRemove: string) => {
    setCustomColumns(customColumns.filter((col) => col !== colToRemove));
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let rawRows: string[][] = [];
      const isCsv = file.name.endsWith(".csv") || file.type.includes("csv") || file.type.includes("text");
      if (isCsv) {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        rawRows = lines.map((line) =>
          line.split(",").map((c) => c.replace(/^["']|["']$/g, "").trim())
        );
      } else {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        if (sheetName) {
          const worksheet = workbook.Sheets[sheetName];
          if (worksheet) {
            const rawJson = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
            rawRows = rawJson
              .filter((r) => Array.isArray(r) && r.some((c) => c !== undefined && c !== null && String(c).trim() !== ""))
              .map((r) => r.map((c) => (c !== undefined && c !== null ? String(c).trim() : "")));
          }
        }
      }

      if (rawRows.length === 0) {
        alert("El archivo está vacío o no contiene filas con datos.");
        return;
      }

      const firstRow = rawRows[0] || [];
      const isHeader = firstRow.some((h) =>
        /unidad|unit|depto|lote|superficie|area|m2|precio|price|piso|nivel|recamara|habitacion|tipo/i.test(
          String(h)
        )
      );

      const headers: string[] = isHeader ? firstRow : [];
      const dataRows = isHeader ? rawRows.slice(1) : rawRows;

      const existingMap = new Map<string, number>();
      units.forEach((u, idx) => existingMap.set(u.unit.toLowerCase().trim(), idx));

      const updatedList = [...units];
      const newlyDiscoveredCols: string[] = [];

      dataRows.forEach((row, rIdx) => {
        let unitNum = "";
        let type = "Departamento";
        let areaM2 = 75;
        let floor = 1;
        let price = 3500000;
        let status: "DISPONIBLE" | "VENDIDA" | "BLOQUEADA" | "APARTADA" = "DISPONIBLE";
        let deliveryDate = "";
        let bedrooms = 2;
        let bathrooms = 2;
        let parkingSpots = 1;
        let storageUnits = 0;
        const customMap: Record<string, any> = {};

        if (isHeader) {
          headers.forEach((h, hIdx) => {
            const val = row[hIdx] || "";
            const hNorm = h.toLowerCase().trim();
            if (
              hNorm.includes("unidad") ||
              hNorm.includes("unit") ||
              hNorm.includes("depto") ||
              hNorm.includes("lote") ||
              hNorm === "no" ||
              hNorm === "#"
            ) {
              unitNum = val;
            } else if (hNorm.includes("tipo") || hNorm.includes("type") || hNorm.includes("categor")) {
              type = val || "Departamento";
            } else if (
              hNorm.includes("superficie") ||
              hNorm.includes("area") ||
              hNorm.includes("m2") ||
              hNorm.includes("m²")
            ) {
              const parsed = parseFloat(val.replace(/[^0-9.]/g, ""));
              if (!isNaN(parsed)) areaM2 = parsed;
            } else if (
              hNorm.includes("piso") ||
              hNorm.includes("nivel") ||
              hNorm.includes("floor") ||
              hNorm.includes("level")
            ) {
              const parsed = parseInt(val.replace(/\D/g, ""), 10);
              if (!isNaN(parsed)) floor = parsed;
            } else if (
              hNorm.includes("precio") ||
              hNorm.includes("price") ||
              hNorm.includes("costo") ||
              hNorm.includes("monto")
            ) {
              const parsed = parseFloat(val.replace(/[^0-9.]/g, ""));
              if (!isNaN(parsed)) price = parsed;
            } else if (
              hNorm.includes("recámara") ||
              hNorm.includes("recamara") ||
              hNorm.includes("cuarto") ||
              hNorm.includes("habitación") ||
              hNorm.includes("habitacion") ||
              hNorm.includes("bed")
            ) {
              const parsed = parseInt(val.replace(/\D/g, ""), 10);
              if (!isNaN(parsed)) bedrooms = parsed;
            } else if (hNorm.includes("baño") || hNorm.includes("bano") || hNorm.includes("bath")) {
              const parsed = parseFloat(val.replace(/[^0-9.]/g, ""));
              if (!isNaN(parsed)) bathrooms = parsed;
            } else if (
              hNorm.includes("estacionamiento") ||
              hNorm.includes("cajón") ||
              hNorm.includes("cajon") ||
              hNorm.includes("parking")
            ) {
              const parsed = parseInt(val.replace(/\D/g, ""), 10);
              if (!isNaN(parsed)) parkingSpots = parsed;
            } else if (hNorm.includes("bodega") || hNorm.includes("storage")) {
              const parsed = parseInt(val.replace(/\D/g, ""), 10);
              if (!isNaN(parsed)) storageUnits = parsed;
            } else if (hNorm.includes("entrega") || hNorm.includes("fecha") || hNorm.includes("delivery")) {
              deliveryDate = val;
            } else if (hNorm.includes("status") || hNorm.includes("estado")) {
              const sNorm = val.toUpperCase().trim();
              if (sNorm.includes("VEND") || sNorm.includes("SOLD")) status = "VENDIDA";
              else if (sNorm.includes("BLOQ") || sNorm.includes("BLOCK")) status = "BLOQUEADA";
              else if (sNorm.includes("APART") || sNorm.includes("RESERV")) status = "APARTADA";
              else status = "DISPONIBLE";
            } else if (val) {
              customMap[h] = val;
              if (!customColumns.includes(h) && !newlyDiscoveredCols.includes(h)) {
                newlyDiscoveredCols.push(h);
              }
            }
          });
        } else {
          unitNum = row[0] || `Unidad ${units.length + rIdx + 1}`;
          type = row[1] || "Departamento";
          areaM2 = parseFloat(String(row[2] || "").replace(/[^0-9.]/g, "")) || 75;
          floor = parseInt(String(row[3] || "").replace(/\D/g, ""), 10) || 1;
          price = parseFloat(String(row[4] || "").replace(/[^0-9.]/g, "")) || 3500000;
          const sNorm = (row[5] || "").toUpperCase().trim();
          if (sNorm.includes("VEND") || sNorm.includes("SOLD")) status = "VENDIDA";
          else if (sNorm.includes("BLOQ") || sNorm.includes("BLOCK")) status = "BLOQUEADA";
          else if (sNorm.includes("APART") || sNorm.includes("RESERV")) status = "APARTADA";
          else status = "DISPONIBLE";
          deliveryDate = row[7] || "";
        }

        if (!unitNum) {
          unitNum = `${units.length + rIdx + 1}A`;
        }

        const cleanKey = unitNum.toLowerCase().trim();
        const unitObj: UnitItem = {
          id: `u-imp-${Date.now()}-${rIdx}`,
          unit: unitNum,
          type,
          areaM2,
          floor,
          price,
          status,
          client: status === "VENDIDA" ? "Cliente Asignado" : "Sin asignar",
          deliveryDate,
          bedrooms,
          bathrooms,
          parkingSpots,
          storageUnits,
          customAttributes: Object.keys(customMap).length > 0 ? customMap : undefined,
        };

        if (existingMap.has(cleanKey)) {
          const idx = existingMap.get(cleanKey)!;
          const target = updatedList[idx];
          if (target) {
            updatedList[idx] = {
              ...target,
              ...unitObj,
              id: target.id,
              price: target.status === "VENDIDA" ? target.price : unitObj.price,
            };
          }
        } else {
          updatedList.push(unitObj);
          existingMap.set(cleanKey, updatedList.length - 1);
        }
      });

      if (newlyDiscoveredCols.length > 0) {
        setCustomColumns((prev) => [...prev, ...newlyDiscoveredCols]);
      }

      setUnits(updatedList);
      alert(`Se procesaron ${dataRows.length} unidades desde el archivo.`);
    } catch (err) {
      console.error("Error al procesar archivo:", err);
      alert("Hubo un error al procesar el archivo. Por favor verifica que el formato sea válido.");
    } finally {
      if (e.target) e.target.value = "";
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
    }, 400);
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
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv,.xlsx,.xls"
        style={{ display: "none" }}
        onChange={handleFileImport}
      />

      <div
        style={{
          backgroundColor: "var(--devio-white)",
          borderRadius: isFullscreen ? 0 : "1.25rem",
          width: isFullscreen ? "100vw" : "100%",
          maxWidth: isFullscreen ? "100vw" : "1100px",
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
            <h3
              style={{
                fontSize: "1.35rem",
                fontWeight: 800,
                color: "var(--devio-blue-dark)",
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              Editar Inventario
            </h3>
            <p
              style={{
                fontSize: "0.82rem",
                color: "var(--devio-neutral-3)",
                marginTop: "2px",
                margin: 0,
              }}
            >
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
              onClick={() => fileInputRef.current?.click()}
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
              <FileSpreadsheet size={15} /> Importar CSV / Excel
            </button>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.75rem",
              color: "var(--devio-neutral-3)",
            }}
          >
            <Lock size={13} style={{ color: "var(--devio-blue-matte)" }} />
            <span>Los precios de venta se ajustan desde &ldquo;Cambiar precios&rdquo;</span>
          </div>
        </div>

        {/* Excel-like Editable Grid */}
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
                <th
                  style={{
                    width: "45px",
                    padding: "0.6rem 0.5rem",
                    textAlign: "center",
                    borderBottom: "1.5px solid var(--devio-neutral-1)",
                  }}
                >
                  #
                </th>
                <th style={{ padding: "0.6rem 0.75rem", borderBottom: "1.5px solid var(--devio-neutral-1)" }}>
                  Unidad
                </th>
                <th style={{ padding: "0.6rem 0.75rem", borderBottom: "1.5px solid var(--devio-neutral-1)" }}>
                  Superficie (m²)
                </th>
                <th style={{ padding: "0.6rem 0.75rem", borderBottom: "1.5px solid var(--devio-neutral-1)" }}>
                  Precio Lista <span style={{ fontSize: "0.68rem", color: "var(--devio-neutral-3)", fontWeight: 500 }}>(Solo Lectura)</span>
                </th>
                <th style={{ padding: "0.6rem 0.75rem", borderBottom: "1.5px solid var(--devio-neutral-1)" }}>
                  Fecha de entrega
                </th>
                <th style={{ padding: "0.6rem 0.75rem", borderBottom: "1.5px solid var(--devio-neutral-1)" }}>
                  Tipo
                </th>
                {customColumns.map((col, idx) => (
                  <th
                    key={idx}
                    style={{
                      padding: "0.6rem 0.75rem",
                      borderBottom: "1.5px solid var(--devio-neutral-1)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span>{col}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomColumn(col)}
                        title="Ocultar columna"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--devio-neutral-3)",
                          padding: "1px",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </th>
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
                        style={{
                          padding: "0.2rem 0.4rem",
                          fontSize: "0.75rem",
                          borderRadius: "4px",
                          border: "1px solid var(--devio-neutral-2)",
                          width: "110px",
                        }}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomColumn}
                        style={{
                          background: "var(--devio-blue)",
                          color: "#FFF",
                          border: "none",
                          borderRadius: "4px",
                          padding: "0 0.4rem",
                          cursor: "pointer",
                        }}
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddColInput(false)}
                        style={{
                          background: "transparent",
                          color: "var(--devio-neutral-4)",
                          border: "none",
                          borderRadius: "4px",
                          padding: "0 0.3rem",
                          cursor: "pointer",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAddColInput(true)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--devio-blue)",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
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
                  <tr
                    key={u.id || index}
                    style={{
                      borderBottom: "1px solid var(--devio-neutral-1)",
                      backgroundColor: index % 2 === 0 ? "#FFF" : "#FAFBFD",
                    }}
                  >
                    {/* Row number & Delete / Lock */}
                    <td
                      style={{
                        padding: "0.4rem 0.3rem",
                        textAlign: "center",
                        borderRight: "1px solid var(--devio-neutral-1)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.2rem",
                        }}
                      >
                        <span style={{ color: "var(--devio-neutral-3)", fontSize: "0.75rem", fontWeight: 600 }}>
                          {index + 1}
                        </span>
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
                    </td>

                    {/* Superficie */}
                    <td style={{ padding: "0.3rem 0.5rem", borderRight: "1px solid var(--devio-neutral-1)" }}>
                      <input
                        type="number"
                        value={u.areaM2}
                        onChange={(e) => handleUpdateUnitField(index, "areaM2", parseFloat(e.target.value) || 0)}
                        style={{
                          width: "100%",
                          border: "1px solid transparent",
                          padding: "0.25rem 0.4rem",
                          borderRadius: "4px",
                          color: "var(--devio-neutral-5)",
                        }}
                        onFocus={(e) => (e.currentTarget.style.border = "1px solid var(--devio-blue)")}
                        onBlur={(e) => (e.currentTarget.style.border = "1px solid transparent")}
                      />
                    </td>

                    {/* Precio Lista (Solo Lectura) */}
                    <td
                      style={{
                        padding: "0.3rem 0.5rem",
                        borderRight: "1px solid var(--devio-neutral-1)",
                        backgroundColor: "rgba(31, 54, 82, 0.02)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "0.25rem 0.4rem",
                        }}
                        title="Los precios se actualizan únicamente desde 'Ajustar Precio' o 'Actualizar Precios Masivamente'."
                      >
                        <span style={{ fontWeight: 700, color: "var(--devio-blue-dark)" }}>
                          {formatMoney(u.price)}
                        </span>
                        <Lock size={12} style={{ color: "var(--devio-neutral-3)" }} />
                      </div>
                    </td>

                    {/* Fecha de entrega */}
                    <td style={{ padding: "0.3rem 0.5rem", borderRight: "1px solid var(--devio-neutral-1)" }}>
                      <input
                        type="text"
                        value={u.deliveryDate || ""}
                        placeholder="Ej. Dic 2026"
                        onChange={(e) => handleUpdateUnitField(index, "deliveryDate", e.target.value)}
                        style={{
                          width: "100%",
                          border: "1px solid transparent",
                          padding: "0.25rem 0.4rem",
                          borderRadius: "4px",
                          color: "var(--devio-neutral-5)",
                        }}
                        onFocus={(e) => (e.currentTarget.style.border = "1px solid var(--devio-blue)")}
                        onBlur={(e) => (e.currentTarget.style.border = "1px solid transparent")}
                      />
                    </td>

                    {/* Tipo */}
                    <td style={{ padding: "0.3rem 0.5rem", borderRight: "1px solid var(--devio-neutral-1)" }}>
                      <select
                        value={u.type}
                        onChange={(e) => handleUpdateUnitField(index, "type", e.target.value)}
                        style={{
                          width: "100%",
                          border: "1px solid transparent",
                          padding: "0.25rem 0.2rem",
                          borderRadius: "4px",
                          backgroundColor: "transparent",
                          cursor: "pointer",
                        }}
                      >
                        <option value="Departamento">Departamento</option>
                        <option value="Penthouse">Penthouse</option>
                        <option value="Townhouse">Townhouse</option>
                        <option value="Casa">Casa</option>
                        <option value="Local Comercial">Local Comercial</option>
                        <option value="Oficina">Oficina</option>
                        <option value="Lote / Terreno">Lote / Terreno</option>
                        <option value="Bodega">Bodega</option>
                      </select>
                    </td>

                    {/* Dynamic Custom Columns */}
                    {customColumns.map((col, cIdx) => (
                      <td
                        key={cIdx}
                        style={{ padding: "0.3rem 0.5rem", borderRight: "1px solid var(--devio-neutral-1)" }}
                      >
                        <input
                          type="text"
                          value={getCustomColumnValue(u, col)}
                          onChange={(e) => handleUpdateCustomColumnValue(index, col, e.target.value)}
                          placeholder="-"
                          style={{
                            width: "100%",
                            border: "1px solid transparent",
                            padding: "0.25rem 0.4rem",
                            borderRadius: "4px",
                          }}
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
            Total en inventario: <strong>{units.length} unidades</strong> (
            {units.filter((u) => u.status === "DISPONIBLE").length} disponibles)
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
