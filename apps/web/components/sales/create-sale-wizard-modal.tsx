"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  Calendar,
  DollarSign,
  User,
  Building2,
  PackagePlus,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Upload,
  Sparkles,
  RefreshCw,
  Plus,
  Trash2,
  Mail,
  Phone,
  Hash,
  Layers,
  ArrowRight,
  Sliders,
  AlertCircle,
  Users,
  Edit2,
  Info
} from "lucide-react";
import { DevioDatePicker } from "../ui/devio-date-picker";
import PhoneInput from "../ui/phone-input";
import CurrencyInput from "../ui/currency-input";
import { CoOwner, ProjectItem, ProjectAdditional, QuoteRecord } from "../../data/projects-data";
import { useProject } from "../../context/project-context";
import { sendAndLogNotification } from "../../lib/notifications";

export interface CreateSaleWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency?: "MXN" | "USD";
  initialProjectId?: string | null;
  projects?: ProjectItem[];
  initialQuote?: QuoteRecord | null;
  onSaleCreated?: (saleData: any) => void;
}

interface PaymentRow {
  id: string;
  concept: string;
  date: string;
  amount: number;
}

interface ClientData {
  email: string;
  name: string;
  phone: string;
  rfc: string;
  isExisting: boolean;
}

interface AdditionalItem {
  id: string;
  name: string;
  price: number;
  category: "bodega" | "estacionamiento" | "acabados" | "terraza" | "otro";
}

const PRESET_CLIENTS: ClientData[] = [];

