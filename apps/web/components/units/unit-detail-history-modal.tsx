"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  History,
  CheckCircle2,
  Lock,
  Unlock,
  Edit2,
  Save,
  User,
  Info,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Layers,
  UploadCloud,
  FileText,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  SlidersHorizontal,
  Plus,
  Minus,
  Trash2,
  Compass,
  Maximize2,
  Home,
  Check,
  Zap,
  Truck,
  ArrowUpRight,
  Eye,
  Package,
  Box,
} from "lucide-react";
import { UnitItem, UnitPriceHistoryItem, ProjectAdditional } from "../../data/projects-data";
import { DevioDatePicker } from "../ui/devio-date-picker";
import CurrencyInput from "../ui/currency-input";
import { useProject } from "../../context/project-context";

export interface UnitDetailHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: UnitItem | null;
  currency?: "MXN" | "USD";
  additionals?: ProjectAdditional[];
  onSaveUnit?: (updatedUnit: UnitItem) => void;
  onInitiateSale?: (unit: UnitItem) => void;
  onInitiateQuote?: (unit: UnitItem) => void;
}

export default function UnitDetailHistoryModal({
  isOpen,
  onClose,
  unit,
  currency = "MXN",
  additionals = [],
  onSaveUnit,
  onInitiateSale,
  onInitiateQuote,
}: UnitDetailHistoryModalProps) {
  // Active Tab: "general" | "spaces" | "specs" | "history"
  const [activeTab, setActiveTab] = useState<"general" | "spaces" | "specs" | "history">("general");

  const { projects } = useProject();
  const currentProject = projects.find((p) => (p.unitsInventory || []).some((u) => u.unit === unit?.unit)) || projects[0];
  const availableFloorPlans = currentProject?.floorPlans || [];

  const assignedAdditionals = (additionals || []).filter(
    (a) => a.assignedToUnit && (a.assignedToUnit.toLowerCase() === (unit?.unit || "").toLowerCase())
  );

  // Core fields
  const [unitNumber, setUnitNumber] = useState<string>("");
  const [unitType, setUnitType] = useState<string>("Departamento");
  const [areaM2, setAreaM2] = useState<number>(75);
  const [deliveryDate, setDeliveryDate] = useState<string>("");
  const [unitStatus, setUnitStatus] = useState<string>("DISPONIBLE");
  const [unitClient, setUnitClient] = useState<string>("-");
  const [advisor, setAdvisor] = useState<string>("");
  const [coOwners, setCoOwners] = useState<any[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [floorPlan, setFloorPlan] = useState<string>("");
  const [unitImage, setUnitImage] = useState<string | null>(null);
  const [availableAdvisors, setAvailableAdvisors] = useState<Array<{ name: string; email: string; role: string }>>([]);

  useEffect(() => {
    let list: Array<{ name: string; email: string; role: string }> = [];
    if (currentProject?.team && currentProject.team.length > 0) {
      list = currentProject.team.filter((m) => m.assigned !== false).map((m) => ({ name: m.name, email: m.email, role: m.role }));
    }
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("devio_system_users") || sessionStorage.getItem("devio_system_users");
      if (stored) {
        try {
          const sysUsers: any[] = JSON.parse(stored);
          sysUsers.forEach((u) => {
            if (!list.some((existing) => existing.email.toLowerCase() === u.email.toLowerCase() || existing.name === u.name)) {
              list.push({ name: u.name, email: u.email, role: u.role });
            }
          });
        } catch (e) {}
      }
    }
    setAvailableAdvisors(list);
  }, [currentProject]);

  // Distribution & Spaces fields
  const [parkingSpots, setParkingSpots] = useState<number>(1);
  const [storageUnits, setStorageUnits] = useState<number>(0);
  const [terraceArea, setTerraceArea] = useState<string>("");
  const [viewOrientation, setViewOrientation] = useState<string>("");
  const [dimensions, setDimensions] = useState<string>("");
  const [floorLevel, setFloorLevel] = useState<number>(1);
  const [bedrooms, setBedrooms] = useState<number>(2);
  const [bathrooms, setBathrooms] = useState<number>(2);
  const [gardenArea, setGardenArea] = useState<string>("");
  const [usageType, setUsageType] = useState<string>("Habitacional");

  // Technical Specifications fields
  const [totalConstructionArea, setTotalConstructionArea] = useState<string>("");
  const [streetFrontage, setStreetFrontage] = useState<string>("");
  const [loadingDocks, setLoadingDocks] = useState<string>("");
  const [roofedArea, setRoofedArea] = useState<string>("");
  const [clearHeight, setClearHeight] = useState<string>("");
  const [floorLoadCapacity, setFloorLoadCapacity] = useState<string>("");
  const [electricCapacity, setElectricCapacity] = useState<string>("");
  const [maintenanceFee, setMaintenanceFee] = useState<number>(0);
  const [notesDescription, setNotesDescription] = useState<string>("");

  // Price history state
  const [priceHistoryList, setPriceHistoryList] = useState<
    Array<{
      date: string;
      previousPrice: number;
      newPrice: number;
      pctChange: number;
      reason: string;
      user: string;
    }>
  >([]);

  // Sub-modal: Cambiar precio
  const [showChangePriceSubModal, setShowChangePriceSubModal] = useState(false);
  const [newPriceInput, setNewPriceInput] = useState<number>(0);
  const [priceReasonInput, setPriceReasonInput] = useState<string>("");

  // Sub-modal: Confirmar marcar disponible / liberar
  const [showMarkAvailableModal, setShowMarkAvailableModal] = useState(false);

  // Saving states
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (unit) {
      setUnitNumber(unit.unit || "");
      setUnitType(unit.type || "Departamento");
      setAreaM2(unit.areaM2 || 75);
      setDeliveryDate(unit.deliveryDate || "");
      setUnitStatus(unit.status || "DISPONIBLE");
      setUnitClient(unit.client || "-");
      setAdvisor(unit.advisor || "");
      setCoOwners(unit.coOwners || []);
      setCurrentPrice(unit.price || 0);
      setFloorLevel(unit.floor || 1);
      setBedrooms(unit.bedrooms !== undefined ? unit.bedrooms : 2);
      setBathrooms(unit.bathrooms !== undefined ? unit.bathrooms : 2);
      setParkingSpots(unit.parkingSpots !== undefined ? unit.parkingSpots : 1);
      setStorageUnits(unit.storageUnits !== undefined ? unit.storageUnits : 0);
      setViewOrientation(unit.viewType || unit.orientation || "");
      setTerraceArea(unit.terraceAreaM2 ? String(unit.terraceAreaM2) : "");
      setGardenArea(unit.gardenAreaM2 ? String(unit.gardenAreaM2) : "");
      setMaintenanceFee(unit.maintenanceFee || 0);
      setFloorPlan(unit.floorPlan || (availableFloorPlans[0]?.name || ""));

      const history =
        unit.priceHistory && unit.priceHistory.length > 0
          ? unit.priceHistory
          : [
              {
                date: new Date().toLocaleDateString("es-MX"),
                previousPrice: unit.price,
                newPrice: unit.price,
                pctChange: 0,
                reason: "Precio de Lista Inicial",
                user: "Administrador",
              },
            ];
      setPriceHistoryList(history);
      setActiveTab("general");
      setShowChangePriceSubModal(false);
      setShowMarkAvailableModal(false);
    }
  }, [unit]);

  if (!isOpen || !unit) return null;

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const pricePerM2 = areaM2 > 0 ? Math.round(currentPrice / areaM2) : 0;

  // Guardar nuevo precio individual desde el submodal
  const handleSaveIndividualPriceChange = (e: React.FormEvent) => {
    e.preventDefault();
    const isAvailable = (unitStatus || "").toUpperCase() === "DISPONIBLE";
    if (!isAvailable) {
      alert(`Solo se puede ajustar el precio de unidades con estado Disponible. Esta unidad se encuentra en estado '${unitStatus}'.`);
      return;
    }
    if (!newPriceInput || newPriceInput <= 0) {
      alert("Por favor introduce un monto válido.");
      return;
    }
    const diffPct = currentPrice > 0 ? ((newPriceInput - currentPrice) / currentPrice) * 100 : 0;
    const nowStr = new Date().toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });

    const newHistoryEntry = {
      date: nowStr,
      previousPrice: currentPrice,
      newPrice: newPriceInput,
      pctChange: parseFloat(diffPct.toFixed(2)),
      reason: priceReasonInput.trim() || "Ajuste individual de precio",
      user: "Usuario Devio",
    };

    const updatedHistory = [newHistoryEntry, ...priceHistoryList];
    setPriceHistoryList(updatedHistory);
    setCurrentPrice(newPriceInput);
    setShowChangePriceSubModal(false);
    setPriceReasonInput("");

    if (onSaveUnit) {
      onSaveUnit({
        ...unit,
        unit: unitNumber,
        type: unitType,
        areaM2: Number(areaM2),
        floor: Number(floorLevel),
        price: newPriceInput,
        status: unitStatus as any,
        client: unitClient,
        advisor: advisor || undefined,
        coOwners,
        deliveryDate,
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        parkingSpots: Number(parkingSpots),
        storageUnits: Number(storageUnits),
        viewType: viewOrientation,
        orientation: viewOrientation,
        terraceAreaM2: terraceArea ? Number(terraceArea) : undefined,
        gardenAreaM2: gardenArea ? Number(gardenArea) : undefined,
        maintenanceFee: Number(maintenanceFee),
        floorPlan: floorPlan && floorPlan !== "Sin asignar" ? floorPlan : undefined,
        priceHistory: updatedHistory,
      });
    }
  };

  // Confirmar acción de marcar como disponible / liberar unidad
  const handleConfirmMarkAvailable = () => {
    setUnitStatus("DISPONIBLE");
    setUnitClient("-");
    setCoOwners([]);
    setShowMarkAvailableModal(false);
  };

  // Bloquear / Desbloquear
  const handleToggleBlock = () => {
    if (unitStatus === "BLOQUEADA") {
      setUnitStatus("DISPONIBLE");
    } else if (unitStatus === "DISPONIBLE") {
      setUnitStatus("BLOQUEADA");
    }
  };

  // Guardar todos los cambios
  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      if (onSaveUnit) {
        onSaveUnit({
          ...unit,
          unit: unitNumber,
          type: unitType,
          areaM2: Number(areaM2),
          floor: Number(floorLevel),
          price: currentPrice,
          status: unitStatus as any,
          client: unitClient,
          advisor: advisor || undefined,
          coOwners,
          deliveryDate,
          bedrooms: Number(bedrooms),
          bathrooms: Number(bathrooms),
          parkingSpots: Number(parkingSpots),
          storageUnits: Number(storageUnits),
          viewType: viewOrientation,
          orientation: viewOrientation,
          terraceAreaM2: terraceArea ? Number(terraceArea) : undefined,
          gardenAreaM2: gardenArea ? Number(gardenArea) : undefined,
          maintenanceFee: Number(maintenanceFee),
          floorPlan: floorPlan && floorPlan !== "Sin asignar" ? floorPlan : undefined,
          priceHistory: priceHistoryList,
        });
      }
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 600);
    }, 400);
  };

  // Status visual badge styling
  const getStatusBadge = () => {
    switch (unitStatus) {
      case "VENDIDA":
        return {
          bg: "rgba(0, 196, 140, 0.12)",
          color: "var(--devio-green)",
          border: "rgba(0, 196, 140, 0.3)",
          label: "Vendida",
          icon: <CheckCircle2 size={13} />,
        };
      case "BLOQUEADA":
        return {
          bg: "rgba(224, 83, 69, 0.12)",
          color: "var(--devio-red)",
          border: "rgba(224, 83, 69, 0.3)",
          label: "Bloqueada",
          icon: <Lock size={13} />,
        };
      case "APARTADA":
        return {
          bg: "rgba(245, 158, 11, 0.12)",
          color: "#D97706",
          border: "rgba(245, 158, 11, 0.3)",
          label: "Apartada",
          icon: <Sparkles size={13} />,
        };
      default:
        return {
          bg: "rgba(47, 128, 237, 0.1)",
          color: "var(--devio-blue)",
          border: "rgba(47, 128, 237, 0.25)",
          label: "Disponible",
          icon: <Sparkles size={13} />,
        };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(10, 25, 41, 0.7)",
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
          backgroundColor: "#FFFFFF",
          borderRadius: "1.25rem",
          width: "100%",
          maxWidth: "1040px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 65px -15px rgba(0, 0, 0, 0.35)",
          overflow: "hidden",
          position: "relative",
          border: "1px solid rgba(22, 43, 63, 0.08)",
        }}
      >
        {/* ------------------------------------------------------------------ */}
        {/* HEADER */}
        {/* ------------------------------------------------------------------ */}
        <div
          style={{
            padding: "1.25rem 1.75rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid var(--devio-neutral-1)",
            backgroundColor: "#FFFFFF",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "0.75rem",
                backgroundColor: "rgba(31, 54, 82, 0.06)",
                color: "var(--devio-blue-dark)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Building2 size={22} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--devio-blue-dark)", margin: 0 }}>
                  Unidad {unitNumber || "101"}
                </h2>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    padding: "0.2rem 0.65rem",
                    borderRadius: "9999px",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    backgroundColor: statusBadge.bg,
                    color: statusBadge.color,
                    border: `1px solid ${statusBadge.border}`,
                  }}
                >
                  {statusBadge.icon}
                  {statusBadge.label}
                </span>
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--devio-neutral-3)", margin: "0.15rem 0 0 0" }}>
                {unitType} • Nivel {floorLevel} • {areaM2} m² totales
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--devio-neutral-3)",
              padding: "0.5rem",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background-color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--devio-neutral-1)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <X size={20} />
          </button>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* COMMERCIAL ACTIONS & STATUS RIBBON */}
        {/* ------------------------------------------------------------------ */}
        <div
          style={{
            padding: "0.85rem 1.75rem",
            backgroundColor: "rgba(31, 54, 82, 0.03)",
            borderBottom: "1px solid var(--devio-neutral-1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          {/* Status info preview */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--devio-blue-dark)" }}>
              Acciones Comerciales Rápidas:
            </span>
            {unitClient && unitClient !== "-" && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.25rem 0.65rem",
                  borderRadius: "0.5rem",
                  backgroundColor: "rgba(0, 196, 140, 0.08)",
                  border: "1px solid rgba(0, 196, 140, 0.2)",
                  fontSize: "0.78rem",
                  color: "var(--devio-blue-dark)",
                }}
              >
                <User size={13} style={{ color: "var(--devio-green)" }} />
                <span>Titular: <strong>{unitClient}</strong></span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            {unitStatus === "DISPONIBLE" && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (onInitiateSale) onInitiateSale(unit);
                    onClose();
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.45rem 0.9rem",
                    borderRadius: "0.5rem",
                    backgroundColor: "var(--devio-green)",
                    color: "var(--devio-white)",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(0, 196, 140, 0.25)",
                  }}
                >
                  <ShoppingBag size={14} /> Registrar Venta
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onInitiateQuote) onInitiateQuote(unit);
                    else if (onInitiateSale) onInitiateSale(unit);
                    onClose();
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.45rem 0.85rem",
                    borderRadius: "0.5rem",
                    backgroundColor: "var(--devio-white)",
                    color: "var(--devio-blue-dark)",
                    border: "1px solid var(--devio-neutral-2)",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <FileText size={14} style={{ color: "var(--devio-blue)" }} /> Cotizar Unidad
                </button>

                <button
                  type="button"
                  onClick={handleToggleBlock}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.45rem 0.85rem",
                    borderRadius: "0.5rem",
                    backgroundColor: "var(--devio-white)",
                    color: "#D97706",
                    border: "1px solid rgba(245, 158, 11, 0.3)",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <Lock size={14} /> Bloquear Unidad
                </button>
              </>
            )}

            {unitStatus === "BLOQUEADA" && (
              <button
                type="button"
                onClick={handleToggleBlock}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.45rem 0.9rem",
                  borderRadius: "0.5rem",
                  backgroundColor: "var(--devio-green)",
                  color: "var(--devio-white)",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <Unlock size={14} /> Desbloquear Unidad
              </button>
            )}

            {(unitStatus === "VENDIDA" || unitStatus === "APARTADA") && (
              <button
                type="button"
                onClick={() => setShowMarkAvailableModal(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.45rem 0.85rem",
                  borderRadius: "0.5rem",
                  backgroundColor: "rgba(224, 83, 69, 0.08)",
                  color: "var(--devio-red)",
                  border: "1px solid rgba(224, 83, 69, 0.25)",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <RotateCcw size={14} /> Marcar como Disponible
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                const isAvailable = (unitStatus || "").toUpperCase() === "DISPONIBLE";
                if (!isAvailable) {
                  alert(`Solo se puede ajustar el precio de unidades con estado Disponible. Esta unidad se encuentra en estado "${unitStatus}".`);
                  return;
                }
                setNewPriceInput(currentPrice);
                setShowChangePriceSubModal(true);
              }}
              disabled={(unitStatus || "").toUpperCase() !== "DISPONIBLE"}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.45rem 0.85rem",
                borderRadius: "0.5rem",
                backgroundColor: (unitStatus || "").toUpperCase() === "DISPONIBLE" ? "var(--devio-white)" : "#F1F5F9",
                color: (unitStatus || "").toUpperCase() === "DISPONIBLE" ? "var(--devio-blue-dark)" : "#94A3B8",
                border: "1px solid var(--devio-neutral-2)",
                fontSize: "0.8rem",
                fontWeight: 700,
                cursor: (unitStatus || "").toUpperCase() === "DISPONIBLE" ? "pointer" : "not-allowed",
                opacity: (unitStatus || "").toUpperCase() === "DISPONIBLE" ? 1 : 0.6,
              }}
              title={(unitStatus || "").toUpperCase() !== "DISPONIBLE" ? `El precio no se puede modificar porque la unidad está ${unitStatus}.` : "Ajustar precio de lista"}
            >
              <TrendingUp size={14} style={{ color: (unitStatus || "").toUpperCase() === "DISPONIBLE" ? "var(--devio-blue)" : "#94A3B8" }} /> Ajustar Precio
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* BODY - 2-COLUMN STRUCTURE */}
        {/* ------------------------------------------------------------------ */}
        <div style={{ flex: 1, overflowY: "auto", display: "grid", gridTemplateColumns: "340px 1fr" }}>
          
          {/* LEFT PANEL: MEDIA, PLANTA Y VALUACIÓN */}
          <div
            style={{
              padding: "1.5rem",
              borderRight: "1px solid var(--devio-neutral-1)",
              backgroundColor: "rgba(31, 54, 82, 0.015)",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
            }}
          >
            {/* 1. RENDER / FOTO DE LA UNIDAD */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "0.85rem",
                border: "1px solid var(--devio-neutral-1)",
                padding: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.6rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <ImageIcon size={14} style={{ color: "var(--devio-blue)" }} /> Render / Fotografía
                </span>
                {unitImage && (
                  <button
                    type="button"
                    onClick={() => setUnitImage(null)}
                    style={{ background: "none", border: "none", color: "var(--devio-red)", cursor: "pointer", padding: "0.1rem" }}
                    title="Eliminar imagen"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>

              <label
                style={{
                  width: "100%",
                  height: "150px",
                  border: unitImage ? "1px solid var(--devio-neutral-1)" : "1.5px dashed var(--devio-neutral-2)",
                  borderRadius: "0.75rem",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  backgroundColor: "#F8FAFC",
                  overflow: "hidden",
                  position: "relative",
                  transition: "border-color 0.2s ease",
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => setUnitImage(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                {unitImage ? (
                  <img src={unitImage} alt="Render de la unidad" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.35rem", color: "var(--devio-neutral-3)" }}>
                    <UploadCloud size={24} style={{ color: "var(--devio-blue)" }} />
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)" }}>Subir Imagen / Render</span>
                    <span style={{ fontSize: "0.68rem" }}>PNG, JPG o WEBP</span>
                  </div>
                )}
              </label>
            </div>

            {/* 2. PLANTA DE CONJUNTO ASOCIADA */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "0.85rem",
                border: "1px solid var(--devio-neutral-1)",
                padding: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.6rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Layers size={14} style={{ color: "var(--devio-blue)" }} /> Planta de Conjunto
                </span>
                <span style={{ fontSize: "0.72rem", color: "var(--devio-neutral-3)", fontWeight: 600 }}>
                  Nivel {floorLevel}
                </span>
              </div>

              {(() => {
                const matchedPlan = availableFloorPlans.find((fp) => fp.name === floorPlan);
                if (matchedPlan && matchedPlan.imageUrl) {
                  return (
                    <div
                      style={{
                        width: "100%",
                        height: "115px",
                        borderRadius: "0.65rem",
                        overflow: "hidden",
                        border: "1px solid var(--devio-neutral-1)",
                        backgroundColor: "#0F172A",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <img
                        src={matchedPlan.imageUrl}
                        alt={floorPlan}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                  );
                }
                return (
                  <div
                    style={{
                      width: "100%",
                      height: "80px",
                      borderRadius: "0.65rem",
                      border: "1px solid var(--devio-neutral-1)",
                      backgroundColor: "#F8FAFC",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.25rem",
                      color: "var(--devio-neutral-3)",
                    }}
                  >
                    <Layers size={20} style={{ color: "var(--devio-blue)" }} />
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--devio-blue-dark)" }}>
                      {floorPlan || "Sin Planta Asignada"}
                    </span>
                  </div>
                );
              })()}

              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--devio-neutral-3)", display: "block", marginBottom: "0.25rem" }}>
                  Planta Asociada
                </label>
                <select
                  value={floorPlan}
                  onChange={(e) => setFloorPlan(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.65rem",
                    borderRadius: "0.5rem",
                    border: "1px solid var(--devio-neutral-2)",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    color: "var(--devio-blue-dark)",
                    backgroundColor: "var(--devio-white)",
                    outline: "none",
                  }}
                >
                  <option value="Sin asignar">Sin Planta Asignada</option>
                  {availableFloorPlans.map((fp) => (
                    <option key={fp.id} value={fp.name}>
                      {fp.name}
                    </option>
                  ))}
                  {availableFloorPlans.length === 0 && (
                    <>
                      <option value="Planta Tipo A">Planta Tipo A</option>
                      <option value="Planta Tipo B">Planta Tipo B</option>
                      <option value="Planta Tipo C">Planta Tipo C</option>
                      <option value="Planta Penthouse">Planta Penthouse</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* 3. CARD PRECIO Y VALUACIÓN */}
            <div
              style={{
                backgroundColor: "var(--devio-blue-dark)",
                borderRadius: "0.85rem",
                padding: "1.1rem 1.25rem",
                color: "var(--devio-white)",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "rgba(255, 255, 255, 0.7)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Precio de Lista Vigente
              </span>
              <div style={{ fontSize: "1.45rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
                {formatMoney(currentPrice)}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.75)", borderTop: "1px solid rgba(255, 255, 255, 0.12)", paddingTop: "0.4rem" }}>
                <span>Precio por m²:</span>
                <strong style={{ color: "var(--devio-white)" }}>{formatMoney(pricePerM2)} / m²</strong>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: TABS & INPUT FIELDS */}
          <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column" }}>
            
            {/* TABS NAVIGATION */}
            <div
              style={{
                display: "flex",
                gap: "0.4rem",
                borderBottom: "1px solid var(--devio-neutral-1)",
                paddingBottom: "0.75rem",
                marginBottom: "1.25rem",
              }}
            >
              {[
                { id: "general", label: "Datos Principales", icon: <Building2 size={14} /> },
                { id: "spaces", label: "Distribución y Espacios", icon: <SlidersHorizontal size={14} /> },
                { id: "specs", label: "Especificaciones Técnicas", icon: <Maximize2 size={14} /> },
                { id: "history", label: `Historial Precios (${priceHistoryList.length})`, icon: <History size={14} /> },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      padding: "0.5rem 0.9rem",
                      borderRadius: "0.6rem",
                      fontSize: "0.8rem",
                      fontWeight: isActive ? 800 : 600,
                      color: isActive ? "var(--devio-blue-dark)" : "var(--devio-neutral-3)",
                      backgroundColor: isActive ? "rgba(31, 54, 82, 0.08)" : "transparent",
                      border: "none",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSaveAll} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              
              {/* TAB 1: DATOS PRINCIPALES */}
              {activeTab === "general" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1.1rem" }}>
                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.35rem" }}>
                      Número de Unidad *
                    </label>
                    <input
                      type="text"
                      required
                      value={unitNumber}
                      onChange={(e) => setUnitNumber(e.target.value)}
                      placeholder="Ej. 101"
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.6rem",
                        border: "1.5px solid var(--devio-neutral-2)",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        color: "var(--devio-blue-dark)",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.35rem" }}>
                      Tipo de Unidad *
                    </label>
                    <select
                      value={unitType}
                      onChange={(e) => setUnitType(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.6rem",
                        border: "1.5px solid var(--devio-neutral-2)",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: "var(--devio-blue-dark)",
                        backgroundColor: "var(--devio-white)",
                        outline: "none",
                      }}
                    >
                      <option value="Departamento">Departamento</option>
                      <option value="Penthouse">Penthouse</option>
                      <option value="Loft">Loft</option>
                      <option value="Casa">Casa</option>
                      <option value="Local Comercial">Local Comercial</option>
                      <option value="Oficina">Oficina</option>
                      <option value="Bodega">Bodega</option>
                      <option value="Terreno">Terreno</option>
                    </select>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                      <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)" }}>
                        Precio de Lista Vigente (Solo Lectura) *
                      </label>
                      {(unitStatus || "").toUpperCase() === "DISPONIBLE" ? (
                        <button
                          type="button"
                          onClick={() => {
                            setNewPriceInput(currentPrice);
                            setShowChangePriceSubModal(true);
                          }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            background: "none",
                            border: "none",
                            color: "var(--devio-blue)",
                            fontSize: "0.74rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          <TrendingUp size={12} /> Ajustar Precio
                        </button>
                      ) : (
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>
                          <Lock size={11} style={{ display: "inline", verticalAlign: "middle", marginRight: "2px" }} />
                          Bloqueado ({unitStatus})
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.6rem",
                        border: "1.5px solid var(--devio-neutral-2)",
                        backgroundColor: "#F8FAFC",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "not-allowed",
                      }}
                      title="El precio no se edita directamente en este formulario. Usa el botón 'Ajustar Precio'."
                    >
                      <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--devio-blue-dark)" }}>
                        {formatMoney(currentPrice)}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>
                          {currency}
                        </span>
                        <Lock size={14} color="var(--devio-neutral-3)" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.35rem" }}>
                      Superficie Total (m²) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={areaM2}
                      onChange={(e) => setAreaM2(Number(e.target.value))}
                      placeholder="95.5"
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.6rem",
                        border: "1.5px solid var(--devio-neutral-2)",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        color: "var(--devio-blue-dark)",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.35rem" }}>
                      Nivel / Piso
                    </label>
                    <input
                      type="number"
                      value={floorLevel}
                      onChange={(e) => setFloorLevel(Number(e.target.value))}
                      placeholder="1"
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.6rem",
                        border: "1.5px solid var(--devio-neutral-2)",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: "var(--devio-blue-dark)",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.35rem" }}>
                      Fecha Estimada de Entrega
                    </label>
                    <DevioDatePicker
                      value={deliveryDate}
                      onChange={(val) => setDeliveryDate(val)}
                      placeholder="YYYY-MM-DD"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.35rem" }}>
                      Tipo de Uso
                    </label>
                    <select
                      value={usageType}
                      onChange={(e) => setUsageType(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.6rem",
                        border: "1.5px solid var(--devio-neutral-2)",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: "var(--devio-blue-dark)",
                        backgroundColor: "var(--devio-white)",
                        outline: "none",
                      }}
                    >
                      <option value="Habitacional">Habitacional</option>
                      <option value="Comercial">Comercial</option>
                      <option value="Mixto">Mixto</option>
                      <option value="Industrial">Industrial</option>
                      <option value="Corporativo">Corporativo</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.35rem" }}>
                      Asesor Comercial Asignado
                    </label>
                    <select
                      value={advisor}
                      onChange={(e) => setAdvisor(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.6rem",
                        border: "1.5px solid var(--devio-neutral-2)",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: "var(--devio-blue-dark)",
                        backgroundColor: "var(--devio-white)",
                        outline: "none",
                      }}
                    >
                      <option value="">Sin Asesor Asignado</option>
                      {availableAdvisors.map((adv, idx) => (
                        <option key={idx} value={adv.name}>
                          {adv.name} ({adv.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Propietarios Card si está vendida */}
                  {coOwners && coOwners.length > 0 && (
                    <div
                      style={{
                        gridColumn: "1 / -1",
                        marginTop: "0.5rem",
                        backgroundColor: "rgba(31, 54, 82, 0.03)",
                        borderRadius: "0.75rem",
                        padding: "1rem",
                        border: "1px solid var(--devio-neutral-1)",
                      }}
                    >
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.5rem" }}>
                        Copropietarios Registrados ({coOwners.length})
                      </span>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                        {coOwners.map((owner: any, idx: number) => (
                          <div
                            key={owner.id || idx}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              backgroundColor: "#FFFFFF",
                              padding: "0.5rem 0.75rem",
                              borderRadius: "0.5rem",
                              border: "1px solid var(--devio-neutral-1)",
                              fontSize: "0.8rem",
                            }}
                          >
                            <span style={{ fontWeight: 700, color: "var(--devio-blue-dark)" }}>{owner.name}</span>
                            <span style={{ fontSize: "0.75rem", color: "var(--devio-green)", fontWeight: 800 }}>{owner.ownershipPct}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Adicionales / Addons Vinculados */}
                  {assignedAdditionals.length > 0 && (
                    <div
                      style={{
                        gridColumn: "1 / -1",
                        marginTop: "0.5rem",
                        backgroundColor: "rgba(47, 128, 237, 0.03)",
                        borderRadius: "0.75rem",
                        padding: "1rem",
                        border: "1px solid rgba(47, 128, 237, 0.2)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <Package size={15} color="#2F80ED" /> Adicionales / Addons Vinculados ({assignedAdditionals.length})
                        </span>
                        <span style={{ fontSize: "0.72rem", color: "#64748B" }}>
                          Incluidos en el contrato / venta de la unidad
                        </span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                        {assignedAdditionals.map((addon) => (
                          <div
                            key={addon.id}
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
                                <span style={{ fontSize: "0.72rem", color: "#64748B" }}>
                                  ({addon.areaM2} m²)
                                </span>
                              )}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                              <span style={{ fontWeight: 700, color: "#00C48C" }}>
                                {currency === "USD" ? `$${addon.price.toLocaleString()} USD` : `$${addon.price.toLocaleString()} MXN`}
                              </span>
                              <span
                                style={{
                                  fontSize: "0.68rem",
                                  fontWeight: 800,
                                  backgroundColor: addon.status === "VENDIDO" ? "rgba(0, 196, 140, 0.12)" : "rgba(47, 128, 237, 0.1)",
                                  color: addon.status === "VENDIDO" ? "#00C48C" : "#2F80ED",
                                  padding: "0.15rem 0.45rem",
                                  borderRadius: "4px",
                                }}
                              >
                                {addon.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: DISTRIBUCIÓN Y ESPACIOS */}
              {activeTab === "spaces" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1.1rem" }}>
                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.35rem" }}>
                      Recámaras
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <button
                        type="button"
                        onClick={() => setBedrooms(Math.max(0, bedrooms - 1))}
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "0.5rem",
                          border: "1px solid var(--devio-neutral-2)",
                          backgroundColor: "#FFFFFF",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        value={bedrooms}
                        onChange={(e) => setBedrooms(Number(e.target.value))}
                        style={{
                          width: "60px",
                          textAlign: "center",
                          padding: "0.5rem",
                          borderRadius: "0.5rem",
                          border: "1.5px solid var(--devio-neutral-2)",
                          fontWeight: 700,
                          fontSize: "0.9rem",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setBedrooms(bedrooms + 1)}
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "0.5rem",
                          border: "1px solid var(--devio-neutral-2)",
                          backgroundColor: "#FFFFFF",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.35rem" }}>
                      Baños
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <button
                        type="button"
                        onClick={() => setBathrooms(Math.max(0, bathrooms - 1))}
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "0.5rem",
                          border: "1px solid var(--devio-neutral-2)",
                          backgroundColor: "#FFFFFF",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        value={bathrooms}
                        onChange={(e) => setBathrooms(Number(e.target.value))}
                        style={{
                          width: "60px",
                          textAlign: "center",
                          padding: "0.5rem",
                          borderRadius: "0.5rem",
                          border: "1.5px solid var(--devio-neutral-2)",
                          fontWeight: 700,
                          fontSize: "0.9rem",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setBathrooms(bathrooms + 1)}
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "0.5rem",
                          border: "1px solid var(--devio-neutral-2)",
                          backgroundColor: "#FFFFFF",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.35rem" }}>
                      Cajones de Estacionamiento
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <button
                        type="button"
                        onClick={() => setParkingSpots(Math.max(0, parkingSpots - 1))}
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "0.5rem",
                          border: "1px solid var(--devio-neutral-2)",
                          backgroundColor: "#FFFFFF",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        value={parkingSpots}
                        onChange={(e) => setParkingSpots(Number(e.target.value))}
                        style={{
                          width: "60px",
                          textAlign: "center",
                          padding: "0.5rem",
                          borderRadius: "0.5rem",
                          border: "1.5px solid var(--devio-neutral-2)",
                          fontWeight: 700,
                          fontSize: "0.9rem",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setParkingSpots(parkingSpots + 1)}
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "0.5rem",
                          border: "1px solid var(--devio-neutral-2)",
                          backgroundColor: "#FFFFFF",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.35rem" }}>
                      Bodegas / Almacén
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <button
                        type="button"
                        onClick={() => setStorageUnits(Math.max(0, storageUnits - 1))}
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "0.5rem",
                          border: "1px solid var(--devio-neutral-2)",
                          backgroundColor: "#FFFFFF",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        value={storageUnits}
                        onChange={(e) => setStorageUnits(Number(e.target.value))}
                        style={{
                          width: "60px",
                          textAlign: "center",
                          padding: "0.5rem",
                          borderRadius: "0.5rem",
                          border: "1.5px solid var(--devio-neutral-2)",
                          fontWeight: 700,
                          fontSize: "0.9rem",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setStorageUnits(storageUnits + 1)}
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "0.5rem",
                          border: "1px solid var(--devio-neutral-2)",
                          backgroundColor: "#FFFFFF",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.35rem" }}>
                      Terraza / Balcón (m²)
                    </label>
                    <input
                      type="text"
                      value={terraceArea}
                      onChange={(e) => setTerraceArea(e.target.value)}
                      placeholder="Ej. 12.5 m²"
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.6rem",
                        border: "1.5px solid var(--devio-neutral-2)",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: "var(--devio-blue-dark)",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.35rem" }}>
                      Jardín Privado (m²)
                    </label>
                    <input
                      type="text"
                      value={gardenArea}
                      onChange={(e) => setGardenArea(e.target.value)}
                      placeholder="Ej. No o 25 m²"
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.6rem",
                        border: "1.5px solid var(--devio-neutral-2)",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: "var(--devio-blue-dark)",
                      }}
                    />
                  </div>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.35rem" }}>
                      Dimensiones (Frente x Fondo)
                    </label>
                    <input
                      type="text"
                      value={dimensions}
                      onChange={(e) => setDimensions(e.target.value)}
                      placeholder="Ej. 8.5m x 11.2m"
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.6rem",
                        border: "1.5px solid var(--devio-neutral-2)",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: "var(--devio-blue-dark)",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: ESPECIFICACIONES TÉCNICAS */}
              {activeTab === "specs" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1.1rem" }}>
                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.35rem" }}>
                      Orientación / Vista
                    </label>
                    <input
                      type="text"
                      value={viewOrientation}
                      onChange={(e) => setViewOrientation(e.target.value)}
                      placeholder="Ej. Panorámica Norte / Frente a alberca"
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.6rem",
                        border: "1.5px solid var(--devio-neutral-2)",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: "var(--devio-blue-dark)",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.35rem" }}>
                      Altura Libre (m)
                    </label>
                    <input
                      type="text"
                      value={clearHeight}
                      onChange={(e) => setClearHeight(e.target.value)}
                      placeholder="Ej. 2.80 m"
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.6rem",
                        border: "1.5px solid var(--devio-neutral-2)",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: "var(--devio-blue-dark)",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.35rem" }}>
                      Frente a Calle (metros lineales)
                    </label>
                    <input
                      type="text"
                      value={streetFrontage}
                      onChange={(e) => setStreetFrontage(e.target.value)}
                      placeholder="Ej. 10 m"
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.6rem",
                        border: "1.5px solid var(--devio-neutral-2)",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: "var(--devio-blue-dark)",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.35rem" }}>
                      Capacidad Eléctrica (kVA)
                    </label>
                    <input
                      type="text"
                      value={electricCapacity}
                      onChange={(e) => setElectricCapacity(e.target.value)}
                      placeholder="Ej. 15 kVA"
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.6rem",
                        border: "1.5px solid var(--devio-neutral-2)",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: "var(--devio-blue-dark)",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.35rem" }}>
                      Capacidad de Carga de Piso (ton/m²)
                    </label>
                    <input
                      type="text"
                      value={floorLoadCapacity}
                      onChange={(e) => setFloorLoadCapacity(e.target.value)}
                      placeholder="Ej. 5 ton/m²"
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.6rem",
                        border: "1.5px solid var(--devio-neutral-2)",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: "var(--devio-blue-dark)",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.35rem" }}>
                      Cuota de Mantenimiento Estimada
                    </label>
                    <CurrencyInput
                      value={maintenanceFee}
                      onChange={(val) => setMaintenanceFee(val)}
                      currencySymbol="$"
                    />
                  </div>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.35rem" }}>
                      Notas u Observaciones Internas
                    </label>
                    <textarea
                      rows={3}
                      value={notesDescription}
                      onChange={(e) => setNotesDescription(e.target.value)}
                      placeholder="Detalles sobre acabados, amenidades incluidas o condiciones especiales..."
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.6rem",
                        border: "1.5px solid var(--devio-neutral-2)",
                        fontSize: "0.85rem",
                        fontWeight: 500,
                        color: "var(--devio-blue-dark)",
                        outline: "none",
                        fontFamily: "inherit",
                        resize: "vertical",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: HISTORIAL DE PRECIOS */}
              {activeTab === "history" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--devio-blue-dark)", margin: 0 }}>
                        Registro Cronológico de Precios
                      </h4>
                      <p style={{ fontSize: "0.75rem", color: "var(--devio-neutral-3)", margin: "0.15rem 0 0 0" }}>
                        Bitácora completa de cambios de lista y ajustes individuales de esta unidad.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setNewPriceInput(currentPrice);
                        setShowChangePriceSubModal(true);
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        padding: "0.45rem 0.85rem",
                        borderRadius: "0.5rem",
                        backgroundColor: "var(--devio-blue-dark)",
                        color: "var(--devio-white)",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      <Plus size={13} /> Nuevo Ajuste
                    </button>
                  </div>

                  <div
                    style={{
                      borderRadius: "0.75rem",
                      border: "1px solid var(--devio-neutral-1)",
                      overflow: "hidden",
                      backgroundColor: "#FFFFFF",
                    }}
                  >
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", textAlign: "left" }}>
                      <thead>
                        <tr style={{ backgroundColor: "rgba(31, 54, 82, 0.04)", borderBottom: "1px solid var(--devio-neutral-1)" }}>
                          <th style={{ padding: "0.65rem 0.9rem", fontWeight: 700, color: "var(--devio-blue-dark)" }}>Fecha</th>
                          <th style={{ padding: "0.65rem 0.9rem", fontWeight: 700, color: "var(--devio-blue-dark)" }}>Precio Resultante</th>
                          <th style={{ padding: "0.65rem 0.9rem", fontWeight: 700, color: "var(--devio-blue-dark)" }}>Variación</th>
                          <th style={{ padding: "0.65rem 0.9rem", fontWeight: 700, color: "var(--devio-blue-dark)" }}>Motivo / Razón</th>
                          <th style={{ padding: "0.65rem 0.9rem", fontWeight: 700, color: "var(--devio-blue-dark)" }}>Usuario</th>
                        </tr>
                      </thead>
                      <tbody>
                        {priceHistoryList.map((h, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid var(--devio-neutral-1)" }}>
                            <td style={{ padding: "0.65rem 0.9rem", fontWeight: 600, color: "var(--devio-blue-dark)" }}>{h.date}</td>
                            <td style={{ padding: "0.65rem 0.9rem", fontWeight: 800, color: "var(--devio-blue-dark)" }}>{formatMoney(h.newPrice)}</td>
                            <td style={{ padding: "0.65rem 0.9rem" }}>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  padding: "0.15rem 0.45rem",
                                  borderRadius: "9999px",
                                  fontSize: "0.72rem",
                                  fontWeight: 800,
                                  backgroundColor: h.pctChange >= 0 ? "rgba(0, 196, 140, 0.12)" : "rgba(224, 83, 69, 0.12)",
                                  color: h.pctChange >= 0 ? "var(--devio-green)" : "var(--devio-red)",
                                }}
                              >
                                {h.pctChange >= 0 ? `+${h.pctChange}%` : `${h.pctChange}%`}
                              </span>
                            </td>
                            <td style={{ padding: "0.65rem 0.9rem", color: "var(--devio-neutral-3)" }}>{h.reason}</td>
                            <td style={{ padding: "0.65rem 0.9rem", color: "var(--devio-neutral-3)", fontSize: "0.75rem" }}>{h.user}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* FOOTER */}
        {/* ------------------------------------------------------------------ */}
        <div
          style={{
            padding: "1rem 1.75rem",
            backgroundColor: "#FFFFFF",
            borderTop: "1px solid var(--devio-neutral-1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "var(--devio-neutral-3)" }}>
            <span>Unidad <strong>{unitNumber}</strong></span>
            <span>•</span>
            <span>{areaM2} m²</span>
            <span>•</span>
            <strong style={{ color: "var(--devio-blue-dark)" }}>{formatMoney(currentPrice)}</strong>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.65rem 1.25rem",
                borderRadius: "0.6rem",
                border: "1px solid var(--devio-neutral-2)",
                backgroundColor: "var(--devio-white)",
                color: "var(--devio-blue-dark)",
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                backgroundColor: "var(--devio-blue-dark)",
                color: "var(--devio-white)",
                padding: "0.65rem 1.75rem",
                borderRadius: "0.6rem",
                fontSize: "0.85rem",
                fontWeight: 800,
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(27, 48, 71, 0.2)",
                opacity: isSaving ? 0.7 : 1,
              }}
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 size={16} style={{ color: "var(--devio-green)" }} /> ¡Guardado!
                </>
              ) : (
                <>
                  <Save size={16} /> Guardar Cambios
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SUB-MODAL: CAMBIAR PRECIO INDIVIDUAL */}
      {/* ------------------------------------------------------------------ */}
      {showChangePriceSubModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(10, 25, 41, 0.55)",
            backdropFilter: "blur(3px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10001,
            padding: "1rem",
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "1.1rem",
              width: "100%",
              maxWidth: "460px",
              padding: "1.75rem",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--devio-blue-dark)", margin: 0 }}>
                Ajustar Precio de la Unidad {unitNumber}
              </h3>
              <button
                type="button"
                onClick={() => setShowChangePriceSubModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--devio-neutral-3)" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveIndividualPriceChange} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--devio-blue-dark)", marginBottom: "0.35rem" }}>
                  Nuevo Precio de Lista *
                </label>
                <CurrencyInput
                  value={newPriceInput}
                  onChange={(val) => setNewPriceInput(val)}
                  currencySymbol="$"
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--devio-blue-dark)", marginBottom: "0.35rem" }}>
                  Motivo del Cambio *
                </label>
                <input
                  type="text"
                  required
                  value={priceReasonInput}
                  onChange={(e) => setPriceReasonInput(e.target.value)}
                  placeholder="Ej. Ajuste inflacionario / Nueva lista preventa"
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.85rem",
                    borderRadius: "0.6rem",
                    border: "1.5px solid var(--devio-neutral-2)",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "var(--devio-blue-dark)",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowChangePriceSubModal(false)}
                  style={{
                    padding: "0.6rem 1.1rem",
                    borderRadius: "0.5rem",
                    border: "1px solid var(--devio-neutral-2)",
                    backgroundColor: "var(--devio-white)",
                    color: "var(--devio-blue-dark)",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    backgroundColor: "var(--devio-blue-dark)",
                    color: "var(--devio-white)",
                    padding: "0.6rem 1.25rem",
                    borderRadius: "0.5rem",
                    fontSize: "0.82rem",
                    fontWeight: 800,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <Save size={14} /> Aplicar Precio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SUB-MODAL: CONFIRMACIÓN MARCAR COMO DISPONIBLE */}
      {/* ------------------------------------------------------------------ */}
      {showMarkAvailableModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(10, 25, 41, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10002,
            padding: "1rem",
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "1.25rem",
              width: "100%",
              maxWidth: "460px",
              padding: "1.75rem",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)",
              textAlign: "center",
            }}
          >
            <div
              style={{
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              backgroundColor: "rgba(224, 83, 69, 0.12)",
              color: "var(--devio-red)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem auto",
            }}
          >
            <AlertTriangle size={26} />
          </div>

          <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--devio-blue-dark)", marginBottom: "0.5rem" }}>
            ¿Marcar la unidad {unitNumber} como disponible?
          </h3>

          <p style={{ fontSize: "0.82rem", color: "var(--devio-neutral-3)", lineHeight: 1.5, marginBottom: "1.5rem" }}>
            Al marcar esta unidad como disponible se liberará en el inventario comercial activo y se desvinculará el cliente asociado.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={() => setShowMarkAvailableModal(false)}
              style={{
                padding: "0.6rem 1.25rem",
                borderRadius: "0.5rem",
                border: "1px solid var(--devio-neutral-2)",
                backgroundColor: "var(--devio-white)",
                color: "var(--devio-blue-dark)",
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmMarkAvailable}
              style={{
                padding: "0.6rem 1.25rem",
                borderRadius: "0.5rem",
                border: "none",
                backgroundColor: "var(--devio-red)",
                color: "var(--devio-white)",
                fontSize: "0.85rem",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Sí, Marcar como Disponible
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}
