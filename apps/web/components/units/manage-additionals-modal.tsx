"use client";

import React, { useState, useEffect } from "react";
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
  CheckCircle2,
  Tag,
  DollarSign,
  Search,
  SlidersHorizontal,
  Home,
  Save
} from "lucide-react";

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
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ProjectAdditional | null>(null);

  // New item form
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<ProjectAdditional["category"]>("bodega");
  const [newItemPrice, setNewItemPrice] = useState<number>(0);
  const [newItemArea, setNewItemArea] = useState<number>(0);
  const [newItemNotes, setNewItemNotes] = useState("");

  if (!isOpen) return null;

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const filteredItems = additionals.filter((item) => {
    const matchesCat = activeCategory === "ALL" || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || (item.assignedToUnit && item.assignedToUnit.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const totalValue = additionals.reduce((sum, item) => sum + item.price, 0);
  const availableCount = additionals.filter((i) => i.status === "DISPONIBLE").length;
  const assignedCount = additionals.filter((i) => i.status !== "DISPONIBLE").length;

  useEffect(() => {
    if (initialAdditionals) {
      setAdditionals(initialAdditionals);
    }
  }, [initialAdditionals]);

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    let updatedList: ProjectAdditional[] = [];
    if (editingItem) {
      updatedList = additionals.map((item) =>
        item.id === editingItem.id
          ? {
              ...item,
              name: newItemName.trim(),
              category: newItemCategory,
              price: newItemPrice,
              areaM2: newItemArea,
              notes: newItemNotes.trim(),
            }
          : item
      );
      setEditingItem(null);
    } else {
      const newItem: ProjectAdditional = {
        id: `add-${Date.now()}`,
        name: newItemName.trim(),
        category: newItemCategory,
        price: newItemPrice,
        areaM2: newItemArea,
        status: "DISPONIBLE",
        notes: newItemNotes.trim(),
      };
      updatedList = [...additionals, newItem];
    }

    setAdditionals(updatedList);
    onSaveAdditionals?.(updatedList);
    setNewItemName("");
    setNewItemNotes("");
    setShowAddForm(false);
  };

  const handleDeleteItem = (id: string) => {
    const target = additionals.find((i) => i.id === id);
    if (target && target.status !== "DISPONIBLE") {
      alert(`No se puede eliminar ${target.name} porque ya está asignado a la unidad ${target.assignedToUnit}.`);
      return;
    }
    const updatedList = additionals.filter((i) => i.id !== id);
    setAdditionals(updatedList);
    onSaveAdditionals?.(updatedList);
  };

  const handleEditClick = (item: ProjectAdditional) => {
    setEditingItem(item);
    setNewItemName(item.name);
    setNewItemCategory(item.category);
    setNewItemPrice(item.price);
    setNewItemArea(item.areaM2 || 0);
    setNewItemNotes(item.notes || "");
    setShowAddForm(true);
  };

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
      <div
        style={{
          backgroundColor: "var(--devio-white)",
          borderRadius: "1.25rem",
          width: "100%",
          maxWidth: "880px",
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
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "rgba(31, 54, 82, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--devio-blue)",
              }}
            >
              <Package size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--devio-blue-dark)", margin: 0, letterSpacing: "-0.02em" }}>
                Catálogo de Adicionales
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", padding: "1rem 1.75rem", backgroundColor: "#F8FAFC", borderBottom: "1px solid var(--devio-neutral-1)" }}>
          <div style={{ backgroundColor: "var(--devio-white)", padding: "0.75rem 1rem", borderRadius: "0.6rem", border: "1px solid var(--devio-neutral-1)" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--devio-neutral-3)", display: "block" }}>Total de Adicionales</span>
            <strong style={{ fontSize: "1.25rem", color: "var(--devio-blue-dark)" }}>{additionals.length} ítems</strong>
          </div>

          <div style={{ backgroundColor: "var(--devio-white)", padding: "0.75rem 1rem", borderRadius: "0.6rem", border: "1px solid var(--devio-neutral-1)" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--devio-neutral-3)", display: "block" }}>Disponibles para Venta</span>
            <strong style={{ fontSize: "1.25rem", color: "var(--devio-green)" }}>{availableCount} disponibles</strong>
          </div>

          <div style={{ backgroundColor: "var(--devio-white)", padding: "0.75rem 1rem", borderRadius: "0.6rem", border: "1px solid var(--devio-neutral-1)" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--devio-neutral-3)", display: "block" }}>Valor Total del Inventario</span>
            <strong style={{ fontSize: "1.25rem", color: "var(--devio-blue)" }}>{formatMoney(totalValue)}</strong>
          </div>
        </div>

        {/* Search, Filter & Add Toolbar */}
        <div
          style={{
            padding: "0.75rem 1.75rem",
            borderBottom: "1px solid var(--devio-neutral-1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          {/* Category Filter Pills */}
          <div style={{ display: "flex", gap: "0.4rem" }}>
            {[
              { id: "ALL", label: "Todos", icon: Package },
              { id: "bodega", label: "Bodegas", icon: Archive },
              { id: "estacionamiento", label: "Estacionamiento", icon: Car },
              { id: "acabados", label: "Acabados", icon: Sparkles },
              { id: "terraza", label: "Terrazas", icon: Layers },
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
                    padding: "0.4rem 0.75rem",
                    borderRadius: "9999px",
                    border: isSelected ? "1px solid var(--devio-blue)" : "1px solid var(--devio-neutral-1)",
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

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--devio-neutral-3)" }} />
              <input
                type="text"
                placeholder="Buscar adicional..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: "0.45rem 0.75rem 0.45rem 2rem",
                  borderRadius: "9999px",
                  border: "1px solid var(--devio-neutral-2)",
                  fontSize: "0.8rem",
                  outline: "none",
                  width: "180px",
                }}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingItem(null);
                setNewItemName("");
                setNewItemNotes("");
                setShowAddForm(!showAddForm);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.45rem 1rem",
                borderRadius: "9999px",
                backgroundColor: "var(--devio-blue-dark)",
                color: "var(--devio-white)",
                fontSize: "0.82rem",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
              }}
            >
              <Plus size={14} /> {showAddForm ? "Cerrar" : "Nuevo Adicional"}
            </button>
          </div>
        </div>

        {/* Add / Edit Form Drawer */}
        {showAddForm && (
          <form
            onSubmit={handleAddNewItem}
            style={{
              padding: "1rem 1.75rem",
              backgroundColor: "rgba(31, 54, 82, 0.04)",
              borderBottom: "1px solid var(--devio-neutral-1)",
              display: "grid",
              gridTemplateColumns: "1.4fr 1fr 1fr 0.8fr 1.5fr auto",
              gap: "0.75rem",
              alignItems: "flex-end",
              animation: "fadeIn 0.2s ease",
            }}
          >
            <div>
              <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.2rem" }}>
                Nombre del Adicional *
              </label>
              <input
                type="text"
                placeholder="Ej. Bodega 09 (Sótano 1)"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                style={{ width: "100%", padding: "0.45rem 0.65rem", borderRadius: "0.4rem", border: "1px solid var(--devio-neutral-2)", fontSize: "0.82rem" }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.2rem" }}>
                Categoría
              </label>
              <select
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value as any)}
                style={{ width: "100%", padding: "0.45rem 0.65rem", borderRadius: "0.4rem", border: "1px solid var(--devio-neutral-2)", fontSize: "0.82rem", backgroundColor: "#FFF" }}
              >
                <option value="bodega">Bodega</option>
                <option value="estacionamiento">Estacionamiento</option>
                <option value="acabados">Acabados</option>
                <option value="terraza">Terraza</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.2rem" }}>
                Precio ($) *
              </label>
              <input
                type="number"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(parseFloat(e.target.value) || 0)}
                style={{ width: "100%", padding: "0.45rem 0.65rem", borderRadius: "0.4rem", border: "1px solid var(--devio-neutral-2)", fontSize: "0.82rem", fontWeight: 700 }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.2rem" }}>
                Área (m²)
              </label>
              <input
                type="number"
                step="0.1"
                value={newItemArea}
                onChange={(e) => setNewItemArea(parseFloat(e.target.value) || 0)}
                style={{ width: "100%", padding: "0.45rem 0.65rem", borderRadius: "0.4rem", border: "1px solid var(--devio-neutral-2)", fontSize: "0.82rem" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.2rem" }}>
                Notas / Ubicación
              </label>
              <input
                type="text"
                placeholder="Frente a elevador..."
                value={newItemNotes}
                onChange={(e) => setNewItemNotes(e.target.value)}
                style={{ width: "100%", padding: "0.45rem 0.65rem", borderRadius: "0.4rem", border: "1px solid var(--devio-neutral-2)", fontSize: "0.82rem" }}
              />
            </div>

            <button
              type="submit"
              style={{
                padding: "0.45rem 1rem",
                borderRadius: "0.4rem",
                backgroundColor: "var(--devio-green)",
                color: "#FFF",
                border: "none",
                fontSize: "0.82rem",
                fontWeight: 700,
                cursor: "pointer",
                height: "32px",
              }}
            >
              {editingItem ? "Actualizar" : "Guardar"}
            </button>
          </form>
        )}

        {/* Additionals Table List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.75rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem", textAlign: "left" }}>
            <thead>
              <tr style={{ color: "var(--devio-neutral-3)", borderBottom: "1px solid var(--devio-neutral-1)" }}>
                <th style={{ padding: "0.6rem 0.75rem" }}>Adicional</th>
                <th style={{ padding: "0.6rem 0.75rem" }}>Categoría</th>
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
                      <Archive size={36} style={{ color: "var(--devio-neutral-2)", opacity: 0.6 }} />
                      <p style={{ margin: 0, fontWeight: 700, color: "var(--devio-blue-dark)", fontSize: "0.95rem" }}>
                        No hay adicionales registrados
                      </p>
                      <p style={{ margin: 0, color: "var(--devio-neutral-3)", fontSize: "0.8rem", maxWidth: "340px" }}>
                        {searchQuery || activeCategory !== "ALL"
                          ? "No se encontraron adicionales con los filtros aplicados."
                          : "Agrega cajones, bodegas, acabados o paquetes usando el botón '+ Nuevo Adicional'."}
                      </p>
                      {!showAddForm && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItem(null);
                            setNewItemName("");
                            setNewItemNotes("");
                            setShowAddForm(true);
                          }}
                          style={{
                            marginTop: "0.5rem",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            padding: "0.45rem 0.9rem",
                            borderRadius: "8px",
                            backgroundColor: "var(--devio-blue)",
                            color: "#FFF",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          <Plus size={14} /> + Nuevo Adicional
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const isAvailable = item.status === "DISPONIBLE";

                  return (
                    <tr key={item.id} style={{ borderBottom: "1px solid var(--devio-neutral-1)", backgroundColor: idx % 2 === 0 ? "#FFF" : "#FAFBFD" }}>
                      <td style={{ padding: "0.65rem 0.75rem", fontWeight: 700, color: "var(--devio-blue-dark)" }}>
                        {item.name}
                        {item.notes && (
                          <span style={{ fontSize: "0.72rem", color: "var(--devio-neutral-3)", display: "block", fontWeight: 400 }}>
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
                            backgroundColor: isAvailable ? "rgba(111, 172, 156, 0.15)" : "rgba(31, 54, 82, 0.12)",
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
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.4rem" }}>
                          <button
                            type="button"
                            onClick={() => handleEditClick(item)}
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

                          {isAvailable && (
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
        <div style={{ padding: "1rem 1.75rem", borderTop: "1px solid var(--devio-neutral-1)", backgroundColor: "#FAFBFD", display: "flex", justifyContent: "flex-end" }}>
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
    </div>
  );
}
