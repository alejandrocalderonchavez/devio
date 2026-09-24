"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  X,
  Layers,
  Building2,
  Plus,
  Trash2,
  Edit2,
  Upload,
  Eye,
  CheckCircle2,
  Maximize2,
  Image as ImageIcon,
  Check,
} from "lucide-react";
import { ProjectItem, UnitItem, ProjectFloorPlan } from "@/data/projects-data";
import { useProject } from "@/context/project-context";

interface FloorPlansViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectItem;
  onOpenUnitDetail?: (unit: UnitItem) => void;
  onOpenQuoteWizard?: (unit: UnitItem) => void;
  onOpenNewSale?: (unit: UnitItem) => void;
}

const DEFAULT_BLUEPRINTS = [
  {
    name: "Planta Tipo A (2 Recámaras)",
    url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1400&q=80",
  },
  {
    name: "Planta Tipo B (3 Recámaras)",
    url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=80",
  },
  {
    name: "Planta Tipo C (1 Recámara)",
    url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80",
  },
  {
    name: "Planta Penthouse",
    url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80",
  },
];

export default function FloorPlansViewerModal({
  isOpen,
  onClose,
  project,
  onOpenUnitDetail,
  onOpenQuoteWizard,
  onOpenNewSale,
}: FloorPlansViewerModalProps) {
  const { addFloorPlan, updateFloorPlan, deleteFloorPlan, updateUnit, showToast } = useProject();

  const floorPlansList: ProjectFloorPlan[] = useMemo(() => {
    if (project.floorPlans && project.floorPlans.length > 0) {
      return project.floorPlans;
    }
    return [
      {
        id: "fp-default-1",
        name: "Planta Tipo A",
        imageUrl: DEFAULT_BLUEPRINTS[0]?.url,
      },
      {
        id: "fp-default-2",
        name: "Planta Tipo B",
        imageUrl: DEFAULT_BLUEPRINTS[1]?.url,
      },
    ];
  }, [project.floorPlans]);

  // Modal para crear / editar planta
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<{
    id?: string;
    name: string;
    imageUrl: string;
    selectedUnitNumbers: string[];
  }>({
    name: "",
    imageUrl: "",
    selectedUnitNumbers: [],
  });

  // Modal para ver imagen en grande
  const [previewImageUrl, setPreviewImageUrl] = useState<{ url: string; title: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Unidades del proyecto
  const allUnits = project.unitsInventory || [];

  const handleOpenCreate = () => {
    setEditingForm({
      name: `Planta Tipo ${String.fromCharCode(65 + floorPlansList.length)}`,
      imageUrl: "",
      selectedUnitNumbers: [],
    });
    setIsEditingModalOpen(true);
  };

  const handleOpenEdit = (plan: ProjectFloorPlan) => {
    // Unidades que actualmente tienen esta planta asignada
    const assigned = allUnits.filter((u) => u.floorPlan === plan.name).map((u) => u.unit);
    setEditingForm({
      id: plan.id,
      name: plan.name,
      imageUrl: plan.imageUrl || "",
      selectedUnitNumbers: assigned,
    });
    setIsEditingModalOpen(true);
  };

  const handleSave = () => {
    if (!editingForm.name.trim()) {
      showToast("Nombre requerido", "Ingresa un nombre para la planta.", "warning");
      return;
    }

    if (editingForm.id) {
      // Actualizar planta existente
      const oldPlan = floorPlansList.find((p) => p.id === editingForm.id);
      updateFloorPlan(project.id, editingForm.id, {
        name: editingForm.name,
        imageUrl: editingForm.imageUrl,
      });

      // Actualizar unidades asignadas
      allUnits.forEach((u) => {
        const shouldBeAssigned = editingForm.selectedUnitNumbers.includes(u.unit);
        if (shouldBeAssigned && u.floorPlan !== editingForm.name) {
          updateUnit(project.id, u.unit, { floorPlan: editingForm.name });
        } else if (!shouldBeAssigned && u.floorPlan === oldPlan?.name) {
          updateUnit(project.id, u.unit, { floorPlan: undefined });
        }
      });
    } else {
      // Crear nueva planta
      const newPlan: ProjectFloorPlan = {
        id: `fp-${Date.now()}`,
        name: editingForm.name,
        imageUrl: editingForm.imageUrl,
      };
      addFloorPlan(project.id, newPlan);

      // Asignar a unidades seleccionadas
      editingForm.selectedUnitNumbers.forEach((unitNum) => {
        updateUnit(project.id, unitNum, { floorPlan: newPlan.name });
      });
    }

    setIsEditingModalOpen(false);
  };

  const handleDelete = (plan: ProjectFloorPlan) => {
    if (confirm(`¿Estás seguro de eliminar la planta "${plan.name}"?`)) {
      deleteFloorPlan(project.id, plan.id);
      // Limpiar asignación en unidades
      allUnits.forEach((u) => {
        if (u.floorPlan === plan.name) {
          updateUnit(project.id, u.unit, { floorPlan: undefined });
        }
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setEditingForm((prev) => ({
            ...prev,
            imageUrl: ev.target!.result as string,
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "rgba(10, 25, 41, 0.75)",
        backdropFilter: "blur(5px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "1.25rem",
          width: "100%",
          maxWidth: "1100px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 60px -12px rgba(0, 0, 0, 0.35)",
          overflow: "hidden",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: "1.25rem 1.75rem",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#FFFFFF",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "0.75rem",
                backgroundColor: "rgba(47, 128, 237, 0.12)",
                color: "#2F80ED",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Layers size={22} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                  Plantas de Conjunto & Layouts
                </h2>
                <span
                  style={{
                    backgroundColor: "#EFF6FF",
                    color: "#2F80ED",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    padding: "0.2rem 0.6rem",
                    borderRadius: "9999px",
                  }}
                >
                  {project.name}
                </span>
              </div>
              <p style={{ fontSize: "0.8rem", color: "#64748B", margin: 0, marginTop: "0.15rem" }}>
                Crea tus plantas con nombre y plano, y asígnalas a las unidades del proyecto.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <button
              type="button"
              onClick={handleOpenCreate}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.5rem 1rem",
                borderRadius: "0.6rem",
                backgroundColor: "#1B3047",
                color: "#FFFFFF",
                fontSize: "0.82rem",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
              }}
            >
              <Plus size={15} /> Nueva Planta
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                border: "1px solid #E2E8F0",
                backgroundColor: "#F8FAFC",
                color: "#64748B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* BODY: GRID DE PLANTAS DE CONJUNTO */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", backgroundColor: "#F8FAFC" }}>
          {floorPlansList.length === 0 ? (
            <div
              style={{
                padding: "4rem 2rem",
                textAlign: "center",
                backgroundColor: "#FFFFFF",
                borderRadius: "1rem",
                border: "1.5px dashed #CBD5E1",
              }}
            >
              <Layers size={48} color="#CBD5E1" style={{ margin: "0 auto 1rem auto" }} />
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1F3652", marginBottom: "0.4rem" }}>
                Aún no has creado plantas de conjunto
              </h3>
              <p style={{ fontSize: "0.85rem", color: "#64748B", maxWidth: "420px", margin: "0 auto 1.25rem auto" }}>
                Crea una planta de conjunto con su nombre y plano para asignarla a las unidades de este desarrollo.
              </p>
              <button
                type="button"
                onClick={handleOpenCreate}
                style={{
                  padding: "0.6rem 1.25rem",
                  borderRadius: "0.6rem",
                  backgroundColor: "#2F80ED",
                  color: "#FFFFFF",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <Plus size={16} style={{ display: "inline", marginRight: "0.4rem" }} /> Crear Primera Planta
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "1.25rem",
              }}
            >
              {floorPlansList.map((plan) => {
                const assignedUnits = allUnits.filter((u) => u.floorPlan === plan.name);

                return (
                  <div
                    key={plan.id}
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: "1rem",
                      border: "1px solid #E2E8F0",
                      overflow: "hidden",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    {/* IMAGEN DEL PLANO */}
                    <div
                      style={{
                        height: "170px",
                        backgroundColor: "#0F172A",
                        position: "relative",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: plan.imageUrl ? "pointer" : "default",
                      }}
                      onClick={() => plan.imageUrl && setPreviewImageUrl({ url: plan.imageUrl, title: plan.name })}
                    >
                      {plan.imageUrl ? (
                        <>
                          <img
                            src={plan.imageUrl}
                            alt={plan.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              backgroundColor: "rgba(0,0,0,0.25)",
                              opacity: 0,
                              transition: "opacity 0.2s ease",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#FFFFFF",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
                          >
                            <span style={{ fontSize: "0.8rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.35rem", backgroundColor: "rgba(0,0,0,0.6)", padding: "0.4rem 0.8rem", borderRadius: "9999px" }}>
                              <Maximize2 size={14} /> Ver Plano Completo
                            </span>
                          </div>
                        </>
                      ) : (
                        <div style={{ color: "#64748B", textAlign: "center" }}>
                          <ImageIcon size={32} style={{ margin: "0 auto 0.35rem auto", opacity: 0.5 }} />
                          <span style={{ fontSize: "0.75rem", display: "block" }}>Sin plano asignado</span>
                        </div>
                      )}
                    </div>

                    {/* DETALLE Y UNIDADES ASIGNADAS */}
                    <div style={{ padding: "1.1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.6rem" }}>
                        <div>
                          <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                            {plan.name}
                          </h3>
                          <span style={{ fontSize: "0.76rem", color: "#64748B", fontWeight: 600 }}>
                            {assignedUnits.length} {assignedUnits.length === 1 ? "unidad asignada" : "unidades asignadas"}
                          </span>
                        </div>

                        <div style={{ display: "flex", gap: "0.3rem" }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(plan)}
                            style={{
                              padding: "0.35rem 0.6rem",
                              borderRadius: "0.4rem",
                              backgroundColor: "#F1F5F9",
                              color: "#1F3652",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              border: "none",
                              cursor: "pointer",
                            }}
                            title="Editar / Asignar Unidades"
                          >
                            <Edit2 size={13} style={{ display: "inline", marginRight: "0.2rem" }} /> Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(plan)}
                            style={{
                              padding: "0.35rem 0.5rem",
                              borderRadius: "0.4rem",
                              backgroundColor: "#FEE2E2",
                              color: "#EF4444",
                              fontSize: "0.72rem",
                              border: "none",
                              cursor: "pointer",
                            }}
                            title="Eliminar Planta"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* LISTA DE CHIPS DE UNIDADES */}
                      <div>
                        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", display: "block", marginBottom: "0.35rem" }}>
                          Unidades vinculadas:
                        </span>
                        {assignedUnits.length === 0 ? (
                          <span style={{ fontSize: "0.75rem", color: "#94A3B8", fontStyle: "italic" }}>
                            Ninguna unidad tiene asignada esta planta.
                          </span>
                        ) : (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", maxHeight: "80px", overflowY: "auto" }}>
                            {assignedUnits.map((u) => {
                              const isSold = u.status === "VENDIDA";
                              const isReserved = u.status === "APARTADA";
                              const isAvailable = u.status === "DISPONIBLE";

                              const bg = isAvailable ? "#ECFDF5" : isSold ? "#FEE2E2" : isReserved ? "#FEF3C7" : "#F1F5F9";
                              const col = isAvailable ? "#065F46" : isSold ? "#991B1B" : isReserved ? "#92400E" : "#475569";

                              return (
                                <span
                                  key={u.unit}
                                  onClick={() => onOpenUnitDetail && onOpenUnitDetail(u)}
                                  style={{
                                    fontSize: "0.72rem",
                                    fontWeight: 700,
                                    padding: "0.15rem 0.5rem",
                                    borderRadius: "0.35rem",
                                    backgroundColor: bg,
                                    color: col,
                                    cursor: "pointer",
                                    border: `1px solid ${bg}`,
                                  }}
                                  title={`Unidad ${u.unit} (${u.status}) - Clic para ver detalle`}
                                >
                                  {u.unit}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MODAL CREAR / EDITAR PLANTA */}
        {isEditingModalOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 10000,
              backgroundColor: "rgba(10, 25, 41, 0.8)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem",
            }}
          >
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "1.15rem",
                width: "100%",
                maxWidth: "540px",
                maxHeight: "90vh",
                overflowY: "auto",
                padding: "1.75rem",
                boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                  {editingForm.id ? "Editar Planta de Conjunto" : "Nueva Planta de Conjunto"}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditingModalOpen(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B" }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* NOMBRE DE LA PLANTA */}
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.3rem" }}>
                    Nombre de la Planta *
                  </label>
                  <input
                    type="text"
                    value={editingForm.name}
                    onChange={(e) => setEditingForm({ ...editingForm, name: e.target.value })}
                    placeholder="Ej. Planta Tipo A, Planta 2 Recámaras, Penthouse..."
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.85rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #CBD5E1",
                      fontSize: "0.82rem",
                      outline: "none",
                    }}
                    required
                  />
                </div>

                {/* IMAGEN / PLANO */}
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.3rem" }}>
                    Plano Arquitectónico / Imagen
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />

                  {editingForm.imageUrl ? (
                    <div style={{ position: "relative", height: "130px", borderRadius: "0.6rem", overflow: "hidden", border: "1px solid #CBD5E1", backgroundColor: "#0F172A", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <img src={editingForm.imageUrl} alt="Plano" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          position: "absolute",
                          bottom: "0.5rem",
                          right: "0.5rem",
                          padding: "0.3rem 0.6rem",
                          borderRadius: "0.4rem",
                          backgroundColor: "#1B3047",
                          color: "#FFFFFF",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        Cambiar Imagen
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        height: "90px",
                        borderRadius: "0.6rem",
                        border: "1.5px dashed #CBD5E1",
                        backgroundColor: "#F8FAFC",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.25rem",
                        cursor: "pointer",
                        color: "#64748B",
                      }}
                    >
                      <Upload size={18} />
                      <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>Subir imagen de plano arquitectónico</span>
                    </div>
                  )}

                  {/* PLANTILLAS PREDETERMINADAS */}
                  <div style={{ marginTop: "0.45rem" }}>
                    <span style={{ fontSize: "0.68rem", color: "#64748B", display: "block", marginBottom: "0.25rem" }}>
                      O elige una plantilla de plano:
                    </span>
                    <div style={{ display: "flex", gap: "0.35rem", overflowX: "auto" }}>
                      {DEFAULT_BLUEPRINTS.map((bp, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setEditingForm({ ...editingForm, imageUrl: bp.url })}
                          style={{
                            padding: "0.25rem 0.5rem",
                            borderRadius: "0.35rem",
                            fontSize: "0.68rem",
                            fontWeight: 600,
                            border: editingForm.imageUrl === bp.url ? "1.5px solid #2F80ED" : "1px solid #CBD5E1",
                            backgroundColor: editingForm.imageUrl === bp.url ? "rgba(47, 128, 237, 0.08)" : "#FFFFFF",
                            color: editingForm.imageUrl === bp.url ? "#2F80ED" : "#475569",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {bp.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ASIGNACIÓN A UNIDADES */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", margin: 0 }}>
                      Asignar a Unidades ({editingForm.selectedUnitNumbers.length})
                    </label>
                    <div style={{ display: "flex", gap: "0.3rem" }}>
                      <button
                        type="button"
                        onClick={() => setEditingForm({ ...editingForm, selectedUnitNumbers: allUnits.map((u) => u.unit) })}
                        style={{ fontSize: "0.7rem", color: "#2F80ED", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}
                      >
                        Todas
                      </button>
                      <span style={{ color: "#CBD5E1" }}>•</span>
                      <button
                        type="button"
                        onClick={() => setEditingForm({ ...editingForm, selectedUnitNumbers: [] })}
                        style={{ fontSize: "0.7rem", color: "#64748B", background: "none", border: "none", cursor: "pointer" }}
                      >
                        Ninguna
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      maxHeight: "120px",
                      overflowY: "auto",
                      backgroundColor: "#F8FAFC",
                      borderRadius: "0.5rem",
                      border: "1px solid #CBD5E1",
                      padding: "0.45rem",
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(65px, 1fr))",
                      gap: "0.3rem",
                    }}
                  >
                    {allUnits.map((u) => {
                      const isSelected = editingForm.selectedUnitNumbers.includes(u.unit);
                      return (
                        <div
                          key={u.unit}
                          onClick={() => {
                            if (isSelected) {
                              setEditingForm({
                                ...editingForm,
                                selectedUnitNumbers: editingForm.selectedUnitNumbers.filter((n) => n !== u.unit),
                              });
                            } else {
                              setEditingForm({
                                ...editingForm,
                                selectedUnitNumbers: [...editingForm.selectedUnitNumbers, u.unit],
                              });
                            }
                          }}
                          style={{
                            padding: "0.25rem 0.4rem",
                            borderRadius: "0.35rem",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            textAlign: "center",
                            cursor: "pointer",
                            backgroundColor: isSelected ? "#2F80ED" : "#FFFFFF",
                            color: isSelected ? "#FFFFFF" : "#1F3652",
                            border: isSelected ? "1px solid #2F80ED" : "1px solid #E2E8F0",
                          }}
                        >
                          {u.unit}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1.5rem" }}>
                <button
                  type="button"
                  onClick={() => setIsEditingModalOpen(false)}
                  style={{
                    padding: "0.55rem 1.2rem",
                    borderRadius: "0.5rem",
                    backgroundColor: "#F1F5F9",
                    color: "#475569",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  style={{
                    padding: "0.55rem 1.4rem",
                    borderRadius: "0.5rem",
                    backgroundColor: "#1B3047",
                    color: "#FFFFFF",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Guardar Planta
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL FULLSCREEN IMAGE PREVIEW */}
        {previewImageUrl && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 10001,
              backgroundColor: "rgba(10, 25, 41, 0.9)",
              backdropFilter: "blur(6px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "1.5rem",
            }}
            onClick={() => setPreviewImageUrl(null)}
          >
            <div style={{ position: "absolute", top: "1.5rem", right: "1.5rem" }}>
              <button
                type="button"
                onClick={() => setPreviewImageUrl(null)}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  border: "none",
                  backgroundColor: "rgba(255,255,255,0.2)",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={20} />
              </button>
            </div>
            <h4 style={{ color: "#FFFFFF", fontSize: "1.1rem", fontWeight: 800, marginBottom: "1rem" }}>
              {previewImageUrl.title}
            </h4>
            <img
              src={previewImageUrl.url}
              alt={previewImageUrl.title}
              style={{
                maxWidth: "90vw",
                maxHeight: "80vh",
                objectFit: "contain",
                borderRadius: "0.75rem",
                boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    </div>
  );
}
