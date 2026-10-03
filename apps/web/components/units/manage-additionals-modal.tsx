"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Package,
  Plus,
  Car,
  Archive,
  Sparkles,
  Layers,
  Edit2,
  Trash2,
  Search,
  Lock,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import * as XLSX from "xlsx";
import { generateAdditionalsExcelTemplate } from "@/lib/excel-utils";

export interface ProjectAdditional {
  id: string;
  name: string;
  category: "estacionamiento" | "bodega" | "acabados" | "terraza" | "otro";
  price: number;
  areaM2?: number;
  status: "DISPONIBLE" | "ASIGNADO" | "VENDIDO";
  assignedToUnit?: string;
  notes?: string;
}

export interface ManageAdditionalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency?: "MXN" | "USD";
  initialAdditionals?: ProjectAdditional[];
  onSaveAdditionals?: (additionals: ProjectAdditional[]) => void;
}

export default function ManageAdditionalsModal({
  isOpen,
  onClose,
  currency = "MXN",
  initialAdditionals = [],
  onSaveAdditionals,
}: ManageAdditionalsModalProps) {
  const [additionals, setAdditionals] = useState<ProjectAdditional[]>(initialAdditionals);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Individual modal states
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProjectAdditional | null>(null);

  // Form fields
  const [itemName, setItemName] = useState("");
  const [itemCategory, setItemCategory] = useState<ProjectAdditional["category"]>("bodega");
  const [itemPrice, setItemPrice] = useState<number>(150000);
  const [itemArea, setItemArea] = useState<number>(0);
  const [itemStatus, setItemStatus] = useState<ProjectAdditional["status"]>("DISPONIBLE");
  const [itemNotes, setItemNotes] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialAdditionals) {
      setAdditionals(initialAdditionals);
    }
  }, [initialAdditionals, isOpen]);

  if (!isOpen) return null;

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setItemName(`Adicional ${additionals.length + 1}`);
    setItemCategory("estacionamiento");
    setItemPrice(150000);
    setItemArea(0);
    setItemStatus("DISPONIBLE");
    setItemNotes("");
    setIsItemModalOpen(true);
  };

  const handleOpenEditModal = (item: ProjectAdditional) => {
    if (item.status !== "DISPONIBLE") {
      alert(`Solo se pueden editar adicionales con estatus Disponible. Este adicional está: ${item.status}.`);
      return;
    }
    setEditingItem(item);
    setItemName(item.name);
    setItemCategory(item.category);
    setItemPrice(item.price);
    setItemArea(item.areaM2 || 0);
    setItemStatus(item.status);
    setItemNotes(item.notes || "");
    setIsItemModalOpen(true);
  };

  const handleSaveItemModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    let updatedList: ProjectAdditional[] = [];
    if (editingItem) {
      updatedList = additionals.map((item) =>
        item.id === editingItem.id
          ? {
              ...item,
              name: itemName.trim(),
              category: itemCategory,
              price: itemPrice,
              areaM2: itemArea,
              status: itemStatus,
              notes: itemNotes.trim(),
            }
          : item
      );
    } else {
      const newItem: ProjectAdditional = {
        id: `add-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: itemName.trim(),
        category: itemCategory,
        price: itemPrice,
        areaM2: itemArea,
        status: itemStatus,
        notes: itemNotes.trim(),
      };
      updatedList = [...additionals, newItem];
    }

    setAdditionals(updatedList);
    onSaveAdditionals?.(updatedList);
    setIsItemModalOpen(false);
    setEditingItem(null);
  };

  const handleDeleteItem = (id: string) => {
    const target = additionals.find((i) => i.id === id);
    if (target && target.status !== "DISPONIBLE") {
      alert(
        `No se puede eliminar ${target.name} porque ya está asignado a la unidad ${
          target.assignedToUnit || ""
        } o no está disponible.`
      );
      return;
    }
    const updatedList = additionals.filter((i) => i.id !== id);
    setAdditionals(updatedList);
    onSaveAdditionals?.(updatedList);
  };

  const handleBulkUploadAdditionals = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let rawRows: any[][] = [];
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
        const sheetName =
          workbook.SheetNames.find((s) => s.toLowerCase().includes("adicional")) ||
          workbook.SheetNames[0];
        if (sheetName) {
          const worksheet = workbook.Sheets[sheetName];
          if (worksheet) {
            const rawJson = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
            rawRows = rawJson.filter(
              (r) => Array.isArray(r) && r.some((c) => c !== undefined && c !== null && String(c).trim() !== "")
            );
          }
        }
      }

      if (rawRows.length === 0) {
        alert("El archivo está vacío o no contiene filas válidas.");
        return;
      }

      // Check header
      const firstRow = rawRows[0] || [];
      const isHeader = firstRow.some((h) =>
        /nombre|identificador|tipo|categoria|precio|estado|status|notas/i.test(String(h))
      );
      const dataRows = isHeader ? rawRows.slice(1) : rawRows;

      const newAdditions: ProjectAdditional[] = [];
      const existingNamesMap = new Map<string, number>();
      additionals.forEach((a, idx) => existingNamesMap.set(a.name.toLowerCase().trim(), idx));

      const updatedList = [...additionals];

      dataRows.forEach((row, rIdx) => {
        const rawName = String(row[0] || `Adicional ${additionals.length + rIdx + 1}`).trim();
        const rawCat = String(row[1] || "").toLowerCase().trim();
        let cat: ProjectAdditional["category"] = "otro";
        if (
          rawCat.includes("estacionamiento") ||
          rawCat.includes("cajon") ||
          rawCat.includes("cajón") ||
          rawCat.includes("auto") ||
          rawCat.includes("parking")
        ) {
          cat = "estacionamiento";
        } else if (rawCat.includes("bodega") || rawCat.includes("storage")) {
          cat = "bodega";
        } else if (rawCat.includes("acabado") || rawCat.includes("paquete")) {
          cat = "acabados";
        } else if (rawCat.includes("terraza") || rawCat.includes("balcon") || rawCat.includes("balcón") || rawCat.includes("roof")) {
          cat = "terraza";
        }

        const price = parseFloat(String(row[2] || "").replace(/[^0-9.-]+/g, "")) || 150000;
        const rawStatus = String(row[3] || "").toLowerCase().trim();
        let status: ProjectAdditional["status"] = "DISPONIBLE";
        if (rawStatus.includes("vend") || rawStatus.includes("sold")) status = "VENDIDO";
        else if (rawStatus.includes("asig") || rawStatus.includes("apart") || rawStatus.includes("reserv")) status = "ASIGNADO";

        const notes = String(row[4] || "").trim();
        const area = parseFloat(String(row[5] || "").replace(/[^0-9.-]+/g, "")) || 0;

        const itemObj: ProjectAdditional = {
          id: `add-imp-${Date.now()}-${rIdx}`,
          name: rawName,
          category: cat,
          price,
          areaM2: area > 0 ? area : undefined,
          status,
          notes,
        };

        const key = rawName.toLowerCase();
        if (existingNamesMap.has(key)) {
          const idx = existingNamesMap.get(key)!;
          const target = updatedList[idx];
          if (target && target.status === "DISPONIBLE") {
            updatedList[idx] = { ...target, ...itemObj, id: target.id };
          }
        } else {
          updatedList.push(itemObj);
          existingNamesMap.set(key, updatedList.length - 1);
        }
      });

      setAdditionals(updatedList);
      onSaveAdditionals?.(updatedList);
      alert(`Se procesaron ${dataRows.length} adicionales exitosamente.`);
    } catch (err) {
      console.error("Error al procesar archivo de adicionales:", err);
      alert("Hubo un error al procesar el archivo. Por favor verifica que el formato sea válido.");
    } finally {
      if (e.target) e.target.value = "";
    }
  };

  const filteredItems = additionals.filter((item) => {
    const matchesCat = activeCategory === "ALL" || item.category === activeCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.assignedToUnit && item.assignedToUnit.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const totalValue = additionals.reduce((sum, item) => sum + item.price, 0);
  const availableCount = additionals.filter((i) => i.status === "DISPONIBLE").length;
  const assignedCount = additionals.filter((i) => i.status !== "DISPONIBLE").length;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(10, 25, 47, 0.72)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        accept=".xlsx,.xls,.csv"
        style={{ display: "none" }}
        onChange={handleBulkUploadAdditionals}
      />

      <div
        style={{
          backgroundColor: "var(--devio-white)",
          borderRadius: "1.25rem",
          width: "100%",
          maxWidth: "960px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 70px rgba(0, 0, 0, 0.28)",
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
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                backgroundColor: "rgba(31, 54, 82, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--devio-blue)",
              }}
            >
              <Package size={22} />
            </div>
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
                Catálogo de Adicionales (Add-ons)
              </h3>
              <span style={{ fontSize: "0.78rem", color: "var(--devio-neutral-3)" }}>
                Administra bodegas, cajones de estacionamiento, terrazas y paquetes de acabados
              </span>
            </div>
          </div>

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

        {/* 3 Metric Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1rem",
            padding: "1rem 1.75rem",
            backgroundColor: "#F8FAFC",
            borderBottom: "1px solid var(--devio-neutral-1)",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--devio-white)",
              padding: "0.75rem 1rem",
              borderRadius: "0.6rem",
              border: "1px solid var(--devio-neutral-1)",
            }}
          >
            <span style={{ fontSize: "0.75rem", color: "var(--devio-neutral-3)", display: "block" }}>
              Total de Adicionales
            </span>
            <strong style={{ fontSize: "1.25rem", color: "var(--devio-blue-dark)" }}>
              {additionals.length} ítems
            </strong>
          </div>

          <div
            style={{
              backgroundColor: "var(--devio-white)",
              padding: "0.75rem 1rem",
              borderRadius: "0.6rem",
              border: "1px solid var(--devio-neutral-1)",
            }}
          >
            <span style={{ fontSize: "0.75rem", color: "var(--devio-neutral-3)", display: "block" }}>
              Disponibles para Venta
            </span>
            <strong style={{ fontSize: "1.25rem", color: "var(--devio-green)" }}>
              {availableCount} disponibles
            </strong>
          </div>

          <div
            style={{
              backgroundColor: "var(--devio-white)",
              padding: "0.75rem 1rem",
              borderRadius: "0.6rem",
              border: "1px solid var(--devio-neutral-1)",
            }}
          >
            <span style={{ fontSize: "0.75rem", color: "var(--devio-neutral-3)", display: "block" }}>
              Valor Total del Inventario
            </span>
            <strong style={{ fontSize: "1.25rem", color: "var(--devio-blue)" }}>
              {formatMoney(totalValue)}
            </strong>
          </div>
        </div>

        {/* Search, Filter & Action Buttons Toolbar */}
        <div
          style={{
            padding: "0.75rem 1.75rem",
            borderBottom: "1px solid var(--devio-neutral-1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "0.75rem",
            flexWrap: "wrap",
            backgroundColor: "#FAFBFD",
          }}
        >
          {/* Category Filter Pills */}
          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
            {[
              { id: "ALL", label: "Todos", icon: Package },
              { id: "estacionamiento", label: "Estacionamiento", icon: Car },
              { id: "bodega", label: "Bodegas", icon: Archive },
              { id: "acabados", label: "Acabados", icon: Sparkles },
              { id: "terraza", label: "Terrazas", icon: Layers },
              { id: "otro", label: "Otros", icon: Package },
            ].map((cat) => {
              const Icon = cat.icon;
              const isSelected = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.35rem 0.75rem",
                    borderRadius: "9999px",
                    border: isSelected ? "1px solid var(--devio-blue)" : "1px solid var(--devio-neutral-2)",
                    backgroundColor: isSelected ? "var(--devio-blue)" : "var(--devio-white)",
                    color: isSelected ? "var(--devio-white)" : "var(--devio-neutral-4)",
                    fontSize: "0.78rem",
                    fontWeight: isSelected ? 700 : 500,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Icon size={13} />
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <div style={{ position: "relative" }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--devio-neutral-3)",
                }}
              />
              <input
                type="text"
                placeholder="Buscar adicional..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: "0.4rem 0.75rem 0.4rem 2rem",
                  borderRadius: "9999px",
                  border: "1px solid var(--devio-neutral-2)",
                  fontSize: "0.78rem",
                  outline: "none",
                  width: "160px",
                }}
              />
            </div>

            <button
              type="button"
              onClick={generateAdditionalsExcelTemplate}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.45rem 0.85rem",
                borderRadius: "9999px",
                backgroundColor: "var(--devio-white)",
                color: "var(--devio-blue-dark)",
                border: "1px solid var(--devio-neutral-2)",
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
              title="Descargar plantilla de Excel (.xlsx)"
            >
              <Download size={13} /> Plantilla Excel
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.45rem 0.85rem",
                borderRadius: "9999px",
                backgroundColor: "var(--devio-blue)",
                color: "var(--devio-white)",
                border: "none",
                fontSize: "0.78rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <FileSpreadsheet size={13} /> Subir Excel / CSV
            </button>

            <button
              type="button"
              onClick={handleOpenAddModal}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.45rem 0.95rem",
                borderRadius: "9999px",
                backgroundColor: "var(--devio-blue-dark)",
                color: "var(--devio-white)",
                fontSize: "0.78rem",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
              }}
            >
              <Plus size={14} /> Agregar Adicional
            </button>
          </div>
        </div>

        {/* Additionals Table List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.75rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem", textAlign: "left" }}>
            <thead>
              <tr style={{ color: "var(--devio-neutral-3)", borderBottom: "1.5px solid var(--devio-neutral-1)" }}>
                <th style={{ padding: "0.6rem 0.75rem" }}>Nombre / Identificador</th>
                <th style={{ padding: "0.6rem 0.75rem" }}>Tipo</th>
                <th style={{ padding: "0.6rem 0.75rem" }}>Área</th>
                <th style={{ padding: "0.6rem 0.75rem" }}>Precio</th>
                <th style={{ padding: "0.6rem 0.75rem" }}>Estatus</th>
                <th style={{ padding: "0.6rem 0.75rem" }}>Asignación</th>
                <th style={{ padding: "0.6rem 0.75rem", textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                      <Archive size={40} style={{ color: "var(--devio-neutral-2)", opacity: 0.6 }} />
                      <p style={{ margin: 0, fontWeight: 700, color: "var(--devio-blue-dark)", fontSize: "1rem" }}>
                        Sin adicionales registrados
                      </p>
                      <p
                        style={{
                          margin: 0,
                          color: "var(--devio-neutral-3)",
                          fontSize: "0.8125rem",
                          maxWidth: "420px",
                        }}
                      >
                        {searchQuery || activeCategory !== "ALL"
                          ? "No se encontraron adicionales con los filtros aplicados."
                          : "Los adicionales son opcionales. Puedes agregar cajones de estacionamiento o bodegas ahora o gestionarlos más adelante."}
                      </p>
                      <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.5rem" }}>
                        <button
                          type="button"
                          onClick={handleOpenAddModal}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            padding: "0.5rem 1rem",
                            borderRadius: "8px",
                            backgroundColor: "var(--devio-blue-dark)",
                            color: "#FFF",
                            fontSize: "0.8125rem",
                            fontWeight: 700,
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          <Plus size={14} /> Agregar Adicional
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            padding: "0.5rem 1rem",
                            borderRadius: "8px",
                            backgroundColor: "var(--devio-white)",
                            color: "var(--devio-blue-dark)",
                            border: "1px solid var(--devio-neutral-2)",
                            fontSize: "0.8125rem",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          <FileSpreadsheet size={14} /> Importar Excel Adicionales
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const isAvailable = item.status === "DISPONIBLE";

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: "1px solid var(--devio-neutral-1)",
                        backgroundColor: idx % 2 === 0 ? "#FFF" : "#FAFBFD",
                      }}
                    >
                      <td style={{ padding: "0.65rem 0.75rem", fontWeight: 700, color: "var(--devio-blue-dark)" }}>
                        {item.name}
                        {item.notes && (
                          <span
                            style={{
                              fontSize: "0.72rem",
                              color: "var(--devio-neutral-3)",
                              display: "block",
                              fontWeight: 400,
                            }}
                          >
                            {item.notes}
                          </span>
                        )}
                      </td>

                      <td style={{ padding: "0.65rem 0.75rem" }}>
                        <span
                          style={{
                            textTransform: "capitalize",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "var(--devio-neutral-4)",
                            backgroundColor: "#F1F5F9",
                            padding: "0.2rem 0.5rem",
                            borderRadius: "4px",
                          }}
                        >
                          {item.category}
                        </span>
                      </td>

                      <td style={{ padding: "0.65rem 0.75rem", color: "var(--devio-neutral-4)" }}>
                        {item.areaM2 ? `${item.areaM2} m²` : "-"}
                      </td>

                      <td style={{ padding: "0.65rem 0.75rem", fontWeight: 800, color: "var(--devio-green)" }}>
                        {formatMoney(item.price)}
                      </td>

                      <td style={{ padding: "0.65rem 0.75rem" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.2rem 0.6rem",
                            borderRadius: "9999px",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            backgroundColor: isAvailable
                              ? "rgba(111, 172, 156, 0.15)"
                              : "rgba(31, 54, 82, 0.12)",
                            color: isAvailable ? "var(--devio-green)" : "var(--devio-blue-dark)",
                          }}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td style={{ padding: "0.65rem 0.75rem", color: "var(--devio-blue-dark)", fontWeight: 600 }}>
                        {item.assignedToUnit ? `Unidad ${item.assignedToUnit}` : "Libre"}
                      </td>

                      <td style={{ padding: "0.65rem 0.75rem", textAlign: "right" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            alignItems: "center",
                            gap: "0.4rem",
                          }}
                        >
                          {isAvailable ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(item)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "var(--devio-blue)",
                                  cursor: "pointer",
                                  padding: "0.25rem",
                                }}
                                title="Editar adicional"
                              >
                                <Edit2 size={14} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "var(--devio-red)",
                                  cursor: "pointer",
                                  padding: "0.25rem",
                                }}
                                title="Eliminar adicional disponible"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          ) : (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.25rem",
                                fontSize: "0.72rem",
                                color: "var(--devio-neutral-3)",
                                padding: "0.2rem 0.45rem",
                                backgroundColor: "#F1F5F9",
                                borderRadius: "4px",
                                fontWeight: 600,
                              }}
                              title="No se puede modificar ni eliminar porque no está disponible"
                            >
                              <Lock size={11} /> Bloqueado
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
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
            Total registrados: <strong>{additionals.length} adicionales</strong> ({availableCount} disponibles)
          </span>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "0.6rem 1.5rem",
              borderRadius: "9999px",
              backgroundColor: "var(--devio-blue-dark)",
              color: "var(--devio-white)",
              fontSize: "0.85rem",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
            }}
          >
            Listo y Cerrar
          </button>
        </div>
      </div>

      {/* SUBMODAL: AGREGAR / EDITAR ADICIONAL INDIVIDUAL */}
      {isItemModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(10, 25, 47, 0.78)",
            backdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "1rem",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--devio-white)",
              borderRadius: "1rem",
              width: "100%",
              maxWidth: "520px",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.35)",
              border: "1px solid var(--devio-neutral-1)",
              overflow: "hidden",
              animation: "fadeIn 0.2s ease-out",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid var(--devio-neutral-1)",
                backgroundColor: "#FAFBFD",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h4 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--devio-blue-dark)", margin: 0 }}>
                  {editingItem ? "Editar Adicional" : "Agregar Adicional Individual"}
                </h4>
                <p style={{ fontSize: "0.78rem", color: "var(--devio-neutral-3)", margin: "2px 0 0 0" }}>
                  Define los detalles y precio del elemento adicional para el proyecto.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsItemModalOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--devio-neutral-3)",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveItemModal} style={{ padding: "1.25rem 1.5rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      color: "var(--devio-blue-dark)",
                      display: "block",
                      marginBottom: "0.35rem",
                    }}
                  >
                    Nombre / Identificador *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Cajón E-101 (Sótano 1) / Bodega B-04"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "0.5rem",
                      border: "1px solid var(--devio-neutral-2)",
                      fontSize: "0.85rem",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        color: "var(--devio-blue-dark)",
                        display: "block",
                        marginBottom: "0.35rem",
                      }}
                    >
                      Tipo / Categoría *
                    </label>
                    <select
                      value={itemCategory}
                      onChange={(e) => setItemCategory(e.target.value as any)}
                      style={{
                        width: "100%",
                        padding: "0.55rem 0.75rem",
                        borderRadius: "0.5rem",
                        border: "1px solid var(--devio-neutral-2)",
                        fontSize: "0.85rem",
                        backgroundColor: "#FFF",
                      }}
                    >
                      <option value="estacionamiento">Estacionamiento</option>
                      <option value="bodega">Bodega</option>
                      <option value="acabados">Acabados</option>
                      <option value="terraza">Terraza</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        color: "var(--devio-blue-dark)",
                        display: "block",
                        marginBottom: "0.35rem",
                      }}
                    >
                      Precio ({currency}) *
                    </label>
                    <input
                      type="number"
                      value={itemPrice}
                      onChange={(e) => setItemPrice(parseFloat(e.target.value) || 0)}
                      required
                      style={{
                        width: "100%",
                        padding: "0.55rem 0.75rem",
                        borderRadius: "0.5rem",
                        border: "1px solid var(--devio-neutral-2)",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        color: "var(--devio-blue-dark)",
                        display: "block",
                        marginBottom: "0.35rem",
                      }}
                    >
                      Estado
                    </label>
                    <select
                      value={itemStatus}
                      onChange={(e) => setItemStatus(e.target.value as any)}
                      style={{
                        width: "100%",
                        padding: "0.55rem 0.75rem",
                        borderRadius: "0.5rem",
                        border: "1px solid var(--devio-neutral-2)",
                        fontSize: "0.85rem",
                        backgroundColor: "#FFF",
                      }}
                    >
                      <option value="DISPONIBLE">Disponible</option>
                      <option value="ASIGNADO">Asignado</option>
                      <option value="VENDIDO">Vendido</option>
                    </select>
                  </div>

                  <div>
                    <label
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        color: "var(--devio-blue-dark)",
                        display: "block",
                        marginBottom: "0.35rem",
                      }}
                    >
                      Superficie (m² opcional)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={itemArea || ""}
                      placeholder="Ej. 12.5"
                      onChange={(e) => setItemArea(parseFloat(e.target.value) || 0)}
                      style={{
                        width: "100%",
                        padding: "0.55rem 0.75rem",
                        borderRadius: "0.5rem",
                        border: "1px solid var(--devio-neutral-2)",
                        fontSize: "0.85rem",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      color: "var(--devio-blue-dark)",
                      display: "block",
                      marginBottom: "0.35rem",
                    }}
                  >
                    Notas / Ubicación (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Sótano 2, frente a elevador principal"
                    value={itemNotes}
                    onChange={(e) => setItemNotes(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "0.5rem",
                      border: "1px solid var(--devio-neutral-2)",
                      fontSize: "0.85rem",
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.75rem",
                  marginTop: "1.5rem",
                  paddingTop: "1rem",
                  borderTop: "1px solid var(--devio-neutral-1)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  style={{
                    padding: "0.55rem 1.25rem",
                    borderRadius: "9999px",
                    border: "1px solid var(--devio-neutral-2)",
                    backgroundColor: "transparent",
                    color: "var(--devio-neutral-4)",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "0.55rem 1.4rem",
                    borderRadius: "9999px",
                    backgroundColor: "var(--devio-blue-dark)",
                    color: "var(--devio-white)",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {editingItem ? "Guardar Cambios" : "Agregar Adicional"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