export default function CreateSaleWizardModal({
  isOpen,
  onClose,
  currency = "MXN",
  initialProjectId = "",
  projects = [],
  initialQuote = null,
  onSaleCreated,
}: CreateSaleWizardModalProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [createdSaleResult, setCreatedSaleResult] = useState<any>(null);

  // --------------------------------------------------------------------------
  // STEP 1: CLIENTE Y COPROPIEDAD
  // --------------------------------------------------------------------------
  const [isCoOwnership, setIsCoOwnership] = useState<boolean>(false);

  // Primary Client
  const [primaryClient, setPrimaryClient] = useState<CoOwner>({
    id: "primary-1",
    name: "",
    email: "",
    phone: "",
    rfc: "",
    ownershipPct: 100,
    isPrimary: true,
    relationship: "Titular Principal",
  });
  const [isPrimaryFound, setIsPrimaryFound] = useState(false);

  // Additional Co-owners list
  const [coOwnersList, setCoOwnersList] = useState<CoOwner[]>([]);

  // Collect existing clients across all projects dynamically
  const existingClients = useMemo(() => {
    const clientsMap: Record<string, ClientData> = {};

    projects.forEach((p) => {
      // 1. From real sales records
      (p.sales || []).forEach((s) => {
        if (s.clientName && s.clientName.trim()) {
          const key = (s.clientEmail || s.clientName).toLowerCase();
          clientsMap[key] = {
            name: s.clientName,
            email: s.clientEmail || "",
            phone: s.clientPhone || "",
            rfc: s.clientRfc || "",
            isExisting: true,
          };
        }
        (s.coOwners || []).forEach((co) => {
          if (co.name && co.name.trim()) {
            const coKey = (co.email || co.name).toLowerCase();
            clientsMap[coKey] = {
              name: co.name,
              email: co.email || "",
              phone: co.phone || "",
              rfc: co.rfc || "",
              isExisting: true,
            };
          }
        });
      });

      // 2. From unitsInventory
      (p.unitsInventory || []).forEach((u) => {
        if (u.client && u.client !== "-" && u.client !== "Sin asignar") {
          const key = u.client.toLowerCase();
          if (!clientsMap[key]) {
            clientsMap[key] = {
              name: u.client,
              email: (u as any).clientEmail || "",
              phone: (u as any).clientPhone || "",
              rfc: (u as any).clientRfc || "",
              isExisting: true,
            };
          }
        }
        (u.coOwners || []).forEach((co) => {
          if (co.name && co.name.trim()) {
            const coKey = (co.email || co.name).toLowerCase();
            clientsMap[coKey] = {
              name: co.name,
              email: co.email || "",
              phone: co.phone || "",
              rfc: co.rfc || "",
              isExisting: true,
            };
          }
        });
      });
    });

    return Object.values(clientsMap);
  }, [projects]);

  // Primary client email/name lookup & autofill
  useEffect(() => {
    if (!primaryClient.email && !primaryClient.name) {
      setIsPrimaryFound(false);
      return;
    }
    const trimmedEmail = primaryClient.email.trim().toLowerCase();
    const trimmedName = primaryClient.name.trim().toLowerCase();
    const found = existingClients.find(
      (c) =>
        (trimmedEmail && c.email && c.email.toLowerCase() === trimmedEmail) ||
        (trimmedName && c.name && c.name.toLowerCase() === trimmedName)
    );
    if (found) {
      setIsPrimaryFound(true);
      setPrimaryClient((prev) => ({
        ...prev,
        name: prev.name || found.name,
        email: prev.email || found.email,
        phone: prev.phone || found.phone,
        rfc: prev.rfc || found.rfc,
      }));
    } else {
      setIsPrimaryFound(false);
    }
  }, [primaryClient.email, primaryClient.name, existingClients]);

  const isClientInCatalog = (email: string, name: string) => {
    const trimmedEmail = (email || "").trim().toLowerCase();
    const trimmedName = (name || "").trim().toLowerCase();
    if (!trimmedEmail && !trimmedName) return false;
    return existingClients.some(
      (c) =>
        (trimmedEmail && c.email && c.email.toLowerCase() === trimmedEmail) ||
        (trimmedName && c.name && c.name.toLowerCase() === trimmedName)
    );
  };

  const hasAnyNewBuyer = useMemo(() => {
    const primaryIsNew = !isPrimaryFound && !isClientInCatalog(primaryClient.email, primaryClient.name);
    if (!isCoOwnership) {
      return primaryIsNew;
    }
    const anyCoOwnerNew = coOwnersList.some(
      (co) => (co.email || co.name) && !isClientInCatalog(co.email, co.name)
    );
    return primaryIsNew || anyCoOwnerNew;
  }, [primaryClient, isPrimaryFound, isCoOwnership, coOwnersList, existingClients]);

  // Handle co-ownership switch toggle
  const handleToggleCoOwnership = (enabled: boolean) => {
    setIsCoOwnership(enabled);
    if (enabled) {
      if (coOwnersList.length === 0) {
        setPrimaryClient((prev) => ({ ...prev, ownershipPct: 50 }));
        setCoOwnersList([
          {
            id: `co-${Date.now()}`,
            name: "",
            email: "",
            phone: "",
            rfc: "",
            ownershipPct: 50,
            isPrimary: false,
            relationship: "Copropietario",
          },
        ]);
      }
    } else {
      setPrimaryClient((prev) => ({ ...prev, ownershipPct: 100 }));
      setCoOwnersList([]);
    }
  };

  // Add new co-owner
  const handleAddCoOwner = () => {
    const newId = `co-${Date.now()}`;
    const newCoOwner: CoOwner = {
      id: newId,
      name: "",
      email: "",
      phone: "",
      rfc: "",
      ownershipPct: 0,
      isPrimary: false,
      relationship: "Copropietario",
    };
    const updated = [...coOwnersList, newCoOwner];
    setCoOwnersList(updated);
    distributeEqually(primaryClient, updated);
  };

  // Remove co-owner
  const handleRemoveCoOwner = (id: string) => {
    const filtered = coOwnersList.filter((co) => co.id !== id);
    setCoOwnersList(filtered);
    if (filtered.length === 0) {
      setIsCoOwnership(false);
      setPrimaryClient((prev) => ({ ...prev, ownershipPct: 100 }));
    } else {
      distributeEqually(primaryClient, filtered);
    }
  };

  // Update co-owner field
  const handleUpdateCoOwner = (id: string, field: keyof CoOwner, val: any) => {
    setCoOwnersList((prev) =>
      prev.map((co) => {
        if (co.id !== id) return co;
        const updated = { ...co, [field]: val };
        return updated;
      })
    );
  };

  // Distribute equally helper
  const distributeEqually = (prim: CoOwner, coList: CoOwner[]) => {
    const totalPeople = 1 + coList.length;
    const basePct = Math.floor(100 / totalPeople);
    const remainder = 100 - basePct * totalPeople;

    setPrimaryClient((prev) => ({ ...prev, ownershipPct: basePct + remainder }));
    setCoOwnersList((prev) =>
      prev.map((co) => ({ ...co, ownershipPct: basePct }))
    );
  };

  // Calculate total ownership percentage
  const totalOwnershipPct = useMemo(() => {
    const primaryPct = Number(primaryClient.ownershipPct) || 0;
    const coOwnersPct = coOwnersList.reduce((acc, c) => acc + (Number(c.ownershipPct) || 0), 0);
    return Math.round((primaryPct + coOwnersPct) * 100) / 100;
  }, [primaryClient.ownershipPct, coOwnersList]);

  const isOwnershipBalanced = Math.abs(totalOwnershipPct - 100) < 0.01;

  // All owners combined
  const allOwnersCombined = useMemo(() => {
    return [primaryClient, ...coOwnersList];
  }, [primaryClient, coOwnersList]);

  // --------------------------------------------------------------------------
  // STEP 2: PROYECTO Y UNIDAD
  // --------------------------------------------------------------------------
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    initialProjectId || projects[0]?.id || ""
  );
  const [selectedUnitNumber, setSelectedUnitNumber] = useState<string>("");
  const [unitEstimatedDelivery, setUnitEstimatedDelivery] = useState<string>("");
  const [unitCustomArea, setUnitCustomArea] = useState<number>(0);
  const [unitCustomPrice, setUnitCustomPrice] = useState<number>(0);

  const currentProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || projects[0] || null;
  }, [projects, selectedProjectId]);

  const availableUnits = useMemo(() => {
    if (!currentProject) return [];
    return (currentProject.unitsInventory || []).filter((u) => u.status === "DISPONIBLE");
  }, [currentProject]);

  useEffect(() => {
    if (availableUnits.length > 0) {
      if (!availableUnits.some((u) => u.unit === selectedUnitNumber)) {
        const firstUnit = availableUnits[0];
        if (firstUnit) {
          setSelectedUnitNumber(firstUnit.unit);
          setUnitCustomArea(firstUnit.areaM2);
          setUnitCustomPrice(firstUnit.price);
          setUnitEstimatedDelivery((firstUnit as any).deliveryDate || "");
        }
      }
    } else {
      setSelectedUnitNumber("");
      setUnitCustomArea(0);
      setUnitCustomPrice(0);
    }
  }, [availableUnits, selectedUnitNumber]);

  useEffect(() => {
    const unitObj = availableUnits.find((u) => u.unit === selectedUnitNumber);
    if (unitObj) {
      setUnitCustomArea(unitObj.areaM2);
      setUnitCustomPrice(unitObj.price);
      if ((unitObj as any).deliveryDate) {
        setUnitEstimatedDelivery((unitObj as any).deliveryDate);
      }
    }
  }, [selectedUnitNumber, availableUnits]);

  // --------------------------------------------------------------------------
  // STEP 3: ADICIONALES
  // --------------------------------------------------------------------------
  const availableAdditionalsPool = useMemo<AdditionalItem[]>(() => {
    if (!currentProject || !currentProject.additionals) return [];
    return currentProject.additionals
      .filter((a) => a.status === "DISPONIBLE" || !a.status)
      .map((a) => ({
        id: a.id,
        name: a.name,
        price: a.price,
        category: a.category,
      }));
  }, [currentProject]);

  const [selectedAdditionals, setSelectedAdditionals] = useState<AdditionalItem[]>([]);

  const totalAdditionalsAmount = useMemo(() => {
    return selectedAdditionals.reduce((acc, item) => acc + item.price, 0);
  }, [selectedAdditionals]);

  const totalSaleAmount = useMemo(() => {
    return unitCustomPrice + totalAdditionalsAmount;
  }, [unitCustomPrice, totalAdditionalsAmount]);

  // --------------------------------------------------------------------------
  // STEP 4: PLAN DE PAGO
  // --------------------------------------------------------------------------
  const { paymentPlans = [], addSale, updateQuote } = useProject();
  const activeDeveloperPlans = useMemo(() => paymentPlans.filter((p) => p.isActive), [paymentPlans]);

  const [selectedPlanId, setSelectedPlanId] = useState<string>("custom");
  const [customPlanName, setCustomPlanName] = useState("Plan Personalizado de Venta");
  const [paymentType, setPaymentType] = useState<"ESQUEMA" | "CONTADO">("ESQUEMA");
  const [saleDate, setSaleDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [monthlyCutoffDay, setMonthlyCutoffDay] = useState<number>(() => new Date().getDate());
  const [discountPct, setDiscountPct] = useState(0);
  const [discountAppliesTo, setDiscountAppliesTo] = useState<"total" | "unit_only">("total");
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [installmentsCount, setInstallmentsCount] = useState(12);
  const [periodicity, setPeriodicity] = useState<string>("Mensual");
  const [balloonLiquidationPct, setBalloonLiquidationPct] = useState(30);
  const [interestPct, setInterestPct] = useState<number>(0);
  const [internalPlanNotes, setInternalPlanNotes] = useState<string>("");

  // Pre-fill wizard state if converting from an existing QuoteRecord
  useEffect(() => {
    if (isOpen && initialQuote) {
      if (initialQuote.projectId) {
        setSelectedProjectId(initialQuote.projectId);
      }
      if (initialQuote.unit) {
        setSelectedUnitNumber(initialQuote.unit);
      }
      if (initialQuote.superficieM2) {
        setUnitCustomArea(initialQuote.superficieM2);
      }
      if (initialQuote.listPrice || initialQuote.totalQuoteAmount) {
        setUnitCustomPrice(initialQuote.listPrice || initialQuote.totalQuoteAmount);
      }
      if (initialQuote.deliveryDate) {
        setUnitEstimatedDelivery(initialQuote.deliveryDate);
      }

      // Pre-fill Primary Client
      setPrimaryClient({
        id: "primary-1",
        name: initialQuote.clientName || "",
        email: initialQuote.clientEmail || "",
        phone: initialQuote.clientPhone || "",
        rfc: initialQuote.clientRfc || "",
        ownershipPct: 100,
        isPrimary: true,
        relationship: "Titular Principal",
      });

      // Pre-fill Payment Plan & Terms (fully editable)
      setSelectedPlanId("custom");
      setCustomPlanName(initialQuote.planName || "Plan Cotizado");
      setPaymentType("ESQUEMA");
      setDownPaymentPct(initialQuote.downPaymentPct ?? 20);
      setInstallmentsCount(initialQuote.installmentsCount ?? 12);
      setPeriodicity(initialQuote.periodicity || "Mensual");
      setBalloonLiquidationPct(initialQuote.settlementPct ?? 30);
      setDiscountPct(initialQuote.discountPct ?? 0);

      // Pre-fill Additionals if any
      if (initialQuote.additionals && initialQuote.additionals.length > 0) {
        setSelectedAdditionals(
          initialQuote.additionals.map((a, idx) => ({
            id: a.id || `quote-addon-${idx}-${Date.now()}`,
            name: a.name,
            price: a.price,
            category: "otro",
          }))
        );
      }
    }
  }, [isOpen, initialQuote]);

  // Modal para personalizar plan de pago exclusivo de la venta
  const [isCustomPlanModalOpen, setIsCustomPlanModalOpen] = useState(false);
  const [customModalForm, setCustomModalForm] = useState({
    name: "Plan Personalizado de Venta",
    paymentType: "ESQUEMA" as "ESQUEMA" | "CONTADO",
    downPaymentPercentage: 20,
    installmentsCount: 12,
    periodicity: "Mensual",
    settlementPercentage: 30,
    discountPercentage: 0,
    interestPercentage: 0,
    internalNotes: "",
  });

  // Initialize with first active developer plan if available (only if no initialQuote)
  useEffect(() => {
    if (!initialQuote && activeDeveloperPlans.length > 0 && selectedPlanId === "custom" && customPlanName === "Plan Personalizado de Venta") {
      const firstPlan = activeDeveloperPlans[0];
      if (firstPlan) {
        setSelectedPlanId(firstPlan.id);
        setCustomPlanName(firstPlan.name);
        setPaymentType("ESQUEMA");
        setDownPaymentPct(firstPlan.downPaymentPct);
        setInstallmentsCount(firstPlan.installmentsCount);
        setPeriodicity("Mensual");
        setBalloonLiquidationPct(firstPlan.balloonLiquidationPct);
        setDiscountPct(firstPlan.discountPct);
      }
    }
  }, [activeDeveloperPlans, initialQuote]);

  const [paymentSchedule, setPaymentSchedule] = useState<PaymentRow[]>([]);

  const discountAmount = useMemo(() => {
    if (discountPct <= 0) return 0;
    const base = discountAppliesTo === "unit_only" ? unitCustomPrice : totalSaleAmount;
    return Math.round(base * (discountPct / 100) * 100) / 100;
  }, [discountPct, discountAppliesTo, unitCustomPrice, totalSaleAmount]);

  const netTotalSaleAmount = useMemo(() => {
    return Math.max(0, Math.round((totalSaleAmount - discountAmount) * 100) / 100);
  }, [totalSaleAmount, discountAmount]);

  const parseYearMonthDay = (dateStr: string) => {
    if (!dateStr) {
      const d = new Date();
      return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
    }
    if (dateStr.includes("-")) {
      const parts = dateStr.split("-").map(Number);
      if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
        if (parts[0] > 1000) {
          return { year: parts[0], month: parts[1] - 1, day: parts[2] };
        } else {
          return { year: parts[2], month: parts[1] - 1, day: parts[0] };
        }
      }
    }
    if (dateStr.includes("/")) {
      const parts = dateStr.split("/").map(Number);
      if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
        return { year: parts[2], month: parts[1] - 1, day: parts[0] };
      }
    }
    const d = new Date(dateStr);
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
  };

  const formatDateISO = (year: number, monthIndex: number, day: number) => {
    const d = new Date(year, monthIndex, day, 12, 0, 0);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dayStr = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dayStr}`;
  };

  // Helper de cálculo de fechas de cuotas según periodicidad
  const calculateInstallmentDate = (baseDateStr: string, index: number, period: string, cutoffDay?: number) => {
    const { year, month, day } = parseYearMonthDay(baseDateStr);
    const safeDay = cutoffDay && cutoffDay > 0 ? Math.min(cutoffDay, 28) : day;

    if (period === "Semanal") {
      const d = new Date(year, month, day + index * 7);
      return formatDateISO(d.getFullYear(), d.getMonth(), d.getDate());
    } else if (period === "Quincenal") {
      const d = new Date(year, month, day + index * 15);
      return formatDateISO(d.getFullYear(), d.getMonth(), d.getDate());
    } else if (period === "Bimestral") {
      return formatDateISO(year, month + index * 2, safeDay);
    } else if (period === "Trimestral") {
      return formatDateISO(year, month + index * 3, safeDay);
    } else if (period === "Semestral") {
      return formatDateISO(year, month + index * 6, safeDay);
    } else if (period === "Anual") {
      return formatDateISO(year + index, month, safeDay);
    } else {
      // Mensual por default
      return formatDateISO(year, month + index, safeDay);
    }
  };

  // Validación de plan para el modal de personalización
  const modalPlanValidation = useMemo(() => {
    if (customModalForm.paymentType === "CONTADO") {
      return {
        isValid: customModalForm.name.trim().length > 0,
        errorTitle: customModalForm.name.trim().length === 0 ? "Nombre requerido" : null,
        errorMessage: customModalForm.name.trim().length === 0 ? "Ingresa un nombre para identificar este plan de contado." : null,
        fixes: [] as { label: string; action: () => void }[],
        downPct: 100,
        installmentsPct: 0,
        settlementPct: 0,
        totalPct: 100,
      };
    }

    const down = Number(customModalForm.downPaymentPercentage) || 0;
    const settlement = Number(customModalForm.settlementPercentage) || 0;
    const plazos = Number(customModalForm.installmentsCount) || 0;
    const sumDownSettlement = down + settlement;
    const remainingPct = 100 - sumDownSettlement;
    const totalPct = down + (plazos > 0 ? Math.max(0, remainingPct) : 0) + settlement;

    if (!customModalForm.name.trim()) {
      return {
        isValid: false,
        errorTitle: "Nombre requerido",
        errorMessage: "Ingresa un nombre descriptivo para identificar este esquema de pago.",
        fixes: [
          {
            label: "Nombrar como 'Plan Personalizado'",
            action: () => setCustomModalForm((prev) => ({ ...prev, name: "Plan Personalizado" })),
          },
        ],
        downPct: down,
        installmentsPct: Math.max(0, remainingPct),
        settlementPct: settlement,
        totalPct,
      };
    }

    if (down <= 0) {
      return {
        isValid: false,
        errorTitle: "Enganche requerido",
        errorMessage: "El enganche debe ser mayor a 0% para el esquema de financiamiento.",
        fixes: [
          {
            label: "Asignar 20% de Enganche",
            action: () => setCustomModalForm((prev) => ({ ...prev, downPaymentPercentage: 20, settlementPercentage: Math.min(prev.settlementPercentage, 80) })),
          },
        ],
        downPct: down,
        installmentsPct: Math.max(0, remainingPct),
        settlementPct: settlement,
        totalPct,
      };
    }

    if (sumDownSettlement > 100) {
      const excess = sumDownSettlement - 100;
      return {
        isValid: false,
        errorTitle: "Porcentajes excedidos (>100%)",
        errorMessage: `El Enganche (${down}%) y la Liquidación (${settlement}%) suman ${sumDownSettlement}%, excediendo el 100% total por ${excess}%.`,
        fixes: [
          {
            label: `Ajustar Liquidación a ${Math.max(0, 100 - down)}%`,
            action: () => setCustomModalForm((prev) => ({ ...prev, settlementPercentage: Math.max(0, 100 - down) })),
          },
          {
            label: `Ajustar Enganche a ${Math.max(0, 100 - settlement)}%`,
            action: () => setCustomModalForm((prev) => ({ ...prev, downPaymentPercentage: Math.max(0, 100 - settlement) })),
          },
          {
            label: `Distribuir: ${down}% Enganche / ${Math.floor((100 - down) / 2)}% Cuotas / ${100 - down - Math.floor((100 - down) / 2)}% Liquidación`,
            action: () => {
              const half = Math.floor((100 - down) / 2);
              setCustomModalForm((prev) => ({
                ...prev,
                settlementPercentage: 100 - down - half,
                installmentsCount: plazos > 0 ? plazos : 12,
              }));
            },
          },
        ],
        downPct: down,
        installmentsPct: remainingPct,
        settlementPct: settlement,
        totalPct: sumDownSettlement,
      };
    }

    if (sumDownSettlement === 100 && plazos > 0) {
      return {
        isValid: false,
        errorTitle: "Plazos sin porcentaje asignado (0%)",
        errorMessage: `Definiste ${plazos} parcialidades, pero el Enganche (${down}%) y la Liquidación (${settlement}%) ya suman el 100%. No queda porcentaje para parcialidades.`,
        fixes: [
          {
            label: `Reducir Liquidación para dejar 40% en ${plazos} cuotas (${(40 / plazos).toFixed(1)}% c/u)`,
            action: () => setCustomModalForm((prev) => ({ ...prev, settlementPercentage: Math.max(0, 100 - down - 40) })),
          },
          {
            label: "Cambiar Cuotas a 0 (Solo Enganche y Liquidación)",
            action: () => setCustomModalForm((prev) => ({ ...prev, installmentsCount: 0 })),
          },
        ],
        downPct: down,
        installmentsPct: 0,
        settlementPct: settlement,
        totalPct: 100,
      };
    }

    if (sumDownSettlement < 100 && plazos === 0) {
      return {
        isValid: false,
        errorTitle: "Porcentaje flotante sin cuotas",
        errorMessage: `Queda un ${remainingPct}% pendiente de asignar porque el número de parcialidades es 0.`,
        fixes: [
          {
            label: `Sumar ${remainingPct}% a la Liquidación (Total: ${settlement + remainingPct}%)`,
            action: () => setCustomModalForm((prev) => ({ ...prev, settlementPercentage: 100 - down })),
          },
          {
            label: `Asignar 12 cuotas para cubrir el ${remainingPct}% (${(remainingPct / 12).toFixed(1)}% c/u)`,
            action: () => setCustomModalForm((prev) => ({ ...prev, installmentsCount: 12 })),
          },
        ],
        downPct: down,
        installmentsPct: remainingPct,
        settlementPct: settlement,
        totalPct: sumDownSettlement,
      };
    }

    return {
      isValid: true,
      errorTitle: null,
      errorMessage: null,
      fixes: [] as { label: string; action: () => void }[],
      downPct: down,
      installmentsPct: remainingPct,
      settlementPct: settlement,
      totalPct: 100,
    };
  }, [customModalForm]);

  // Cálculos de validación en tiempo real para el plan activo de la venta
  const planValidation = useMemo(() => {
    if (paymentType === "CONTADO") {
      return {
        isValid: true,
        errorTitle: null,
        errorMessage: null,
        fixes: [] as { label: string; action: () => void }[],
        downPct: 100,
        installmentsPct: 0,
        settlementPct: 0,
        totalPct: 100,
      };
    }

    const down = Number(downPaymentPct) || 0;
    const settlement = Number(balloonLiquidationPct) || 0;
    const plazos = Number(installmentsCount) || 0;
    const sumDownSettlement = down + settlement;
    const remainingPct = 100 - sumDownSettlement;
    const totalPct = down + (plazos > 0 ? Math.max(0, remainingPct) : 0) + settlement;

    if (down <= 0) {
      return {
        isValid: false,
        errorTitle: "Enganche requerido",
        errorMessage: "El enganche debe ser mayor a 0% para el esquema de pago.",
        fixes: [
          {
            label: "Asignar 20% de Enganche",
            action: () => {
              setDownPaymentPct(20);
              setBalloonLiquidationPct((prev) => Math.min(prev, 80));
              setSelectedPlanId("custom");
              setCustomPlanName("Plan Personalizado");
            },
          },
        ],
        downPct: down,
        installmentsPct: Math.max(0, remainingPct),
        settlementPct: settlement,
        totalPct,
      };
    }

    if (sumDownSettlement > 100) {
      const excess = sumDownSettlement - 100;
      return {
        isValid: false,
        errorTitle: "Porcentajes excedidos (>100%)",
        errorMessage: `El Enganche (${down}%) y la Liquidación (${settlement}%) suman ${sumDownSettlement}%, excediendo el 100% total por ${excess}%.`,
        fixes: [
          {
            label: `Ajustar Liquidación a ${Math.max(0, 100 - down)}%`,
            action: () => {
              setBalloonLiquidationPct(Math.max(0, 100 - down));
              setSelectedPlanId("custom");
              setCustomPlanName("Plan Personalizado");
            },
          },
          {
            label: `Ajustar Enganche a ${Math.max(0, 100 - settlement)}%`,
            action: () => {
              setDownPaymentPct(Math.max(0, 100 - settlement));
              setSelectedPlanId("custom");
              setCustomPlanName("Plan Personalizado");
            },
          },
          {
            label: `Distribuir: ${down}% Enganche / ${Math.floor((100 - down) / 2)}% Cuotas / ${100 - down - Math.floor((100 - down) / 2)}% Liquidación`,
            action: () => {
              const half = Math.floor((100 - down) / 2);
              setBalloonLiquidationPct(100 - down - half);
              setInstallmentsCount(plazos > 0 ? plazos : 12);
              setSelectedPlanId("custom");
              setCustomPlanName("Plan Personalizado");
            },
          },
        ],
        downPct: down,
        installmentsPct: remainingPct,
        settlementPct: settlement,
        totalPct: sumDownSettlement,
      };
    }

    if (sumDownSettlement === 100 && plazos > 0) {
      return {
        isValid: false,
        errorTitle: "Plazos sin porcentaje asignado (0%)",
        errorMessage: `Definiste ${plazos} cuotas, pero el Enganche (${down}%) y la Liquidación (${settlement}%) ya suman el 100%. No queda porcentaje para cuotas.`,
        fixes: [
          {
            label: `Reducir Liquidación para dejar 40% en ${plazos} cuotas (${(40 / plazos).toFixed(1)}% c/u)`,
            action: () => {
              setBalloonLiquidationPct(Math.max(0, 100 - down - 40));
              setSelectedPlanId("custom");
              setCustomPlanName("Plan Personalizado");
            },
          },
          {
            label: "Cambiar Cuotas a 0",
            action: () => {
              setInstallmentsCount(0);
              setSelectedPlanId("custom");
              setCustomPlanName("Plan Personalizado");
            },
          },
        ],
        downPct: down,
        installmentsPct: 0,
        settlementPct: settlement,
        totalPct: 100,
      };
    }

    if (sumDownSettlement < 100 && plazos === 0) {
      return {
        isValid: false,
        errorTitle: "Porcentaje flotante sin cuotas",
        errorMessage: `Queda un ${remainingPct}% pendiente de asignar porque el número de cuotas es 0.`,
        fixes: [
          {
            label: `Sumar ${remainingPct}% a la Liquidación (Total: ${settlement + remainingPct}%)`,
            action: () => {
              setBalloonLiquidationPct(100 - down);
              setSelectedPlanId("custom");
              setCustomPlanName("Plan Personalizado");
            },
          },
          {
            label: `Asignar 12 cuotas para cubrir el ${remainingPct}% (${(remainingPct / 12).toFixed(1)}% c/u)`,
            action: () => {
              setInstallmentsCount(12);
              setSelectedPlanId("custom");
              setCustomPlanName("Plan Personalizado");
            },
          },
        ],
        downPct: down,
        installmentsPct: remainingPct,
        settlementPct: settlement,
        totalPct: sumDownSettlement,
      };
    }

    return {
      isValid: true,
      errorTitle: null,
      errorMessage: null,
      fixes: [] as { label: string; action: () => void }[],
      downPct: down,
      installmentsPct: remainingPct,
      settlementPct: settlement,
      totalPct: 100,
    };
  }, [downPaymentPct, balloonLiquidationPct, installmentsCount, paymentType]);

  const generateSchedule = () => {
    const rows: PaymentRow[] = [];
    const { year, month, day: startDay } = parseYearMonthDay(saleDate);

    if (paymentType === "CONTADO") {
      rows.push({
        id: "row-contado",
        concept: "Pago de Contado (100%)",
        date: saleDate || formatDateISO(year, month, startDay),
        amount: netTotalSaleAmount,
      });
      setPaymentSchedule(rows);
      return;
    }

    const downPayment = Math.round(netTotalSaleAmount * (downPaymentPct / 100));
    const liquidation = Math.round(netTotalSaleAmount * (balloonLiquidationPct / 100));
    const remainingForInstallments = Math.max(0, netTotalSaleAmount - downPayment - liquidation);
    const installmentAmount = installmentsCount > 0 ? remainingForInstallments / installmentsCount : 0;

    // 1. Enganche row (Fecha inicial / Hoy)
    rows.push({
      id: "row-enganche",
      concept: "Enganche",
      date: saleDate || formatDateISO(year, month, startDay),
      amount: downPayment,
    });

    // 2. Parcialidades
    for (let i = 1; i <= installmentsCount; i++) {
      const formattedDate = calculateInstallmentDate(saleDate, i, periodicity, monthlyCutoffDay);
      rows.push({
        id: `row-cuota-${i}`,
        concept: `Cuota ${i} (${periodicity})`,
        date: formattedDate,
        amount: Math.round(installmentAmount * 100) / 100,
      });
    }

    // 3. Liquidación row
    if (balloonLiquidationPct > 0) {
      const deliveryDate = calculateInstallmentDate(saleDate, installmentsCount + 1, periodicity, monthlyCutoffDay);
      rows.push({
        id: "row-liquidacion",
        concept: "Liquidación Final",
        date: deliveryDate,
        amount: liquidation,
      });
    }

    setPaymentSchedule(rows);
  };

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    if (planId === "custom") {
      setCustomPlanName("Plan Personalizado de Venta");
      handleOpenCustomPlanModal();
      return;
    }
    const plan = activeDeveloperPlans.find((p) => p.id === planId);
    if (plan) {
      setPaymentType("ESQUEMA");
      setDownPaymentPct(plan.downPaymentPct);
      setInstallmentsCount(plan.installmentsCount);
      setPeriodicity("Mensual");
      setBalloonLiquidationPct(plan.balloonLiquidationPct);
      setDiscountPct(plan.discountPct);
      setCustomPlanName(plan.name);
    }
  };

  const handleOpenCustomPlanModal = () => {
    setCustomModalForm({
      name: customPlanName || "Plan Personalizado de Venta",
      paymentType: paymentType || "ESQUEMA",
      downPaymentPercentage: downPaymentPct,
      installmentsCount: installmentsCount,
      periodicity: periodicity || "Mensual",
      settlementPercentage: balloonLiquidationPct,
      discountPercentage: discountPct,
      interestPercentage: interestPct,
      internalNotes: internalPlanNotes || "",
    });
    setIsCustomPlanModalOpen(true);
  };

  const handleApplyCustomPlanFromModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalPlanValidation.isValid) return;

    setCustomPlanName(customModalForm.name.trim() || "Plan Personalizado");
    setPaymentType(customModalForm.paymentType);
    setDownPaymentPct(customModalForm.paymentType === "CONTADO" ? 100 : customModalForm.downPaymentPercentage);
    setInstallmentsCount(customModalForm.paymentType === "CONTADO" ? 0 : customModalForm.installmentsCount);
    setPeriodicity(customModalForm.periodicity);
    setBalloonLiquidationPct(customModalForm.paymentType === "CONTADO" ? 0 : customModalForm.settlementPercentage);
    setDiscountPct(customModalForm.discountPercentage);
    setInterestPct(customModalForm.interestPercentage);
    setInternalPlanNotes(customModalForm.internalNotes);
    setSelectedPlanId("custom");
    setIsCustomPlanModalOpen(false);
  };

  useEffect(() => {
    generateSchedule();
  }, [selectedPlanId, paymentType, netTotalSaleAmount, downPaymentPct, installmentsCount, periodicity, balloonLiquidationPct, discountPct, discountAppliesTo, saleDate, monthlyCutoffDay]);

  const totalScheduleSum = useMemo(() => {
    return paymentSchedule.reduce((acc, row) => acc + (Number(row.amount) || 0), 0);
  }, [paymentSchedule]);

  const scheduleDifference = useMemo(() => {
    return Math.round((netTotalSaleAmount - totalScheduleSum) * 100) / 100;
  }, [netTotalSaleAmount, totalScheduleSum]);

  const isScheduleBalanced = Math.abs(scheduleDifference) < 0.01;

  const handleAutoBalanceOnLiquidation = () => {
    if (paymentSchedule.length === 0) return;
    const diff = netTotalSaleAmount - totalScheduleSum;
    const newSchedule = [...paymentSchedule];
    const lastRowIndex = newSchedule.length - 1;
    const targetRow = newSchedule[lastRowIndex];
    if (targetRow) {
      targetRow.amount = Math.max(0, Math.round((targetRow.amount + diff) * 100) / 100);
      setPaymentSchedule(newSchedule);
    }
  };

  const handleUpdateRowAmount = (id: string, newAmount: number) => {
    setPaymentSchedule((prev) =>
      prev.map((r) => (r.id === id ? { ...r, amount: newAmount } : r))
    );
  };

  const handleUpdateRowDate = (id: string, newDate: string) => {
    setPaymentSchedule((prev) =>
      prev.map((r) => (r.id === id ? { ...r, date: newDate } : r))
    );
  };

  // Bulk update all monthly dates to a specific cutoff day
  const handleBulkCutoffDayChange = (newDay: number) => {
    setMonthlyCutoffDay(newDay);
    const { year, month } = parseYearMonthDay(saleDate);
    const safeDay = Math.min(Math.max(1, newDay), 28);

    setPaymentSchedule((prev) =>
      prev.map((row, idx) => {
        if (idx === 0) return row; // Keep down payment date
        if (row.id === "row-liquidacion") {
          return { ...row, date: calculateInstallmentDate(saleDate, installmentsCount + 1, periodicity, safeDay) };
        }
        return { ...row, date: calculateInstallmentDate(saleDate, idx, periodicity, safeDay) };
      })
    );
  };

  // --------------------------------------------------------------------------
  // STEP 5: PAGO INICIAL Y CONFIRMACIÓN
  // --------------------------------------------------------------------------
  type InitialPaymentOption = "FULL" | "PARTIAL" | "NONE";
  const [initialPaymentOption, setInitialPaymentOption] = useState<InitialPaymentOption>("FULL");
  const [initialPaymentAmount, setInitialPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("transferencia");
  const [paymentReference, setPaymentReference] = useState<string>("");
  const [sendCredentialsToAll, setSendCredentialsToAll] = useState<boolean>(true);
  const [sendSaleConfirmationEmail, setSendSaleConfirmationEmail] = useState<boolean>(true);
  const [sendReceiptEmail, setSendReceiptEmail] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (paymentSchedule.length > 0 && paymentSchedule[0]) {
      if (initialPaymentOption === "FULL") {
        setInitialPaymentAmount(paymentSchedule[0].amount);
      }
    }
  }, [paymentSchedule, initialPaymentOption]);

  // --------------------------------------------------------------------------
  // FINALIZE SALE
  // --------------------------------------------------------------------------
  const handleCompleteSale = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const targetProjId = selectedProjectId || currentProject?.id || projects[0]?.id || "p-1";
      const clientTargetId = primaryClient.id || "primary-1";

      // Register / persist new users in devio_system_users
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("devio_system_users") || sessionStorage.getItem("devio_system_users");
          let usersList: any[] = [];
          if (stored) {
            usersList = JSON.parse(stored);
          }

          allOwnersCombined.forEach((owner) => {
            if (!owner.email) return;
            const existingIdx = usersList.findIndex((u) => u.email?.toLowerCase() === owner.email.toLowerCase());
            if (existingIdx === -1) {
              // Create new system user account for client portal & mobile app
              usersList.push({
                id: owner.id || `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                name: owner.name,
                email: owner.email,
                phone: owner.phone,
                rfc: owner.rfc,
                role: "CLIENT",
                status: "ACTIVO",
                portalAccess: true,
                mobileAppAccess: true,
                sendCredentialsEmail: true,
                initialDeveloperRegistration: {
                  name: owner.name,
                  email: owner.email,
                  phone: owner.phone,
                  rfc: owner.rfc,
                  projectId: targetProjId,
                  projectName: currentProject?.name || "Proyecto",
                  registeredAt: new Date().toISOString(),
                },
                createdAt: new Date().toISOString(),
              });
            }
          });

          localStorage.setItem("devio_system_users", JSON.stringify(usersList));
          sessionStorage.setItem("devio_system_users", JSON.stringify(usersList));
        } catch (err) {
          console.error("Error saving client users to devio_system_users:", err);
        }
      }

      const finalSalePayload = {
        folio: `VTA-2026-${Math.floor(100 + Math.random() * 900)}`,
        createdAt: new Date().toISOString(),
        client: {
          id: clientTargetId,
          email: primaryClient.email,
          name: primaryClient.name,
          phone: primaryClient.phone,
          rfc: primaryClient.rfc,
        },
        isCoOwnership,
        coOwners: allOwnersCombined,
        project: {
          id: targetProjId,
          name: currentProject?.name || "Proyecto",
        },
        unit: {
          number: selectedUnitNumber,
          price: unitCustomPrice,
          areaM2: unitCustomArea,
          estimatedDelivery: unitEstimatedDelivery,
        },
        additionals: selectedAdditionals,
        financials: {
          unitPrice: unitCustomPrice,
          additionalsTotal: totalAdditionalsAmount,
          grossTotalSale: totalSaleAmount,
          discountPct,
          discountAppliesTo,
          discountAmount,
          totalSale: netTotalSaleAmount,
          netTotalSale: netTotalSaleAmount,
          paymentType,
          downPaymentPct,
          installmentsCount,
          periodicity,
          balloonLiquidationPct,
          interestPct,
          planName: customPlanName || (selectedPlanId === "custom" ? "Plan Personalizado" : selectedPlanId),
        },
        schedule: paymentSchedule.map((row, idx) => ({
          id: `inst-${selectedUnitNumber || "unit"}-${row.id || idx}`,
          concept: row.concept,
          date: row.date,
          scheduledDate: row.date,
          amount: row.amount,
          scheduledAmount: row.amount,
        })),
        quoteId: initialQuote?.id,
        initialPayment: {
          registered: initialPaymentOption !== "NONE",
          option: initialPaymentOption,
          amount: initialPaymentOption === "NONE" ? 0 : initialPaymentAmount,
          method: initialPaymentOption === "NONE" ? undefined : paymentMethod,
          reference: initialPaymentOption === "NONE" ? undefined : paymentReference,
          sendCredentialsToAll,
          sendSaleConfirmationEmail,
          sendReceiptEmail: initialPaymentOption !== "NONE" && sendReceiptEmail,
        },
      };

      if (addSale) {
        addSale(finalSalePayload);
      }

      if (initialQuote && updateQuote) {
        updateQuote(targetProjId, initialQuote.id, {
          status: "CONVERTIDA_A_VENTA",
        });
      }

      setCreatedSaleResult(finalSalePayload);
      if (onSaleCreated) {
        onSaleCreated(finalSalePayload);
      }

      // ----------------------------------------------------------------------
      // Dispatch Real Email Notifications & Audit Logs via Postmark API
      // ----------------------------------------------------------------------
      allOwnersCombined.forEach(async (owner) => {
        if (!owner.email) return;
        const tempPassword = `Devio-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        const loginLink = typeof window !== "undefined" ? `${window.location.origin}/login` : "https://devio.lat/login";
        const projName = currentProject?.name || "Proyecto Inmobiliario";
        const devName = currentProject?.name ? `${currentProject.name} (Desarrolladora)` : "Desarrolladora Inmobiliaria";

        const projLogo =
          currentProject?.image && currentProject.image.startsWith("http")
            ? currentProject.image
            : "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398492782x453733136803679400/lirica.jpeg";
        const devLogo =
          "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398110026x731242031517065300/grupo_veq_logo.jpeg";

        // 1. Envío obligatorio de credenciales de acceso al portal de clientes
        sendAndLogNotification({
          to: owner.email,
          templateAlias: "bienvenida-cliente",
          templateModel: {
            nombre: owner.name,
            correo: owner.email,
            password_temporal: tempPassword,
            login_link: loginLink,
            proyecto: projName,
            unidad: selectedUnitNumber,
            desarrolladora: devName,
            logo_proyecto: projLogo,
            logo_desarrolladora: devLogo,
            año: new Date().getFullYear().toString(),
          },
          triggerKey: "auth.welcome_client",
          triggerName: "Bienvenida y Credenciales Portal Cliente",
          recipientName: owner.name,
          developerName: devName,
          channel: "POSTMARK",
        });

        // 2. Envío de confirmación de venta y asignación de unidad
        if (sendSaleConfirmationEmail) {
          sendAndLogNotification({
            to: owner.email,
            templateAlias: "alta-unidad",
            templateModel: {
              nombre: owner.name,
              correo: owner.email,
              proyecto: projName,
              unidad: selectedUnitNumber,
              tipo: currentProject?.type || "Departamento",
              fecha_entrega: unitEstimatedDelivery || "Mayo 2028",
              login_link: loginLink,
              desarrolladora: devName,
              logo_proyecto: projLogo,
              logo_desarrolladora: devLogo,
              año: new Date().getFullYear().toString(),
            },
            triggerKey: "sales.unit_assigned",
            triggerName: "Asignación de Unidad Formalizada",
            recipientName: owner.name,
            developerName: devName,
            channel: "POSTMARK",
          });
        }

        // 3. Envío de recibo de pago de enganche inicial si se registró pago
        if (initialPaymentOption !== "NONE" && sendReceiptEmail) {
          sendAndLogNotification({
            to: owner.email,
            templateAlias: "recibo-pago",
            templateModel: {
              nombre: owner.name,
              correo: owner.email,
              proyecto: projName,
              unidad: selectedUnitNumber,
              folio_recibo: "REC-2026-001",
              monto_pagado: formatMoney(initialPaymentAmount),
              concepto: "Pago de Enganche Inicial",
              metodo_pago:
                paymentMethod === "transferencia"
                  ? "Transferencia SPEI"
                  : paymentMethod === "cheque"
                  ? "Cheque de Caja"
                  : "Depósito Bancario",
              fecha_pago: new Date().toLocaleDateString("es-MX"),
              saldo_pendiente: formatMoney(Math.max(0, netTotalSaleAmount - initialPaymentAmount)),
              desarrolladora: devName,
              logo_proyecto: projLogo,
              logo_desarrolladora: devLogo,
              año: new Date().getFullYear().toString(),
            },
            triggerKey: "payments.payment_receipt",
            triggerName: "Recibo de Pago de Enganche",
            recipientName: owner.name,
            developerName: devName,
            channel: "POSTMARK",
          });
        }
      });

      onClose();
      router.push(`/projects/${targetProjId}/clients/${clientTargetId}`);
    }, 700);
  };

  if (!isOpen) return null;

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const stepsList = [
    { num: 1, label: "Cliente / Copropiedad" },
    { num: 2, label: "Proyecto y Unidad" },
    { num: 3, label: "Adicionales" },
    { num: 4, label: "Plan de Pago" },
    { num: 5, label: "Pago Inicial" },
  ];

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
        {/* ================================================================== */}
        {/* HEADER & STEPPER */}
        {/* ================================================================== */}
        <div
          style={{
            padding: "1.25rem 1.75rem 1rem 1.75rem",
            borderBottom: "1px solid var(--devio-neutral-1)",
            backgroundColor: "#FAFBFD",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
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
                <CreditCard size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--devio-blue-dark)", margin: 0, letterSpacing: "-0.02em" }}>
                  Crear Nueva Venta
                </h2>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "2px" }}>
                  <span style={{ fontSize: "0.78rem", color: "var(--devio-neutral-3)" }}>
                    {currentProject?.name || "Proyecto"}
                  </span>
                  <span style={{ fontSize: "0.78rem", color: "var(--devio-neutral-2)" }}>•</span>
                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--devio-blue)" }}>
                    Paso {currentStep} de 5: {stepsList[currentStep - 1]?.label || ""}
                  </span>
                </div>
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
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--devio-neutral-3)",
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Stepper Pills */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.5rem",
              overflowX: "auto",
              paddingBottom: "0.25rem",
            }}
          >
            {stepsList.map((step) => {
              const isDone = currentStep > step.num;
              const isCurrent = currentStep === step.num;
              return (
                <div
                  key={step.num}
                  onClick={() => {
                    if (step.num < currentStep) setCurrentStep(step.num);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    cursor: step.num < currentStep ? "pointer" : "default",
                    opacity: isCurrent ? 1 : isDone ? 0.9 : 0.45,
                    transition: "all 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      backgroundColor: isDone
                        ? "var(--devio-green)"
                        : isCurrent
                        ? "var(--devio-blue-dark)"
                        : "transparent",
                      color: isDone || isCurrent ? "#FFFFFF" : "var(--devio-neutral-3)",
                      border: isDone || isCurrent ? "none" : "1.5px solid var(--devio-neutral-2)",
                    }}
                  >
                    {isDone ? <Check size={13} strokeWidth={3} /> : step.num}
                  </div>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: isCurrent ? 700 : 500,
                      color: isCurrent ? "var(--devio-blue-dark)" : isDone ? "var(--devio-blue)" : "var(--devio-neutral-3)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {step.label}
                  </span>
                  {step.num < 5 && (
                    <div
                      style={{
                        width: "16px",
                        height: "1px",
                        backgroundColor: isDone ? "var(--devio-green)" : "var(--devio-neutral-1)",
                        marginLeft: "0.25rem",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ================================================================== */}
        {/* MODAL BODY */}
        {/* ================================================================== */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1.5rem 2rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          {/* STEP 1: CLIENTE Y COPROPIEDAD */}
          {currentStep === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {initialQuote && (
                <div
                  style={{
                    backgroundColor: "rgba(0, 196, 140, 0.08)",
                    border: "1.5px solid rgba(0, 196, 140, 0.35)",
                    borderRadius: "0.85rem",
                    padding: "0.85rem 1.25rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        backgroundColor: "#00C48C",
                        color: "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <strong style={{ fontSize: "0.88rem", color: "#1F3652", display: "block" }}>
                        Formalizando Venta desde Cotización {initialQuote.folio}
                      </strong>
                      <span style={{ fontSize: "0.76rem", color: "#64748B" }}>
                        Unidad <strong>{initialQuote.unit}</strong> ({initialQuote.unitType}) • Plan: <strong>{initialQuote.planName}</strong> • Monto: <strong>{formatMoney(initialQuote.totalQuoteAmount)}</strong>
                      </span>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      backgroundColor: "rgba(0, 196, 140, 0.2)",
                      color: "#00C48C",
                      padding: "0.25rem 0.65rem",
                      borderRadius: "9999px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Condiciones Editables
                  </span>
                </div>
              )}

              <div style={{ textAlign: "center", maxWidth: "660px", margin: "0 auto" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--devio-blue-dark)", marginBottom: "0.4rem" }}>
                  Asignar Titular y Copropietarios
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--devio-neutral-3)", lineHeight: 1.45 }}>
                  Ingresa el correo del cliente principal y define si la propiedad se adquirirá en esquema de Copropiedad (varios dueños con porcentaje patrimonial asignado).
                </p>
              </div>

              {/* Copropiedad Toggle Switch Card */}
              <div
                style={{
                  backgroundColor: isCoOwnership ? "rgba(47, 128, 237, 0.06)" : "#F8FAFC",
                  border: isCoOwnership ? "1.5px solid var(--devio-blue)" : "1px solid var(--devio-neutral-1)",
                  borderRadius: "0.85rem",
                  padding: "0.85rem 1.25rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "8px",
                      backgroundColor: isCoOwnership ? "var(--devio-blue)" : "rgba(31, 54, 82, 0.08)",
                      color: isCoOwnership ? "#FFFFFF" : "var(--devio-blue-dark)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Users size={18} />
                  </div>
                  <div>
                    <strong style={{ fontSize: "0.9rem", color: "var(--devio-blue-dark)", display: "block" }}>
                      ¿Es una compra en Copropiedad (Varios Dueños)?
                    </strong>
                    <span style={{ fontSize: "0.75rem", color: "var(--devio-neutral-3)" }}>
                      Permite registrar dos o más copropietarios con porcentajes que sumen el 100%.
                    </span>
                  </div>
                </div>

                <label style={{ display: "flex", alignItems: "center", cursor: "pointer", gap: "0.5rem" }}>
                  <input
                    type="checkbox"
                    checked={isCoOwnership}
                    onChange={(e) => handleToggleCoOwnership(e.target.checked)}
                    style={{ width: "20px", height: "20px", accentColor: "var(--devio-blue)" }}
                  />
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--devio-blue-dark)" }}>
                    {isCoOwnership ? "Activada" : "Individual"}
                  </span>
                </label>
              </div>

              {/* Ownership Visual Distribution Bar (When Copropiedad is active) */}
              {isCoOwnership && (
                <div
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid var(--devio-neutral-1)",
                    borderRadius: "0.85rem",
                    padding: "1rem 1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.6rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--devio-blue-dark)" }}>
                        Distribución Patrimonial ({allOwnersCombined.length} Copropietarios):
                      </span>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 800,
                          padding: "0.2rem 0.6rem",
                          borderRadius: "9999px",
                          backgroundColor: isOwnershipBalanced ? "rgba(0, 196, 140, 0.15)" : "rgba(224, 83, 69, 0.15)",
                          color: isOwnershipBalanced ? "var(--devio-green)" : "var(--devio-red)",
                        }}
                      >
                        {totalOwnershipPct}% / 100% {isOwnershipBalanced ? "✓ Balanceado" : "⚠ Desbalanceado"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => distributeEqually(primaryClient, coOwnersList)}
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "var(--devio-blue)",
                        background: "none",
                        border: "1px solid var(--devio-blue)",
                        padding: "0.3rem 0.75rem",
                        borderRadius: "0.4rem",
                        cursor: "pointer",
                      }}
                    >
                      Distribuir Equitativamente
                    </button>
                  </div>

                  {/* Multi-segment progress bar */}
                  <div
                    style={{
                      height: "10px",
                      width: "100%",
                      backgroundColor: "var(--devio-neutral-1)",
                      borderRadius: "9999px",
                      overflow: "hidden",
                      display: "flex",
                    }}
                  >
                    {allOwnersCombined.map((owner, idx) => {
                      const colors = ["#1B3047", "#2F80ED", "#00C48C", "#F2994A", "#9B51E0"];
                      const color = colors[idx % colors.length];
                      return (
                        <div
                          key={owner.id}
                          style={{
                            width: `${Math.max(0, Math.min(100, owner.ownershipPct))}%`,
                            backgroundColor: color,
                            transition: "width 0.2s ease",
                          }}
                          title={`${owner.name || "Sin nombre"}: ${owner.ownershipPct}%`}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Titular Principal Card */}
              <div
                style={{
                  backgroundColor: "#F8FAFC",
                  padding: "1.25rem",
                  borderRadius: "1rem",
                  border: "1.5px solid var(--devio-neutral-1)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.85rem",
                }}
              >
                {/* Selector rápido de cliente existente */}
                {existingClients.length > 0 && (
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--devio-neutral-4)", display: "block", marginBottom: "0.25rem" }}>
                      Seleccionar de clientes registrados ({existingClients.length}):
                    </label>
                    <select
                      onChange={(e) => {
                        const found = existingClients.find(
                          (c) => (c.email || c.name).toLowerCase() === e.target.value.toLowerCase()
                        );
                        if (found) {
                          setPrimaryClient((prev) => ({
                            ...prev,
                            name: found.name,
                            email: found.email,
                            phone: found.phone,
                            rfc: found.rfc,
                          }));
                          setIsPrimaryFound(true);
                        }
                      }}
                      defaultValue=""
                      style={{
                        width: "100%",
                        padding: "0.55rem 0.85rem",
                        borderRadius: "0.5rem",
                        border: "1px solid var(--devio-neutral-2)",
                        fontSize: "0.85rem",
                        backgroundColor: "#FFFFFF",
                        color: "var(--devio-blue-dark)",
                        outline: "none",
                        fontWeight: 600,
                      }}
                    >
                      <option value="">-- Buscar o seleccionar cliente existente --</option>
                      {existingClients.map((c, idx) => (
                        <option key={idx} value={c.email || c.name}>
                          {c.name} ({c.email || "Sin correo"}{c.phone ? ` • ${c.phone}` : ""})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: existingClients.length > 0 ? "1px solid var(--devio-neutral-1)" : "none", paddingTop: existingClients.length > 0 ? "0.6rem" : "0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        backgroundColor: "var(--devio-blue-dark)",
                        color: "#FFFFFF",
                        padding: "0.2rem 0.55rem",
                        borderRadius: "0.35rem",
                      }}
                    >
                      Titular Principal
                    </span>
                    <strong style={{ fontSize: "0.88rem", color: "var(--devio-blue-dark)" }}>
                      Responsable Financiero y Firmante
                    </strong>
                    {isPrimaryFound ? (
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 800,
                          backgroundColor: "rgba(0, 196, 140, 0.12)",
                          color: "var(--devio-green)",
                          padding: "0.15rem 0.5rem",
                          borderRadius: "9999px",
                          border: "1px solid rgba(0, 196, 140, 0.3)",
                        }}
                      >
                        ✓ Cliente Existente
                      </span>
                    ) : primaryClient.email.trim() ? (
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 800,
                          backgroundColor: "rgba(47, 128, 237, 0.1)",
                          color: "var(--devio-blue)",
                          padding: "0.15rem 0.5rem",
                          borderRadius: "9999px",
                          border: "1px solid rgba(47, 128, 237, 0.25)",
                        }}
                      >
                        + Nuevo Comprador
                      </span>
                    ) : null}
                  </div>

                  {isCoOwnership && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)" }}>
                        % Copropiedad:
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={primaryClient.ownershipPct}
                        onChange={(e) =>
                          setPrimaryClient((prev) => ({
                            ...prev,
                            ownershipPct: Number(e.target.value),
                          }))
                        }
                        style={{
                          width: "65px",
                          padding: "0.3rem 0.5rem",
                          borderRadius: "0.4rem",
                          border: "1.5px solid var(--devio-blue)",
                          fontWeight: 800,
                          textAlign: "center",
                          fontSize: "0.85rem",
                        }}
                      />
                      <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>%</span>
                    </div>
                  )}
                </div>

                {/* Status Notice (Existing Client Isolation vs New Client Creation) */}
                {isPrimaryFound ? (
                  <div
                    style={{
                      backgroundColor: "rgba(47, 128, 237, 0.05)",
                      border: "1px solid rgba(47, 128, 237, 0.2)",
                      borderRadius: "0.6rem",
                      padding: "0.65rem 0.85rem",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.5rem",
                      fontSize: "0.76rem",
                      color: "var(--devio-blue-dark)",
                      lineHeight: 1.4,
                    }}
                  >
                    <Info size={16} style={{ color: "var(--devio-blue)", flexShrink: 0, marginTop: "1px" }} />
                    <div>
                      <strong>Información precargada:</strong> Puedes modificar el nombre, teléfono o RFC para este contrato/proyecto.
                      <div style={{ color: "var(--devio-neutral-3)", marginTop: "2px" }}>
                        * Los cambios realizados aquí se guardarán exclusivamente para este proyecto sin alterar el perfil global del cliente ni registros en otros desarrollos.
                      </div>
                    </div>
                  </div>
                ) : primaryClient.email.trim() ? (
                  <div
                    style={{
                      backgroundColor: "rgba(0, 196, 140, 0.06)",
                      border: "1px solid rgba(0, 196, 140, 0.25)",
                      borderRadius: "0.6rem",
                      padding: "0.65rem 0.85rem",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.5rem",
                      fontSize: "0.76rem",
                      color: "var(--devio-blue-dark)",
                      lineHeight: 1.4,
                    }}
                  >
                    <Sparkles size={16} style={{ color: "var(--devio-green)", flexShrink: 0, marginTop: "1px" }} />
                    <div>
                      <strong>Nuevo Cliente en Devio:</strong> Al crear la venta se generará su cuenta de usuario y se le enviarán sus accesos para ingresar a Devio (Portal Web y App Móvil).
                      <div style={{ color: "var(--devio-neutral-3)", marginTop: "2px" }}>
                        * La información que captures quedará resguardada para tu desarrolladora; si el cliente actualiza su nombre en su portal, tu expediente conservará tus registros.
                      </div>
                    </div>
                  </div>
                ) : null}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.25rem" }}>
                      <Mail size={13} style={{ color: "var(--devio-blue)" }} /> Correo Electrónico (Acceso a Devio) *
                    </label>
                    <input
                      type="email"
                      value={primaryClient.email}
                      onChange={(e) => setPrimaryClient({ ...primaryClient, email: e.target.value })}
                      placeholder="cliente@ejemplo.com"
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.5rem",
                        border: isPrimaryFound ? "1.5px solid var(--devio-green)" : "1px solid var(--devio-neutral-2)",
                        fontSize: "0.9rem",
                        backgroundColor: "#FFFFFF",
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.25rem" }}>
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      value={primaryClient.name}
                      onChange={(e) => setPrimaryClient({ ...primaryClient, name: e.target.value })}
                      placeholder="Nombre y Apellidos"
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.5rem",
                        border: "1px solid var(--devio-neutral-2)",
                        fontSize: "0.88rem",
                        backgroundColor: "#FFFFFF",
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.25rem" }}>
                      Teléfono de Contacto *
                    </label>
                    <PhoneInput
                      value={primaryClient.phone}
                      onChange={(fullVal) => setPrimaryClient({ ...primaryClient, phone: fullVal })}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.25rem" }}>
                      RFC / Identificación Fiscal
                    </label>
                    <input
                      type="text"
                      value={primaryClient.rfc}
                      onChange={(e) => setPrimaryClient({ ...primaryClient, rfc: e.target.value.toUpperCase() })}
                      placeholder="MOAL890214XYZ"
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.5rem",
                        border: "1px solid var(--devio-neutral-2)",
                        fontSize: "0.88rem",
                        backgroundColor: "#FFFFFF",
                        textTransform: "uppercase",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Co-Owners Cards (If Co-Ownership is active) */}
              {isCoOwnership && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {coOwnersList.map((co, index) => (
                    <div
                      key={co.id}
                      style={{
                        backgroundColor: "#FAFBFD",
                        padding: "1.25rem",
                        borderRadius: "1rem",
                        border: "1px solid var(--devio-neutral-2)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.85rem",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: 800,
                              textTransform: "uppercase",
                              backgroundColor: "var(--devio-blue)",
                              color: "#FFFFFF",
                              padding: "0.2rem 0.55rem",
                              borderRadius: "0.35rem",
                            }}
                          >
                            Copropietario #{index + 1}
                          </span>
                          <input
                            type="text"
                            placeholder="Relación (ej. Cónyuge, Socio)"
                            value={co.relationship || ""}
                            onChange={(e) => handleUpdateCoOwner(co.id, "relationship", e.target.value)}
                            style={{
                              border: "none",
                              backgroundColor: "transparent",
                              fontSize: "0.78rem",
                              color: "var(--devio-neutral-3)",
                              outline: "none",
                            }}
                          />
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)" }}>
                              % Participación:
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={co.ownershipPct}
                              onChange={(e) => handleUpdateCoOwner(co.id, "ownershipPct", Number(e.target.value))}
                              style={{
                                width: "65px",
                                padding: "0.3rem 0.5rem",
                                borderRadius: "0.4rem",
                                border: "1.5px solid var(--devio-blue)",
                                fontWeight: 800,
                                textAlign: "center",
                                fontSize: "0.85rem",
                              }}
                            />
                            <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>%</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveCoOwner(co.id)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--devio-red)",
                              cursor: "pointer",
                              padding: "0.25rem",
                            }}
                            title="Eliminar copropietario"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                        <div style={{ gridColumn: "span 2" }}>
                          <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.25rem" }}>
                            Correo Electrónico (Acceso propio) *
                          </label>
                          <input
                            type="email"
                            value={co.email}
                            onChange={(e) => handleUpdateCoOwner(co.id, "email", e.target.value)}
                            placeholder="copropietario@ejemplo.com"
                            style={{
                              width: "100%",
                              padding: "0.65rem 0.85rem",
                              borderRadius: "0.5rem",
                              border: "1px solid var(--devio-neutral-2)",
                              fontSize: "0.9rem",
                              backgroundColor: "#FFFFFF",
                            }}
                            required
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.25rem" }}>
                            Nombre Completo *
                          </label>
                          <input
                            type="text"
                            value={co.name}
                            onChange={(e) => handleUpdateCoOwner(co.id, "name", e.target.value)}
                            placeholder="Nombre del Copropietario"
                            style={{
                              width: "100%",
                              padding: "0.65rem 0.85rem",
                              borderRadius: "0.5rem",
                              border: "1px solid var(--devio-neutral-2)",
                              fontSize: "0.88rem",
                              backgroundColor: "#FFFFFF",
                            }}
                            required
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.25rem" }}>
                            Teléfono
                          </label>
                          <PhoneInput
                            value={co.phone}
                            onChange={(fullVal) => handleUpdateCoOwner(co.id, "phone", fullVal)}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.25rem" }}>
                            RFC / Identificación
                          </label>
                          <input
                            type="text"
                            value={co.rfc}
                            onChange={(e) => handleUpdateCoOwner(co.id, "rfc", e.target.value.toUpperCase())}
                            placeholder="RFC Copropietario"
                            style={{
                              width: "100%",
                              padding: "0.65rem 0.85rem",
                              borderRadius: "0.5rem",
                              border: "1px solid var(--devio-neutral-2)",
                              fontSize: "0.88rem",
                              backgroundColor: "#FFFFFF",
                              textTransform: "uppercase",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add Co-Owner Button */}
                  <button
                    type="button"
                    onClick={handleAddCoOwner}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      padding: "0.85rem",
                      borderRadius: "0.75rem",
                      border: "2px dashed var(--devio-blue)",
                      backgroundColor: "rgba(47, 128, 237, 0.04)",
                      color: "var(--devio-blue)",
                      fontWeight: 700,
                      fontSize: "0.88rem",
                      cursor: "pointer",
                    }}
                  >
                    <Plus size={18} /> + Agregar Otro Copropietario a esta Venta
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: PROYECTO Y UNIDAD */}
          {currentStep === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ textAlign: "center", maxWidth: "620px", margin: "0 auto" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--devio-blue-dark)", marginBottom: "0.4rem" }}>
                  Seleccionar Proyecto y Unidad
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--devio-neutral-3)" }}>
                  Elige la unidad que se asignará a los compradores.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.35rem" }}>
                    Proyecto
                  </label>
                  <div
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      borderRadius: "0.6rem",
                      border: "1px solid var(--devio-neutral-1)",
                      backgroundColor: "#F8FAFC",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      color: "var(--devio-blue-dark)",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                    }}
                  >
                    <Building2 size={16} style={{ color: "var(--devio-blue)" }} />
                    <span>{currentProject?.name || "Proyecto"}</span>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.35rem" }}>
                    Unidad Disponible *
                  </label>
                  <select
                    value={selectedUnitNumber}
                    onChange={(e) => setSelectedUnitNumber(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      borderRadius: "0.6rem",
                      border: "1.5px solid var(--devio-blue)",
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      color: "var(--devio-blue-dark)",
                      backgroundColor: "var(--devio-white)",
                      outline: "none",
                    }}
                  >
                    {availableUnits.map((u) => (
                      <option key={u.unit} value={u.unit}>
                        {u.unit} — {u.type} ({formatMoney(u.price)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Unit Summary Card */}
              <div
                style={{
                  backgroundColor: "#F8FAFC",
                  borderRadius: "1rem",
                  border: "1px solid var(--devio-neutral-1)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    backgroundColor: "rgba(31, 54, 82, 0.05)",
                    padding: "0.75rem 1.25rem",
                    borderBottom: "1px solid var(--devio-neutral-1)",
                  }}
                >
                  <h4 style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--devio-blue-dark)", margin: 0 }}>
                    Resumen de la Unidad {selectedUnitNumber}
                  </h4>
                </div>

                <div style={{ padding: "1.25rem", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--devio-neutral-3)", display: "block" }}>
                      Superficie
                    </span>
                    <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--devio-blue-dark)" }}>
                      {unitCustomArea} m²
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--devio-neutral-3)", display: "block" }}>
                      Precio de Lista
                    </span>
                    <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--devio-green)" }}>
                      {formatMoney(unitCustomPrice)}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--devio-neutral-3)", display: "block" }}>
                      Fecha Estimada de Entrega
                    </span>
                    <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--devio-blue-dark)" }}>
                      {unitEstimatedDelivery}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ADICIONALES */}
          {currentStep === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ textAlign: "center", maxWidth: "620px", margin: "0 auto" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--devio-blue-dark)", marginBottom: "0.4rem" }}>
                  Seleccionar Adicionales
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--devio-neutral-3)" }}>
                  Agrega adicionales disponibles a esta venta.
                </p>
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.4rem" }}>
                  Seleccionar Adicionales para esta venta
                </label>
                <div
                  style={{
                    minHeight: "48px",
                    padding: "0.4rem 0.6rem",
                    borderRadius: "0.6rem",
                    border: "1.5px solid var(--devio-neutral-2)",
                    backgroundColor: "var(--devio-white)",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  {selectedAdditionals.map((item) => (
                    <span
                      key={item.id}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        padding: "0.25rem 0.6rem",
                        borderRadius: "0.4rem",
                        backgroundColor: "#F1F5F9",
                        border: "1px solid var(--devio-neutral-1)",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        color: "var(--devio-blue-dark)",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedAdditionals(selectedAdditionals.filter((i) => i.id !== item.id))
                        }
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                          color: "var(--devio-neutral-3)",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <X size={13} />
                      </button>
                      {item.name}
                    </span>
                  ))}
                  <select
                    onChange={(e) => {
                      const found = availableAdditionalsPool.find((a) => a.id === e.target.value);
                      if (found && !selectedAdditionals.some((s) => s.id === found.id)) {
                        setSelectedAdditionals([...selectedAdditionals, found]);
                      }
                      e.target.value = "";
                    }}
                    style={{
                      border: "none",
                      outline: "none",
                      fontSize: "0.85rem",
                      color: "var(--devio-neutral-3)",
                      backgroundColor: "transparent",
                      cursor: "pointer",
                      padding: "0.3rem",
                      flex: 1,
                      minWidth: "180px",
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>
                      {availableAdditionalsPool.length === 0
                        ? "No hay adicionales disponibles en este proyecto"
                        : "+ Añadir adicional disponible..."}
                    </option>
                    {availableAdditionalsPool.filter(
                      (a) => !selectedAdditionals.some((s) => s.id === a.id)
                    ).map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} — {formatMoney(a.price)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Additionals Resumen */}
              <div
                style={{
                  backgroundColor: "#F8FAFC",
                  borderRadius: "1rem",
                  border: "1px solid var(--devio-neutral-1)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    backgroundColor: "rgba(31, 54, 82, 0.05)",
                    padding: "0.75rem 1.25rem",
                    borderBottom: "1px solid var(--devio-neutral-1)",
                  }}
                >
                  <h4 style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--devio-blue-dark)", margin: 0 }}>
                    Resumen
                  </h4>
                </div>

                <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                  {selectedAdditionals.length === 0 ? (
                    <p style={{ fontSize: "0.85rem", color: "var(--devio-neutral-3)", fontStyle: "italic", margin: 0 }}>
                      Sin adicionales seleccionados para esta venta.
                    </p>
                  ) : (
                    selectedAdditionals.map((item, index) => (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "0.88rem",
                        }}
                      >
                        <span style={{ color: "var(--devio-blue-dark)", fontWeight: 600 }}>
                          {index + 1}. {item.name}:
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <span style={{ fontWeight: 700, color: "var(--devio-neutral-5)" }}>
                            {formatMoney(item.price)}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedAdditionals(selectedAdditionals.filter((i) => i.id !== item.id))
                            }
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "var(--devio-red)",
                              padding: "0.1rem",
                            }}
                            title="Eliminar adicional"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}

                  <div
                    style={{
                      marginTop: "0.5rem",
                      paddingTop: "0.75rem",
                      borderTop: "1px solid var(--devio-neutral-1)",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--devio-blue-dark)" }}>
                      $ Total Adicionales:
                    </span>
                    <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--devio-green)" }}>
                      {formatMoney(totalAdditionalsAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PLAN DE PAGO */}
          {currentStep === 4 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ textAlign: "center", maxWidth: "680px", margin: "0 auto" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--devio-blue-dark)", marginBottom: "0.4rem" }}>
                  Seleccionar Plan de Pago
                </h3>
                <p style={{ fontSize: "0.82rem", color: "var(--devio-neutral-3)", lineHeight: 1.45 }}>
                  Elige el plan de pago que se aplicará a esta venta. El sistema calculará el desglose financiero exacto.
                </p>
              </div>

              {/* Plan Preset Selector Header */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "260px" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.25rem" }}>
                    Plan de Pago Seleccionado
                  </label>
                  <select
                    value={selectedPlanId}
                    onChange={(e) => handleSelectPlan(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.7rem 1rem",
                      borderRadius: "0.6rem",
                      border: "1.5px solid var(--devio-neutral-2)",
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      color: "var(--devio-blue-dark)",
                      backgroundColor: "var(--devio-white)",
                      outline: "none",
                    }}
                  >
                    {activeDeveloperPlans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} ({plan.downPaymentPct}% Enganche, {plan.installmentsCount} Mensualidades, {plan.balloonLiquidationPct}% Liquidación{plan.discountPct > 0 ? ` - ${plan.discountPct}% Desc` : ""})
                      </option>
                    ))}
                    <option value="custom">✨ Plan Personalizado Exclusivo de esta Venta</option>
                  </select>
                </div>

                <div style={{ alignSelf: "flex-end" }}>
                  <button
                    type="button"
                    onClick={handleOpenCustomPlanModal}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.75rem 1.25rem",
                      borderRadius: "0.6rem",
                      backgroundColor: "var(--devio-blue-dark)",
                      color: "var(--devio-white)",
                      fontSize: "0.88rem",
                      fontWeight: 700,
                      border: "none",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      boxShadow: "0 2px 8px rgba(31, 54, 82, 0.2)",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--devio-blue)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--devio-blue-dark)";
                    }}
                  >
                    <Edit2 size={15} />
                    Personalizar Plan de Pago
                  </button>
                </div>
              </div>

              {/* Active Plan Highlights Card */}
              <div
                style={{
                  backgroundColor: "rgba(31, 54, 82, 0.03)",
                  border: "1px solid var(--devio-neutral-1)",
                  borderRadius: "0.85rem",
                  padding: "1rem 1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--devio-blue-dark)" }}>
                      {customPlanName || "Plan de Pago"}
                    </span>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        padding: "0.2rem 0.6rem",
                        borderRadius: "9999px",
                        fontWeight: 700,
                        backgroundColor: paymentType === "CONTADO" ? "rgba(0, 196, 140, 0.15)" : "rgba(47, 128, 237, 0.15)",
                        color: paymentType === "CONTADO" ? "var(--devio-green)" : "var(--devio-blue)",
                      }}
                    >
                      {paymentType === "CONTADO" ? "⚡ Pago de Contado (100%)" : "🗓 Esquema en Plazos"}
                    </span>
                  </div>

                  <span style={{ fontSize: "0.75rem", color: "var(--devio-neutral-3)", fontStyle: "italic" }}>
                    * Los cambios al plan aplican exclusivamente a esta venta y no modifican el catálogo general.
                  </span>
                </div>

                {/* Metrics Badges */}
                <div style={{ display: "grid", gridTemplateColumns: paymentType === "CONTADO" ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: "0.65rem" }}>
                  {paymentType === "CONTADO" ? (
                    <>
                      <div style={{ backgroundColor: "#FFFFFF", padding: "0.6rem 0.85rem", borderRadius: "0.5rem", border: "1px solid var(--devio-neutral-1)" }}>
                        <span style={{ fontSize: "0.7rem", color: "var(--devio-neutral-3)", display: "block" }}>Pago Total en 1 Exhibición</span>
                        <strong style={{ fontSize: "0.95rem", color: "var(--devio-blue-dark)" }}>
                          100% ({formatMoney(netTotalSaleAmount)})
                        </strong>
                      </div>
                      <div style={{ backgroundColor: "#FFFFFF", padding: "0.6rem 0.85rem", borderRadius: "0.5rem", border: "1px solid var(--devio-neutral-1)" }}>
                        <span style={{ fontSize: "0.7rem", color: "var(--devio-neutral-3)", display: "block" }}>Descuento por Contado</span>
                        <strong style={{ fontSize: "0.95rem", color: discountPct > 0 ? "var(--devio-green)" : "var(--devio-neutral-3)" }}>
                          {discountPct > 0 ? `${discountPct}% (${formatMoney(discountAmount)})` : "Sin descuento"}
                        </strong>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ backgroundColor: "#FFFFFF", padding: "0.6rem 0.85rem", borderRadius: "0.5rem", border: "1px solid var(--devio-neutral-1)" }}>
                        <span style={{ fontSize: "0.7rem", color: "var(--devio-neutral-3)", display: "block" }}>Enganche Inicial</span>
                        <strong style={{ fontSize: "0.92rem", color: "#2F80ED" }}>
                          {downPaymentPct}% ({formatMoney(Math.round(netTotalSaleAmount * (downPaymentPct / 100)))})
                        </strong>
                      </div>

                      <div style={{ backgroundColor: "#FFFFFF", padding: "0.6rem 0.85rem", borderRadius: "0.5rem", border: "1px solid var(--devio-neutral-1)" }}>
                        <span style={{ fontSize: "0.7rem", color: "var(--devio-neutral-3)", display: "block" }}>
                          {installmentsCount} Cuotas ({periodicity})
                        </span>
                        <strong style={{ fontSize: "0.92rem", color: "#D97706" }}>
                          {planValidation.installmentsPct}% ({installmentsCount > 0 ? `${formatMoney(Math.round(((netTotalSaleAmount * (planValidation.installmentsPct / 100)) / installmentsCount) * 100) / 100)} c/u` : "$0"})
                        </strong>
                      </div>

                      <div style={{ backgroundColor: "#FFFFFF", padding: "0.6rem 0.85rem", borderRadius: "0.5rem", border: "1px solid var(--devio-neutral-1)" }}>
                        <span style={{ fontSize: "0.7rem", color: "var(--devio-neutral-3)", display: "block" }}>Liquidación Final</span>
                        <strong style={{ fontSize: "0.92rem", color: "#00C48C" }}>
                          {balloonLiquidationPct}% ({formatMoney(Math.round(netTotalSaleAmount * (balloonLiquidationPct / 100)))})
                        </strong>
                      </div>

                      <div style={{ backgroundColor: "#FFFFFF", padding: "0.6rem 0.85rem", borderRadius: "0.5rem", border: "1px solid var(--devio-neutral-1)" }}>
                        <span style={{ fontSize: "0.7rem", color: "var(--devio-neutral-3)", display: "block" }}>Descuento / Interés</span>
                        <strong style={{ fontSize: "0.92rem", color: discountPct > 0 ? "var(--devio-green)" : "var(--devio-neutral-3)" }}>
                          {discountPct > 0 ? `-${discountPct}%` : "0%"} {interestPct > 0 ? ` / +${interestPct}% Int.` : ""}
                        </strong>
                      </div>
                    </>
                  )}
                </div>

                {/* Live Schema Distribution Bar */}
                {paymentType === "ESQUEMA" && (
                  <div
                    style={{
                      padding: "0.65rem 0.85rem",
                      borderRadius: "0.5rem",
                      backgroundColor: planValidation.isValid ? "rgba(255, 255, 255, 0.7)" : "#FFF5F5",
                      border: planValidation.isValid ? "1px solid var(--devio-neutral-2)" : "1px solid #FCA5A5",
                      fontSize: "0.75rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                      <span style={{ fontWeight: 600, color: "var(--devio-blue-dark)" }}>
                        Distribución: Enganche ({downPaymentPct}%) + {installmentsCount > 0 ? `${installmentsCount} (${planValidation.installmentsPct}%)` : "Sin cuotas"} + Liquidación ({balloonLiquidationPct}%)
                      </span>
                      <strong style={{ color: planValidation.isValid ? "var(--devio-green)" : "var(--devio-red)" }}>
                        {planValidation.isValid ? "✓ Total: 100%" : `⚠ Total: ${planValidation.totalPct}%`}
                      </strong>
                    </div>
                    <div style={{ height: "6px", backgroundColor: "#E2E8F0", borderRadius: "3px", display: "flex", overflow: "hidden" }}>
                      <div style={{ width: `${Math.max(0, Math.min(100, downPaymentPct))}%`, backgroundColor: "#2F80ED" }} title={`Enganche: ${downPaymentPct}%`} />
                      <div style={{ width: `${Math.max(0, Math.min(100, planValidation.installmentsPct))}%`, backgroundColor: "#F2C94C" }} title={`Cuotas: ${planValidation.installmentsPct}%`} />
                      <div style={{ width: `${Math.max(0, Math.min(100, balloonLiquidationPct))}%`, backgroundColor: "#00C48C" }} title={`Liquidación: ${balloonLiquidationPct}%`} />
                    </div>
                  </div>
                )}

                {/* Discount Scope Option if discount > 0 */}
                {discountPct > 0 && (
                  <div
                    style={{
                      padding: "0.6rem 0.85rem",
                      borderRadius: "0.5rem",
                      backgroundColor: "rgba(47, 128, 237, 0.05)",
                      border: "1px solid rgba(47, 128, 237, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "0.6rem",
                    }}
                  >
                    <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--devio-blue-dark)" }}>
                      Aplicar Descuento del {discountPct}% ({formatMoney(discountAmount)}) sobre:
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.76rem", cursor: "pointer", fontWeight: discountAppliesTo === "total" ? 700 : 500, color: "var(--devio-blue-dark)" }}>
                        <input
                          type="radio"
                          name="discountAppliesTo"
                          checked={discountAppliesTo === "total"}
                          onChange={() => setDiscountAppliesTo("total")}
                          style={{ accentColor: "var(--devio-blue)" }}
                        />
                        <span>Total del Plan (Unidad + Adicionales)</span>
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.76rem", cursor: "pointer", fontWeight: discountAppliesTo === "unit_only" ? 700 : 500, color: "var(--devio-blue-dark)" }}>
                        <input
                          type="radio"
                          name="discountAppliesTo"
                          checked={discountAppliesTo === "unit_only"}
                          onChange={() => setDiscountAppliesTo("unit_only")}
                          style={{ accentColor: "var(--devio-blue)" }}
                        />
                        <span>Solo Precio de la Unidad</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Schedule Date Controls */}
              <div
                style={{
                  backgroundColor: "#F8FAFC",
                  border: "1px solid var(--devio-neutral-1)",
                  borderRadius: "0.85rem",
                  padding: "0.85rem 1.15rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "0.85rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                  <div>
                    <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.2rem" }}>
                      📅 Fecha de Enganche (Inicio):
                    </label>
                    <div style={{ width: "160px" }}>
                      <DevioDatePicker
                        value={saleDate}
                        onChange={(val) => setSaleDate(val)}
                        placeholder="Fecha de inicio"
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.2rem" }}>
                      ⚡ Ajustar día de corte mensual a todas las cuotas:
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      {[
                        { label: `Hoy (${new Date().getDate()})`, day: new Date().getDate() },
                        { label: "Día 1", day: 1 },
                        { label: "Día 5", day: 5 },
                        { label: "Día 15", day: 15 },
                        { label: "Día 25", day: 25 },
                      ].map((item) => (
                        <button
                          key={item.day}
                          type="button"
                          onClick={() => handleBulkCutoffDayChange(item.day)}
                          style={{
                            padding: "0.3rem 0.6rem",
                            borderRadius: "0.4rem",
                            border: monthlyCutoffDay === item.day ? "1.5px solid var(--devio-blue)" : "1px solid var(--devio-neutral-2)",
                            backgroundColor: monthlyCutoffDay === item.day ? "rgba(47, 128, 237, 0.1)" : "#FFFFFF",
                            color: monthlyCutoffDay === item.day ? "var(--devio-blue)" : "var(--devio-blue-dark)",
                            fontSize: "0.74rem",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Schedule Table */}
              <div
                style={{
                  border: "1px solid var(--devio-neutral-1)",
                  borderRadius: "1rem",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    backgroundColor: "rgba(31, 54, 82, 0.05)",
                    padding: "0.75rem 1.25rem",
                    borderBottom: "1px solid var(--devio-neutral-1)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h4 style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--devio-blue-dark)", margin: 0 }}>
                    Calendario de Pagos ({paymentSchedule.length} exhibiciones)
                  </h4>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    {!isScheduleBalanced && (
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--devio-red)" }}>
                        Diferencia: {formatMoney(scheduleDifference)}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleAutoBalanceOnLiquidation}
                      style={{
                        fontSize: "0.75rem",
                        padding: "0.3rem 0.75rem",
                        borderRadius: "0.4rem",
                        backgroundColor: "var(--devio-white)",
                        border: "1px solid var(--devio-neutral-2)",
                        fontWeight: 700,
                        cursor: "pointer",
                        color: "var(--devio-blue-dark)",
                      }}
                    >
                      Ajustar al 100%
                    </button>
                  </div>
                </div>

                <div style={{ maxHeight: "220px", overflowY: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#FAFBFD", borderBottom: "1px solid var(--devio-neutral-1)", textAlign: "left" }}>
                        <th style={{ padding: "0.6rem 1rem", color: "var(--devio-neutral-3)" }}>Concepto</th>
                        <th style={{ padding: "0.6rem 1rem", color: "var(--devio-neutral-3)" }}>Fecha de Pago</th>
                        <th style={{ padding: "0.6rem 1rem", color: "var(--devio-neutral-3)", textAlign: "right" }}>Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentSchedule.map((row, idx) => (
                        <tr key={row.id ? `${row.id}-${idx}` : idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                          <td style={{ padding: "0.55rem 1rem", fontWeight: 600, color: "var(--devio-blue-dark)" }}>
                            {idx + 1}. {row.concept}
                          </td>
                          <td style={{ padding: "0.55rem 1rem", minWidth: "160px" }}>
                            <DevioDatePicker
                              value={row.date}
                              minDate={idx === 0 ? saleDate : paymentSchedule[idx - 1]?.date}
                              onChange={(val) => handleUpdateRowDate(row.id, val)}
                              showPresets={false}
                              placeholder="Seleccionar"
                            />
                          </td>
                          <td style={{ padding: "0.55rem 1rem", textAlign: "right" }}>
                            <CurrencyInput
                              value={row.amount}
                              onChange={(newVal) => handleUpdateRowAmount(row.id, newVal)}
                              style={{ width: "150px" }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Table Summary Footer with Total Sum */}
                <div
                  style={{
                    backgroundColor: "#FAFBFD",
                    borderTop: "1.5px solid var(--devio-neutral-1)",
                    padding: "0.85rem 1.25rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "0.75rem",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--devio-blue-dark)" }}>
                        Suma Total de Pagos:
                      </span>
                      <strong style={{ fontSize: "1.05rem", color: isScheduleBalanced ? "var(--devio-green)" : "var(--devio-red)" }}>
                        {formatMoney(totalScheduleSum)}
                      </strong>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          padding: "0.2rem 0.55rem",
                          borderRadius: "9999px",
                          backgroundColor: isScheduleBalanced ? "rgba(0, 196, 140, 0.12)" : "rgba(224, 83, 69, 0.12)",
                          color: isScheduleBalanced ? "var(--devio-green)" : "var(--devio-red)",
                        }}
                      >
                        {isScheduleBalanced ? "✓ 100% Cuadrado" : `⚠ Diferencia: ${formatMoney(scheduleDifference)}`}
                      </span>
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--devio-neutral-3)", display: "block", marginTop: "0.2rem" }}>
                      Monto Neto a Liquidar: <strong>{formatMoney(netTotalSaleAmount)}</strong>
                      {discountPct > 0 ? (
                        <> • (Unidad: {formatMoney(unitCustomPrice)}{totalAdditionalsAmount > 0 ? ` + Adicionales: ${formatMoney(totalAdditionalsAmount)}` : ""} - Descuento {discountAppliesTo === "unit_only" ? "a Unidad" : "Total"}: {formatMoney(discountAmount)})</>
                      ) : (
                        totalAdditionalsAmount > 0 ? <> • (Unidad: {formatMoney(unitCustomPrice)} + Adicionales: ${formatMoney(totalAdditionalsAmount)})</> : null
                      )}
                    </span>
                  </div>

                  {!isScheduleBalanced && (
                    <button
                      type="button"
                      onClick={handleAutoBalanceOnLiquidation}
                      style={{
                        fontSize: "0.78rem",
                        padding: "0.4rem 0.9rem",
                        borderRadius: "0.5rem",
                        backgroundColor: "var(--devio-blue-dark)",
                        color: "#FFFFFF",
                        border: "none",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Ajustar Diferencia en Liquidación
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: PAGO INICIAL Y CONFIRMACIÓN */}
          {currentStep === 5 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ textAlign: "center", maxWidth: "620px", margin: "0 auto" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--devio-blue-dark)", marginBottom: "0.4rem" }}>
                  Pago Inicial y Resumen Final
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--devio-neutral-3)" }}>
                  Registra el comprobante del enganche o primer pago para activar el expediente y expedir contratos.
                </p>
              </div>

              {/* Final Summary Card */}
              <div
                style={{
                  backgroundColor: "var(--devio-white)",
                  borderRadius: "1rem",
                  border: "1.5px solid var(--devio-neutral-1)",
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--devio-neutral-1)", paddingBottom: "0.75rem" }}>
                  <div>
                    <h4 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--devio-blue-dark)", margin: 0 }}>
                      {currentProject?.name || "Proyecto"} — Unidad {selectedUnitNumber}
                    </h4>
                    <span style={{ fontSize: "0.8rem", color: "var(--devio-neutral-4)" }}>
                      Superficie: {unitCustomArea} m² • Entrega estimada: {unitEstimatedDelivery}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--devio-neutral-3)", display: "block" }}>Monto Total Neto</span>
                    <strong style={{ fontSize: "1.2rem", color: "var(--devio-green)" }}>{formatMoney(netTotalSaleAmount)}</strong>
                    {discountPct > 0 && (
                      <span style={{ fontSize: "0.7rem", color: "var(--devio-neutral-3)", display: "block" }}>
                        (Antes: {formatMoney(totalSaleAmount)} | -{formatMoney(discountAmount)})
                      </span>
                    )}
                  </div>
                </div>

                {/* Buyers & Shares Breakdown */}
                <div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--devio-neutral-3)", textTransform: "uppercase", display: "block", marginBottom: "0.35rem" }}>
                    {isCoOwnership ? "Copropietarios Registrados:" : "Comprador Registrado:"}
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                    {allOwnersCombined.map((owner) => (
                      <div
                        key={owner.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          backgroundColor: "#F8FAFC",
                          padding: "0.45rem 0.75rem",
                          borderRadius: "0.45rem",
                          fontSize: "0.82rem",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <User size={13} style={{ color: "var(--devio-blue)" }} />
                          <strong style={{ color: "var(--devio-blue-dark)" }}>{owner.name}</strong>
                          <span style={{ color: "var(--devio-neutral-3)" }}>({owner.email})</span>
                        </div>
                        <span style={{ fontWeight: 800, color: "var(--devio-blue)" }}>
                          {owner.ownershipPct}% de la propiedad
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Modalidad de Pago Inicial */}
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.4rem" }}>
                    Modalidad de Pago Inicial:
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
                    {/* Option 1: Full Enganche */}
                    <div
                      onClick={() => {
                        setInitialPaymentOption("FULL");
                        if (paymentSchedule[0]) setInitialPaymentAmount(paymentSchedule[0].amount);
                      }}
                      style={{
                        padding: "0.85rem",
                        borderRadius: "0.75rem",
                        border: initialPaymentOption === "FULL" ? "2px solid var(--devio-blue)" : "1px solid var(--devio-neutral-2)",
                        backgroundColor: initialPaymentOption === "FULL" ? "rgba(47, 128, 237, 0.05)" : "#FFFFFF",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.3rem",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong style={{ fontSize: "0.85rem", color: "var(--devio-blue-dark)" }}>Pago Total Enganche</strong>
                        <input
                          type="radio"
                          name="initialPaymentOption"
                          checked={initialPaymentOption === "FULL"}
                          onChange={() => {}}
                          style={{ accentColor: "var(--devio-blue)" }}
                        />
                      </div>
                      <span style={{ fontSize: "0.74rem", color: "var(--devio-neutral-3)" }}>
                        Liquida el total del enganche: <strong style={{ color: "var(--devio-blue-dark)" }}>{formatMoney(paymentSchedule[0]?.amount || 0)}</strong>
                      </span>
                    </div>

                    {/* Option 2: Partial */}
                    <div
                      onClick={() => {
                        setInitialPaymentOption("PARTIAL");
                      }}
                      style={{
                        padding: "0.85rem",
                        borderRadius: "0.75rem",
                        border: initialPaymentOption === "PARTIAL" ? "2px solid var(--devio-blue)" : "1px solid var(--devio-neutral-2)",
                        backgroundColor: initialPaymentOption === "PARTIAL" ? "rgba(47, 128, 237, 0.05)" : "#FFFFFF",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.3rem",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong style={{ fontSize: "0.85rem", color: "var(--devio-blue-dark)" }}>Pago Parcial</strong>
                        <input
                          type="radio"
                          name="initialPaymentOption"
                          checked={initialPaymentOption === "PARTIAL"}
                          onChange={() => {}}
                          style={{ accentColor: "var(--devio-blue)" }}
                        />
                      </div>
                      <span style={{ fontSize: "0.74rem", color: "var(--devio-neutral-3)" }}>
                        Registrar un anticipo o pago menor al enganche total
                      </span>
                    </div>

                    {/* Option 3: None */}
                    <div
                      onClick={() => {
                        setInitialPaymentOption("NONE");
                        setInitialPaymentAmount(0);
                      }}
                      style={{
                        padding: "0.85rem",
                        borderRadius: "0.75rem",
                        border: initialPaymentOption === "NONE" ? "2px solid var(--devio-blue)" : "1px solid var(--devio-neutral-2)",
                        backgroundColor: initialPaymentOption === "NONE" ? "rgba(47, 128, 237, 0.05)" : "#FFFFFF",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.3rem",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong style={{ fontSize: "0.85rem", color: "var(--devio-blue-dark)" }}>Sin Pago Inicial</strong>
                        <input
                          type="radio"
                          name="initialPaymentOption"
                          checked={initialPaymentOption === "NONE"}
                          onChange={() => {}}
                          style={{ accentColor: "var(--devio-blue)" }}
                        />
                      </div>
                      <span style={{ fontSize: "0.74rem", color: "var(--devio-neutral-3)" }}>
                        No registrar pago ahora (pendiente de cobro posterior)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Registration Fields if initialPaymentOption !== "NONE" */}
                {initialPaymentOption !== "NONE" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", backgroundColor: "#F8FAFC", padding: "1rem", borderRadius: "0.75rem", border: "1px solid #E2E8F0" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.25rem" }}>
                        Monto de Pago Inicial (Enganche)
                      </label>
                      <CurrencyInput
                        value={initialPaymentAmount}
                        disabled={initialPaymentOption === "FULL"}
                        onChange={(newVal) => setInitialPaymentAmount(newVal)}
                        style={{ width: "100%", padding: "0.2rem 0.4rem" }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.25rem" }}>
                        Método de Pago
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "0.6rem 0.85rem",
                          borderRadius: "0.5rem",
                          border: "1px solid var(--devio-neutral-2)",
                          fontSize: "0.88rem",
                        }}
                      >
                        <option value="transferencia">Transferencia SPEI</option>
                        <option value="cheque">Cheque de Caja</option>
                        <option value="deposito">Depósito Bancario</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Email Notifications & Checkboxes */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--devio-neutral-3)", textTransform: "uppercase", display: "block", marginBottom: "0.15rem" }}>
                    Notificaciones Automáticas por Correo:
                  </span>

                  {/* Notificación Obligatoria 1: Credenciales de acceso al portal */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.65rem",
                      padding: "0.75rem 0.9rem",
                      borderRadius: "0.65rem",
                      backgroundColor: "rgba(111, 172, 156, 0.1)",
                      border: "1.5px solid rgba(111, 172, 156, 0.35)",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      color: "var(--devio-blue-dark)",
                    }}
                  >
                    <Mail size={17} color="#2F80ED" style={{ flexShrink: 0, marginTop: "2px" }} />
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.15rem" }}>
                        <strong style={{ color: "#1F3652" }}>
                          Credenciales de Acceso al Portal de Clientes
                        </strong>
                        <span style={{ fontSize: "0.68rem", fontWeight: 800, padding: "0.15rem 0.45rem", borderRadius: "9999px", backgroundColor: "#00C48C", color: "#FFFFFF" }}>
                          Automático
                        </span>
                      </div>
                      <span style={{ fontSize: "0.78rem", color: "#475569", lineHeight: 1.4 }}>
                        Se enviarán las credenciales de acceso al portal de clientes de Devio por correo a todos los compradores registrados.
                      </span>
                    </div>
                  </div>

                  {/* Checkbox 2: Welcome / Sale Confirmation */}
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "0.6rem",
                      backgroundColor: "rgba(47, 128, 237, 0.06)",
                      border: "1px solid rgba(47, 128, 237, 0.2)",
                      cursor: "pointer",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      color: "var(--devio-blue-dark)",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={sendSaleConfirmationEmail}
                      onChange={(e) => setSendSaleConfirmationEmail(e.target.checked)}
                      style={{ width: "16px", height: "16px", accentColor: "var(--devio-blue)" }}
                    />
                    <span>
                      Enviar correo de bienvenida con la confirmación de registro de nueva venta y contrato.
                    </span>
                  </label>

                  {/* Checkbox 3: Enganche Payment Receipt */}
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "0.6rem",
                      backgroundColor: initialPaymentOption === "NONE" ? "#F8FAFC" : "rgba(39, 174, 96, 0.08)",
                      border: initialPaymentOption === "NONE" ? "1px dashed #CBD5E1" : "1px solid rgba(39, 174, 96, 0.25)",
                      cursor: initialPaymentOption === "NONE" ? "not-allowed" : "pointer",
                      opacity: initialPaymentOption === "NONE" ? 0.6 : 1,
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      color: initialPaymentOption === "NONE" ? "#94A3B8" : "var(--devio-blue-dark)",
                    }}
                  >
                    <input
                      type="checkbox"
                      disabled={initialPaymentOption === "NONE"}
                      checked={initialPaymentOption !== "NONE" && sendReceiptEmail}
                      onChange={(e) => setSendReceiptEmail(e.target.checked)}
                      style={{ width: "16px", height: "16px", accentColor: "var(--devio-green)" }}
                    />
                    <span>
                      Enviar correo con el recibo de pago del enganche registrado.
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================================================================== */}
        {/* FOOTER */}
        {/* ================================================================== */}
        <div
          style={{
            padding: "1rem 2rem",
            borderTop: "1px solid var(--devio-neutral-1)",
            backgroundColor: "#FAFBFD",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.65rem 1.4rem",
                borderRadius: "9999px",
                backgroundColor: "var(--devio-blue-dark)",
                color: "var(--devio-white)",
                fontSize: "0.875rem",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
              }}
            >
              <ChevronLeft size={16} /> Anterior
            </button>
          ) : (
            <div />
          )}

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={() => {
                if (currentStep === 1) {
                  if (!primaryClient.email.trim() || !primaryClient.name.trim()) {
                    alert("Por favor completa los datos del titular principal.");
                    return;
                  }
                  if (isCoOwnership && !isOwnershipBalanced) {
                    alert(`El porcentaje total de copropiedad debe sumar 100%. Actualmente suma ${totalOwnershipPct}%.`);
                    return;
                  }
                }
                if (currentStep === 3) {
                  if (!planValidation.isValid) {
                    alert(planValidation.errorMessage || "Por favor corrige la distribución de porcentajes del plan de pago.");
                    return;
                  }
                }
                setCurrentStep((prev) => Math.min(5, prev + 1));
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.65rem 1.5rem",
                borderRadius: "9999px",
                backgroundColor: "var(--devio-blue-dark)",
                color: "var(--devio-white)",
                fontSize: "0.875rem",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
              }}
            >
              Siguiente <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCompleteSale}
              disabled={isSubmitting}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.65rem 1.75rem",
                borderRadius: "9999px",
                backgroundColor: "var(--devio-green)",
                color: "var(--devio-white)",
                fontSize: "0.875rem",
                fontWeight: 800,
                border: "none",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                boxShadow: "0 4px 14px rgba(0, 196, 140, 0.4)",
              }}
            >
              {isSubmitting ? (
                "Registrando Venta..."
              ) : (
                <>
                  <CheckCircle2 size={18} /> Confirmar y Crear Venta
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ================================================================== */}
      {/* MODAL: PERSONALIZAR PLAN DE PAGO EXCLUSIVO DE LA VENTA */}
      {/* ================================================================== */}
      {isCustomPlanModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(10, 25, 47, 0.78)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100000,
            padding: "1rem",
            animation: "fadeIn 0.15s ease-out",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--devio-white)",
              borderRadius: "1.25rem",
              width: "100%",
              maxWidth: "680px",
              maxHeight: "92vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
              border: "1px solid var(--devio-neutral-1)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid var(--devio-neutral-1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#FAFBFD",
              }}
            >
              <div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--devio-blue-dark)", margin: "0 0 0.2rem" }}>
                  Personalizar Plan de Pago
                </h3>
                <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--devio-neutral-3)" }}>
                  Este esquema aplicará exclusivamente a esta venta (no altera el catálogo global de planes).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomPlanModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--devio-neutral-3)",
                  padding: "0.4rem",
                  borderRadius: "0.4rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleApplyCustomPlanFromModal} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.3rem" }}>
                  Nombre descriptivo del Plan *
                </label>
                <input
                  type="text"
                  value={customModalForm.name}
                  onChange={(e) => setCustomModalForm({ ...customModalForm, name: e.target.value })}
                  placeholder="Ej. Plan Personalizado 15/85 - Cliente Especial"
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.85rem",
                    borderRadius: "0.55rem",
                    border: "1.5px solid var(--devio-neutral-2)",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                  }}
                  required
                />
              </div>

              {/* ¿Cómo se pagará este plan? */}
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.5rem", textAlign: "center" }}>
                  ¿Cómo se pagará este plan?
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div
                    onClick={() => setCustomModalForm({ ...customModalForm, paymentType: "ESQUEMA" })}
                    style={{
                      padding: "0.85rem 1rem",
                      borderRadius: "0.75rem",
                      border: customModalForm.paymentType === "ESQUEMA" ? "2px solid var(--devio-blue)" : "1.5px solid var(--devio-neutral-2)",
                      backgroundColor: customModalForm.paymentType === "ESQUEMA" ? "rgba(47, 128, 237, 0.05)" : "#FFFFFF",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.25rem" }}>
                      <input
                        type="radio"
                        checked={customModalForm.paymentType === "ESQUEMA"}
                        onChange={() => setCustomModalForm({ ...customModalForm, paymentType: "ESQUEMA" })}
                        style={{ accentColor: "var(--devio-blue)" }}
                      />
                      <strong style={{ fontSize: "0.86rem", color: "var(--devio-blue-dark)" }}>Esquema de pago</strong>
                    </div>
                    <p style={{ fontSize: "0.73rem", color: "var(--devio-neutral-3)", margin: 0, lineHeight: 1.35 }}>
                      El cliente pagará mediante enganche, parcialidades y liquidación final.
                    </p>
                  </div>

                  <div
                    onClick={() => setCustomModalForm({ ...customModalForm, paymentType: "CONTADO" })}
                    style={{
                      padding: "0.85rem 1rem",
                      borderRadius: "0.75rem",
                      border: customModalForm.paymentType === "CONTADO" ? "2px solid var(--devio-blue)" : "1.5px solid var(--devio-neutral-2)",
                      backgroundColor: customModalForm.paymentType === "CONTADO" ? "rgba(47, 128, 237, 0.05)" : "#FFFFFF",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.25rem" }}>
                      <input
                        type="radio"
                        checked={customModalForm.paymentType === "CONTADO"}
                        onChange={() => setCustomModalForm({ ...customModalForm, paymentType: "CONTADO" })}
                        style={{ accentColor: "var(--devio-blue)" }}
                      />
                      <strong style={{ fontSize: "0.86rem", color: "var(--devio-blue-dark)" }}>Pago de contado</strong>
                    </div>
                    <p style={{ fontSize: "0.73rem", color: "var(--devio-neutral-3)", margin: 0, lineHeight: 1.35 }}>
                      El cliente liquidará el total en una sola exhibición con o sin descuento.
                    </p>
                  </div>
                </div>
              </div>

              {/* ESQUEMA: Inputs de Enganche, Plazos, Periodicidad y Liquidación */}
              {customModalForm.paymentType === "ESQUEMA" && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.65rem" }}>
                    <div>
                      <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.25rem" }}>
                        Enganche % *
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={customModalForm.downPaymentPercentage}
                        onChange={(e) => setCustomModalForm({ ...customModalForm, downPaymentPercentage: parseFloat(e.target.value) || 0 })}
                        style={{
                          width: "100%",
                          padding: "0.55rem 0.65rem",
                          borderRadius: "0.5rem",
                          border: "1.5px solid var(--devio-neutral-2)",
                          fontSize: "0.85rem",
                          fontWeight: 700,
                        }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.25rem" }}>
                        Plazos / Cuotas
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="120"
                        value={customModalForm.installmentsCount}
                        onChange={(e) => setCustomModalForm({ ...customModalForm, installmentsCount: parseInt(e.target.value) || 0 })}
                        style={{
                          width: "100%",
                          padding: "0.55rem 0.65rem",
                          borderRadius: "0.5rem",
                          border: "1.5px solid var(--devio-neutral-2)",
                          fontSize: "0.85rem",
                          fontWeight: 700,
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.25rem" }}>
                        Periodicidad
                      </label>
                      <select
                        value={customModalForm.periodicity}
                        onChange={(e) => setCustomModalForm({ ...customModalForm, periodicity: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "0.55rem 0.5rem",
                          borderRadius: "0.5rem",
                          border: "1.5px solid var(--devio-neutral-2)",
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          backgroundColor: "#FFFFFF",
                        }}
                      >
                        <option value="Semanal">Semanal</option>
                        <option value="Quincenal">Quincenal</option>
                        <option value="Mensual">Mensual</option>
                        <option value="Bimestral">Bimestral</option>
                        <option value="Trimestral">Trimestral</option>
                        <option value="Semestral">Semestral</option>
                        <option value="Anual">Anual</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.25rem" }}>
                        Liquidación % *
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={customModalForm.settlementPercentage}
                        onChange={(e) => setCustomModalForm({ ...customModalForm, settlementPercentage: parseFloat(e.target.value) || 0 })}
                        style={{
                          width: "100%",
                          padding: "0.55rem 0.65rem",
                          borderRadius: "0.5rem",
                          border: "1.5px solid var(--devio-neutral-2)",
                          fontSize: "0.85rem",
                          fontWeight: 700,
                        }}
                        required
                      />
                    </div>
                  </div>

                  {/* Barra Visual de Distribución Financiera 100% */}
                  <div
                    style={{
                      padding: "0.85rem 1rem",
                      borderRadius: "0.65rem",
                      backgroundColor: modalPlanValidation.isValid ? "rgba(255, 255, 255, 0.8)" : "#FFF5F5",
                      border: modalPlanValidation.isValid ? "1px solid var(--devio-neutral-2)" : "1px solid #FCA5A5",
                      fontSize: "0.78rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                      <span style={{ fontWeight: 600, color: "var(--devio-blue-dark)" }}>
                        Distribución: Enganche ({modalPlanValidation.downPct}%) + {customModalForm.installmentsCount > 0 ? `${customModalForm.installmentsCount} Cuotas (${modalPlanValidation.installmentsPct}%)` : "Sin cuotas"} + Liquidación ({modalPlanValidation.settlementPct}%)
                      </span>
                      <strong style={{ color: modalPlanValidation.isValid ? "var(--devio-green)" : "var(--devio-red)" }}>
                        {modalPlanValidation.isValid ? "✓ Total: 100%" : `⚠ Total: ${modalPlanValidation.totalPct}%`}
                      </strong>
                    </div>
                    <div style={{ height: "8px", backgroundColor: "#E2E8F0", borderRadius: "4px", display: "flex", overflow: "hidden", marginBottom: "0.35rem" }}>
                      <div style={{ width: `${Math.max(0, Math.min(100, modalPlanValidation.downPct))}%`, backgroundColor: "#2F80ED" }} title={`Enganche: ${modalPlanValidation.downPct}%`} />
                      <div style={{ width: `${Math.max(0, Math.min(100, modalPlanValidation.installmentsPct))}%`, backgroundColor: "#F2C94C" }} title={`Cuotas: ${modalPlanValidation.installmentsPct}%`} />
                      <div style={{ width: `${Math.max(0, Math.min(100, modalPlanValidation.settlementPct))}%`, backgroundColor: "#00C48C" }} title={`Liquidación: ${modalPlanValidation.settlementPct}%`} />
                    </div>
                    {modalPlanValidation.isValid && customModalForm.installmentsCount > 0 && modalPlanValidation.installmentsPct > 0 && (
                      <span style={{ color: "var(--devio-neutral-3)", fontSize: "0.74rem" }}>
                        Cada cuota ({customModalForm.periodicity}) es del {(modalPlanValidation.installmentsPct / customModalForm.installmentsCount).toFixed(2)}% del valor neto.
                      </span>
                    )}
                  </div>

                  {/* ALERTA DE ERROR Y SUGERENCIAS DE CORRECCIÓN RÁPIDA (1-CLIC) */}
                  {!modalPlanValidation.isValid && modalPlanValidation.errorMessage && (
                    <div
                      style={{
                        backgroundColor: "#FEF2F2",
                        border: "1px solid #F87171",
                        borderRadius: "0.65rem",
                        padding: "0.85rem 1rem",
                        animation: "fadeIn 0.2s ease-in-out",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
                        <AlertCircle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: "2px" }} />
                        <div style={{ flex: 1 }}>
                          <h5 style={{ margin: "0 0 0.2rem", fontSize: "0.84rem", fontWeight: 700, color: "#991B1B" }}>
                            {modalPlanValidation.errorTitle}
                          </h5>
                          <p style={{ margin: 0, fontSize: "0.78rem", color: "#B91C1C", lineHeight: 1.4 }}>
                            {modalPlanValidation.errorMessage}
                          </p>

                          {modalPlanValidation.fixes.length > 0 && (
                            <div style={{ marginTop: "0.6rem" }}>
                              <span style={{ fontSize: "0.73rem", fontWeight: 700, color: "#7F1D1D", display: "block", marginBottom: "0.35rem" }}>
                                💡 Sugerencias de corrección rápida (1-clic):
                              </span>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                                {modalPlanValidation.fixes.map((fix, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={fix.action}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "0.35rem",
                                      backgroundColor: "#FFFFFF",
                                      border: "1px solid #FCA5A5",
                                      color: "#991B1B",
                                      borderRadius: "6px",
                                      padding: "0.35rem 0.65rem",
                                      fontSize: "0.74rem",
                                      fontWeight: 600,
                                      cursor: "pointer",
                                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                                      transition: "all 0.15s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = "#FEE2E2";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = "#FFFFFF";
                                    }}
                                  >
                                    <Sparkles size={13} color="#DC2626" />
                                    {fix.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Interés y Descuento */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <div>
                      <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.25rem" }}>
                        Interés %
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={customModalForm.interestPercentage}
                        onChange={(e) => setCustomModalForm({ ...customModalForm, interestPercentage: parseFloat(e.target.value) || 0 })}
                        style={{
                          width: "100%",
                          padding: "0.55rem 0.65rem",
                          borderRadius: "0.5rem",
                          border: "1.5px solid var(--devio-neutral-2)",
                          fontSize: "0.85rem",
                          fontWeight: 700,
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.25rem" }}>
                        Descuento %
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={customModalForm.discountPercentage}
                        onChange={(e) => setCustomModalForm({ ...customModalForm, discountPercentage: parseFloat(e.target.value) || 0 })}
                        style={{
                          width: "100%",
                          padding: "0.55rem 0.65rem",
                          borderRadius: "0.5rem",
                          border: "1.5px solid var(--devio-neutral-2)",
                          fontSize: "0.85rem",
                          fontWeight: 700,
                        }}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* CONTADO: Input de Descuento */}
              {customModalForm.paymentType === "CONTADO" && (
                <div>
                  <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.25rem" }}>
                    Descuento por Pago de Contado (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={customModalForm.discountPercentage}
                    onChange={(e) => setCustomModalForm({ ...customModalForm, discountPercentage: parseFloat(e.target.value) || 0 })}
                    placeholder="Ej. 10"
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.65rem",
                      borderRadius: "0.5rem",
                      border: "1.5px solid var(--devio-neutral-2)",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                    }}
                  />
                  <span style={{ fontSize: "0.72rem", color: "var(--devio-neutral-3)", marginTop: "0.25rem", display: "block" }}>
                    El comprador liquida el 100% en una sola exhibición con este descuento.
                  </span>
                </div>
              )}

              {/* Notas Internas */}
              <div>
                <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.25rem" }}>
                  Notas Internas del Plan
                </label>
                <textarea
                  value={customModalForm.internalNotes}
                  onChange={(e) => setCustomModalForm({ ...customModalForm, internalNotes: e.target.value })}
                  placeholder="Detalles sobre acuerdos comerciales o condiciones especiales..."
                  rows={2}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "0.5rem",
                    border: "1.5px solid var(--devio-neutral-2)",
                    fontSize: "0.82rem",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              {/* Modal Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setIsCustomPlanModalOpen(false)}
                  style={{
                    padding: "0.6rem 1.25rem",
                    borderRadius: "0.5rem",
                    border: "1px solid var(--devio-neutral-2)",
                    backgroundColor: "#FFFFFF",
                    color: "var(--devio-neutral-4)",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!modalPlanValidation.isValid}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.6rem 1.4rem",
                    borderRadius: "0.5rem",
                    backgroundColor: modalPlanValidation.isValid ? "var(--devio-blue-dark)" : "#94A3B8",
                    color: "var(--devio-white)",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: modalPlanValidation.isValid ? "pointer" : "not-allowed",
                    boxShadow: modalPlanValidation.isValid ? "0 4px 12px rgba(31, 54, 82, 0.25)" : "none",
                  }}
                >
                  <CheckCircle2 size={16} /> Aplicar a esta Venta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
