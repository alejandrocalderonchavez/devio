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
import { resolveProjectLogo } from "../../lib/pdf-generator";
import {
  getMexicoDateISO,
  getMexicoNow,
  parseDateSafe,
  formatDateISO,
  formatDateMX,
  calculateInstallmentDate,
} from "../../lib/date-utils";

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

export interface CoOwnerPaymentConfig {
  id: string;
  name: string;
  email: string;
  phone?: string;
  rfc?: string;
  ownershipPct: number;
  paymentOption: "FULL" | "PARTIAL" | "NONE";
  paymentAmount: number;
  paymentMethod: string;
  paymentReference: string;
  sendCredentials: boolean;
  sendSaleConfirmationEmail: boolean;
  sendReceiptEmail: boolean;
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
  const [dbClients, setDbClients] = useState<ClientData[]>([]);

  // Fetch registered clients from database catalog
  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/clients")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && Array.isArray(data.clients)) {
          const mapped: ClientData[] = data.clients
            .filter((c: any) => c.fullName && c.fullName.trim().length >= 2)
            .map((c: any) => ({
              name: c.fullName.trim(),
              email: (c.email || "").trim(),
              phone: (c.phone || "").trim(),
              rfc: (c.taxId || c.rfc || "").trim(),
              isExisting: true,
            }));
          setDbClients(mapped);
        }
      })
      .catch((err) => console.warn("Error loading clients from API:", err));
  }, [isOpen]);

  // Primary Client
  const [primaryClient, setPrimaryClient] = useState<CoOwner>({
    id: "",
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

  // Collect existing registered clients strictly from catalog & real sales
  const existingClients = useMemo(() => {
    const clientsMap: Record<string, ClientData> = {};
    const invalidNames = new Set([
      "-",
      "sin asignar",
      "disponible",
      "bloqueada",
      "apartada",
      "null",
      "undefined",
      "departamento",
      "casa",
      "terreno",
      "local",
      "bodega",
      "cliente",
      "cliente devio",
      "propietario",
    ]);

    const isValidClientName = (name?: string) => {
      if (!name) return false;
      const clean = name.trim().toLowerCase();
      if (clean.length < 3) return false;
      if (invalidNames.has(clean)) return false;
      // Filter out pure unit numbers or placeholders
      if (/^(\d+|u-\d+|unidad\s*\d+)$/i.test(clean)) return false;
      return true;
    };

    // 1. Add DB catalog clients first
    dbClients.forEach((c) => {
      if (isValidClientName(c.name)) {
        const key = (c.email || c.name).toLowerCase().trim();
        clientsMap[key] = { ...c, isExisting: true };
      }
    });

    // 2. Add real clients from projects sales
    projects.forEach((p) => {
      (p.sales || []).forEach((s) => {
        if (s.status !== "CANCELADA" && isValidClientName(s.clientName)) {
          const key = (s.clientEmail || s.clientName).toLowerCase().trim();
          if (!clientsMap[key]) {
            clientsMap[key] = {
              name: s.clientName.trim(),
              email: s.clientEmail || "",
              phone: s.clientPhone || "",
              rfc: s.clientRfc || "",
              isExisting: true,
            };
          }
        }
        (s.coOwners || []).forEach((co) => {
          if (isValidClientName(co.name)) {
            const coKey = (co.email || co.name).toLowerCase().trim();
            if (!clientsMap[coKey]) {
              clientsMap[coKey] = {
                name: co.name.trim(),
                email: co.email || "",
                phone: co.phone || "",
                rfc: co.rfc || "",
                isExisting: true,
              };
            }
          }
        });
      });
    });

    return Object.values(clientsMap).sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [dbClients, projects]);

  // Centralized client lookup helper
  const findExistingClient = (email?: string, name?: string): ClientData | null => {
    const trimmedEmail = (email || "").trim().toLowerCase();
    const trimmedName = (name || "").trim().toLowerCase();
    if (!trimmedEmail && !trimmedName) return null;

    let found = (existingClients || []).find(
      (c) =>
        (trimmedEmail && c.email && c.email.toLowerCase() === trimmedEmail) ||
        (!trimmedEmail && trimmedName && c.name && c.name.toLowerCase() === trimmedName)
    );

    if (!found && typeof window !== "undefined") {
      try {
        const storedClients = localStorage.getItem("devio_client_portal_users") || sessionStorage.getItem("devio_client_portal_users");
        const storedSys = localStorage.getItem("devio_system_users") || sessionStorage.getItem("devio_system_users");
        const combined = [
          ...(storedClients ? JSON.parse(storedClients) : []),
          ...(storedSys ? JSON.parse(storedSys) : []),
        ];

        if (Array.isArray(combined)) {
          const inUsers = combined.find(
            (u: any) =>
              (trimmedEmail && u.email && u.email.toLowerCase() === trimmedEmail) ||
              (!trimmedEmail && trimmedName && u.name && u.name.toLowerCase() === trimmedName)
          );
          if (inUsers && inUsers.name && inUsers.name.trim().length >= 3) {
            found = {
              name: inUsers.name || inUsers.fullName || "",
              email: inUsers.email || "",
              phone: inUsers.phone || "",
              rfc: inUsers.rfc || "",
              isExisting: true,
            };
          }
        }
      } catch {
        // ignore
      }
    }

    return found || null;
  };

  // Primary client email/name lookup & autofill
  useEffect(() => {
    const trimmedEmail = (primaryClient.email || "").trim().toLowerCase();
    const trimmedName = (primaryClient.name || "").trim().toLowerCase();
    if (!trimmedEmail && !trimmedName) {
      setIsPrimaryFound(false);
      return;
    }

    const found = findExistingClient(primaryClient.email, primaryClient.name);

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

  const isClientInCatalog = (email?: string, name?: string) => {
    return !!findExistingClient(email, name);
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
            id: `co-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
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
    const newId = `co-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
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
        const updated: any = { ...co, [field]: val };

        if (field === "email" || field === "name") {
          const checkEmail = field === "email" ? val : co.email;
          const checkName = field === "name" ? val : co.name;
          const found = findExistingClient(checkEmail, checkName);
          if (found) {
            if (field === "email") {
              if (found.name) updated.name = found.name;
              if (found.phone) updated.phone = found.phone;
              if (found.rfc) updated.rfc = found.rfc;
            } else if (field === "name" && !co.email && found.email) {
              updated.email = found.email;
              if (found.phone) updated.phone = found.phone;
              if (found.rfc) updated.rfc = found.rfc;
            }
            updated.isFound = true;
          } else {
            updated.isFound = false;
          }
        }
        return updated;
      })
    );
  };

  // Distribute equally helper
  const distributeEqually = (prim: CoOwner, coList: CoOwner[]) => {
    const totalPeople = 1 + coList.length;
    if (totalPeople <= 0) return;
    const precisePct = Math.round((100 / totalPeople) * 100) / 100;
    const primaryPct = Math.round((100 - precisePct * (totalPeople - 1)) * 100) / 100;

    setPrimaryClient((prev) => ({ ...prev, ownershipPct: primaryPct }));
    setCoOwnersList((prev) =>
      prev.map((co) => ({ ...co, ownershipPct: precisePct }))
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

  const [activePlanView, setActivePlanView] = useState<"global" | "co_owners">("global");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("custom");
  const [customPlanName, setCustomPlanName] = useState("Plan Personalizado de Venta");
  const [paymentType, setPaymentType] = useState<"ESQUEMA" | "CONTADO">("ESQUEMA");
  const [saleDate, setSaleDate] = useState(() => getMexicoDateISO());
  const [monthlyCutoffDay, setMonthlyCutoffDay] = useState<number>(() => {
    const p = parseDateSafe(getMexicoDateISO());
    return p?.day || 1;
  });
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
        id: initialQuote.clientEmail
          ? `cli-${initialQuote.clientEmail.toLowerCase().replace(/[^a-z0-9]/g, "-")}`
          : `cli-${Date.now()}`,
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
    const parsed = parseDateSafe(dateStr);
    if (parsed) return parsed;
    const d = getMexicoNow();
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
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
    const sumDownSettlement = Math.round((down + settlement) * 100) / 100;
    const remainingPct = Math.round((100 - sumDownSettlement) * 100) / 100;
    const totalPct = Math.round((down + (plazos > 0 ? Math.max(0, remainingPct) : 0) + settlement) * 100) / 100;

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

    if (sumDownSettlement > 100.001) {
      const excess = Math.round((sumDownSettlement - 100) * 100) / 100;
      return {
        isValid: false,
        errorTitle: "Porcentajes excedidos (>100%)",
        errorMessage: `El Enganche (${down}%) y la Liquidación (${settlement}%) suman ${sumDownSettlement}%, excediendo el 100% total por ${excess}%.`,
        fixes: [
          {
            label: `Ajustar Liquidación a ${Math.max(0, Math.round((100 - down) * 100) / 100)}%`,
            action: () => setCustomModalForm((prev) => ({ ...prev, settlementPercentage: Math.max(0, Math.round((100 - down) * 100) / 100) })),
          },
          {
            label: `Ajustar Enganche a ${Math.max(0, Math.round((100 - settlement) * 100) / 100)}%`,
            action: () => setCustomModalForm((prev) => ({ ...prev, downPaymentPercentage: Math.max(0, Math.round((100 - settlement) * 100) / 100) })),
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

    if (Math.abs(sumDownSettlement - 100) < 0.001 && plazos > 0) {
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

    if (sumDownSettlement < 99.999 && plazos === 0) {
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
    const sumDownSettlement = Math.round((down + settlement) * 100) / 100;
    const remainingPct = Math.round((100 - sumDownSettlement) * 100) / 100;
    const totalPct = Math.round((down + (plazos > 0 ? Math.max(0, remainingPct) : 0) + settlement) * 100) / 100;

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

    if (sumDownSettlement > 100.001) {
      const excess = Math.round((sumDownSettlement - 100) * 100) / 100;
      return {
        isValid: false,
        errorTitle: "Porcentajes excedidos (>100%)",
        errorMessage: `El Enganche (${down}%) y la Liquidación (${settlement}%) suman ${sumDownSettlement}%, excediendo el 100% total por ${excess}%.`,
        fixes: [
          {
            label: `Ajustar Liquidación a ${Math.max(0, Math.round((100 - down) * 100) / 100)}%`,
            action: () => {
              setBalloonLiquidationPct(Math.max(0, Math.round((100 - down) * 100) / 100));
              setSelectedPlanId("custom");
              setCustomPlanName("Plan Personalizado");
            },
          },
          {
            label: `Ajustar Enganche a ${Math.max(0, Math.round((100 - settlement) * 100) / 100)}%`,
            action: () => {
              setDownPaymentPct(Math.max(0, Math.round((100 - settlement) * 100) / 100));
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

    if (Math.abs(sumDownSettlement - 100) < 0.001 && plazos > 0) {
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

    if (sumDownSettlement < 99.999 && plazos === 0) {
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

    const downPayment = Math.round(netTotalSaleAmount * (downPaymentPct / 100) * 100) / 100;
    const liquidation = Math.round(netTotalSaleAmount * (balloonLiquidationPct / 100) * 100) / 100;
    const remainingForInstallments = Math.max(0, Math.round((netTotalSaleAmount - downPayment - liquidation) * 100) / 100);
    const baseInstallmentAmount = installmentsCount > 0 ? Math.floor((remainingForInstallments / installmentsCount) * 100) / 100 : 0;

    // 1. Enganche row (Fecha inicial / Hoy)
    rows.push({
      id: "row-enganche",
      concept: "Enganche",
      date: saleDate || formatDateISO(year, month, startDay),
      amount: downPayment,
    });

    // 2. Parcialidades con reconciliación de centavos en la última cuota
    let sumInstallments = 0;
    for (let i = 1; i <= installmentsCount; i++) {
      const formattedDate = calculateInstallmentDate(saleDate, i, periodicity, monthlyCutoffDay);
      let amt = baseInstallmentAmount;
      if (i === installmentsCount) {
        amt = Math.max(0, Math.round((remainingForInstallments - sumInstallments) * 100) / 100);
      } else {
        sumInstallments = Math.round((sumInstallments + amt) * 100) / 100;
      }
      rows.push({
        id: `row-cuota-${i}`,
        concept: `Cuota ${i} (${periodicity})`,
        date: formattedDate,
        amount: amt,
      });
    }

    // 3. Liquidación row
    if (balloonLiquidationPct > 0) {
      const deliveryDate = calculateInstallmentDate(saleDate, installmentsCount + 1, periodicity, monthlyCutoffDay);
      let finalLiquidation = liquidation;
      if (installmentsCount === 0) {
        finalLiquidation = Math.max(0, Math.round((netTotalSaleAmount - downPayment) * 100) / 100);
      }
      rows.push({
        id: "row-liquidacion",
        concept: "Liquidación Final",
        date: deliveryDate,
        amount: finalLiquidation,
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

  const handleUpdateRowConcept = (id: string, newConcept: string) => {
    setPaymentSchedule((prev) =>
      prev.map((r) => (r.id === id ? { ...r, concept: newConcept } : r))
    );
  };

  const handleAddRowAfter = (index: number) => {
    const currentRow = paymentSchedule[index];
    const prevDate = currentRow?.date || saleDate || new Date().toISOString().split("T")[0];
    const nextDate = calculateInstallmentDate(prevDate, 1, periodicity || "Mensual", monthlyCutoffDay);
    const newRow = {
      id: `row-custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      concept: `Cuota ${paymentSchedule.length + 1}`,
      date: nextDate,
      amount: 0,
    };
    const updated = [...paymentSchedule];
    updated.splice(index + 1, 0, newRow);
    setPaymentSchedule(updated);
  };

  const handleAddRowAtEnd = () => {
    const lastRow = paymentSchedule[paymentSchedule.length - 1];
    const prevDate = lastRow?.date || saleDate || new Date().toISOString().split("T")[0];
    const nextDate = calculateInstallmentDate(prevDate, 1, periodicity || "Mensual", monthlyCutoffDay);
    const newRow = {
      id: `row-custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      concept: `Cuota ${paymentSchedule.length + 1}`,
      date: nextDate,
      amount: 0,
    };
    setPaymentSchedule((prev) => [...prev, newRow]);
  };

  const handleDeleteRow = (id: string) => {
    if (paymentSchedule.length <= 1) {
      return;
    }
    setPaymentSchedule((prev) => prev.filter((r) => r.id !== id));
  };

  // Bulk update all monthly dates to a specific cutoff day
  const handleBulkCutoffDayChange = (newDay: number) => {
    setMonthlyCutoffDay(newDay);

    setPaymentSchedule((prev) =>
      prev.map((row, idx) => {
        if (idx === 0) return row; // Keep down payment date
        if (row.id === "row-liquidacion") {
          return { ...row, date: calculateInstallmentDate(saleDate, installmentsCount + 1, periodicity, newDay) };
        }
        return { ...row, date: calculateInstallmentDate(saleDate, idx, periodicity, newDay) };
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

  // Per-co-owner payment settings when isCoOwnership is true
  const [coOwnerPaymentSettings, setCoOwnerPaymentSettings] = useState<Record<string, CoOwnerPaymentConfig>>({});

  useEffect(() => {
    if (paymentSchedule.length > 0 && paymentSchedule[0]) {
      if (initialPaymentOption === "FULL") {
        setInitialPaymentAmount(paymentSchedule[0].amount);
      }
    }
  }, [paymentSchedule, initialPaymentOption]);

  // Synchronize co-owners payment settings when co-owners or schedule change
  useEffect(() => {
    if (!isCoOwnership) return;
    const totalDownPayment = paymentSchedule[0]?.amount || Math.round(netTotalSaleAmount * (downPaymentPct / 100));

    setCoOwnerPaymentSettings((prev) => {
      const next: Record<string, CoOwnerPaymentConfig> = {};
      allOwnersCombined.forEach((owner) => {
        const ownerKey = owner.id || owner.email || owner.name || "owner";
        const expectedDown = Math.round(totalDownPayment * (Number(owner.ownershipPct || 0) / 100));
        const prevSetting = prev[ownerKey] || prev[owner.id];
        const isClientInCat = isClientInCatalog(owner.email, owner.name);

        if (prevSetting) {
          next[ownerKey] = {
            ...prevSetting,
            id: owner.id,
            name: owner.name,
            email: owner.email,
            phone: owner.phone,
            rfc: owner.rfc,
            ownershipPct: owner.ownershipPct,
            paymentAmount: prevSetting.paymentOption === "FULL" ? expectedDown : prevSetting.paymentAmount,
          };
        } else {
          next[ownerKey] = {
            id: owner.id,
            name: owner.name,
            email: owner.email,
            phone: owner.phone,
            rfc: owner.rfc,
            ownershipPct: owner.ownershipPct,
            paymentOption: "FULL",
            paymentAmount: expectedDown,
            paymentMethod: "transferencia",
            paymentReference: "",
            sendCredentials: !isClientInCat,
            sendSaleConfirmationEmail: true,
            sendReceiptEmail: true,
          };
        }
      });
      return next;
    });
  }, [allOwnersCombined, isCoOwnership, paymentSchedule, netTotalSaleAmount, downPaymentPct]);

  // --------------------------------------------------------------------------
  // FINALIZE SALE
  // --------------------------------------------------------------------------
  const handleCompleteSale = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const targetProjId = selectedProjectId || currentProject?.id || projects[0]?.id || "p-1";
      const clientTargetId = (primaryClient.id && primaryClient.id !== "primary-1")
        ? primaryClient.id
        : primaryClient.email
        ? `cli-${primaryClient.email.toLowerCase().replace(/[^a-z0-9]/g, "-")}`
        : `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      const finalCoOwners = allOwnersCombined.map((owner, idx) => {
        const isPrim = Boolean(owner.isPrimary || idx === 0);
        let resolvedOwnerId = "";
        if (isPrim) {
          resolvedOwnerId = clientTargetId;
        } else if (owner.id && owner.id !== "primary-1" && !owner.id.startsWith("primary-")) {
          resolvedOwnerId = owner.id;
        } else if (owner.email) {
          resolvedOwnerId = `cli-${owner.email.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
        } else {
          resolvedOwnerId = `co-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`;
        }

        return {
          ...owner,
          id: resolvedOwnerId,
          isPrimary: isPrim,
        };
      });

      // Helper to reliably find co-owner payment setting regardless of id or email changes
      const resolveOwnerConfig = (owner: any): CoOwnerPaymentConfig => {
        const normEmail = owner.email ? owner.email.toLowerCase().trim() : "";
        const normName = owner.name ? owner.name.toLowerCase().trim() : "";
        
        for (const [key, val] of Object.entries(coOwnerPaymentSettings)) {
          if (owner.id && key === owner.id) return val;
          if (val.id && val.id === owner.id) return val;
          if (normEmail && (key.toLowerCase() === normEmail || val.email?.toLowerCase().trim() === normEmail)) return val;
          if (normName && (key.toLowerCase() === normName || val.name?.toLowerCase().trim() === normName)) return val;
        }

        const expectedDown = Math.round(totalDown * (Number(owner.ownershipPct || 0) / 100));
        return {
          id: owner.id,
          name: owner.name,
          email: owner.email,
          phone: owner.phone,
          rfc: owner.rfc,
          ownershipPct: owner.ownershipPct,
          paymentOption: "FULL",
          paymentAmount: expectedDown,
          paymentMethod: "transferencia",
          paymentReference: "",
          sendCredentials: true,
          sendSaleConfirmationEmail: true,
          sendReceiptEmail: true,
        };
      };

      // Build co-owner payment records
      const totalDown = paymentSchedule[0]?.amount || Math.round(netTotalSaleAmount * (downPaymentPct / 100));
      const coOwnerPayments = isCoOwnership
        ? finalCoOwners.map((owner) => {
            const cfg = resolveOwnerConfig(owner);
            const isNone = cfg.paymentOption === "NONE";
            const payAmt = isNone ? 0 : (Number(cfg.paymentAmount) || 0);
            return {
              clientId: owner.id,
              name: owner.name,
              email: owner.email,
              phone: owner.phone,
              rfc: owner.rfc,
              ownershipPct: owner.ownershipPct,
              amount: payAmt,
              method: cfg.paymentMethod || "transferencia",
              reference: cfg.paymentReference || "",
              paymentMode: cfg.paymentOption,
              sendReceiptEmail: !isNone && payAmt > 0 && Boolean(cfg.sendReceiptEmail),
            };
          })
        : [];

      const totalCoOwnerPaid = coOwnerPayments.reduce((acc, cp) => acc + (cp.amount || 0), 0);
      const effectiveInitialPaid = isCoOwnership
        ? totalCoOwnerPaid
        : (initialPaymentOption === "NONE" ? 0 : initialPaymentAmount);

      // Register / persist client portal users in devio_client_portal_users and clean devio_system_users
      if (typeof window !== "undefined") {
        try {
          // 1. Save to dedicated client portal users storage
          const storedClients = localStorage.getItem("devio_client_portal_users") || sessionStorage.getItem("devio_client_portal_users");
          let clientPortalUsers: any[] = [];
          if (storedClients) {
            clientPortalUsers = JSON.parse(storedClients);
          }

          finalCoOwners.forEach((owner) => {
            if (!owner.email) return;
            const existingIdx = clientPortalUsers.findIndex((u) => u.email?.toLowerCase() === owner.email.toLowerCase());
            if (existingIdx === -1) {
              clientPortalUsers.push({
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

          localStorage.setItem("devio_client_portal_users", JSON.stringify(clientPortalUsers));
          sessionStorage.setItem("devio_client_portal_users", JSON.stringify(clientPortalUsers));

          // 2. Ensure devio_system_users NEVER contains users with role CLIENT or CLIENTE
          const storedSys = localStorage.getItem("devio_system_users") || sessionStorage.getItem("devio_system_users");
          if (storedSys) {
            const parsedSys = JSON.parse(storedSys);
            if (Array.isArray(parsedSys)) {
              const cleanSys = parsedSys.filter(
                (u: any) => u.role && u.role.toUpperCase() !== "CLIENT" && u.role.toUpperCase() !== "CLIENTE"
              );
              localStorage.setItem("devio_system_users", JSON.stringify(cleanSys));
              sessionStorage.setItem("devio_system_users", JSON.stringify(cleanSys));
            }
          }
        } catch (err) {
          console.error("Error managing client users storage:", err);
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
        coOwners: finalCoOwners.map((co) => ({
          ...co,
          percentage: Number(co.ownershipPct),
          ownershipPercentage: Number(co.ownershipPct),
        })),
        coOwnerPayments,
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
          title: row.concept,
          date: row.date,
          dueDate: row.date,
          scheduledDate: row.date,
          amount: row.amount,
          scheduledAmount: row.amount,
          originalAmount: row.amount,
        })),
        quoteId: initialQuote?.id,
        initialPayment: {
          registered: effectiveInitialPaid > 0,
          option: isCoOwnership ? (effectiveInitialPaid > 0 ? "FULL" : "NONE") : initialPaymentOption,
          amount: effectiveInitialPaid,
          method: isCoOwnership ? (coOwnerPayments[0]?.method || "transferencia") : (initialPaymentOption === "NONE" ? undefined : paymentMethod),
          reference: isCoOwnership ? (coOwnerPayments[0]?.reference || "") : (initialPaymentOption === "NONE" ? undefined : paymentReference),
          sendCredentialsToAll,
          sendSaleConfirmationEmail,
          sendReceiptEmail: effectiveInitialPaid > 0 && sendReceiptEmail,
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
      allOwnersCombined.forEach(async (owner, idx) => {
        if (!owner.email) return;
        const cfg = isCoOwnership ? resolveOwnerConfig(owner) : null;

        const isExistingUser =
          (owner.isPrimary && isPrimaryFound) ||
          isClientInCatalog(owner.email, owner.name) ||
          Boolean((owner as any).isExisting);

        const tempPassword = `Devio-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        const loginLink = typeof window !== "undefined" ? `${window.location.origin}/login` : "https://devio.lat/login";
        const projName = currentProject?.name || "Proyecto Inmobiliario";
        const devName = currentProject?.name ? `${currentProject.name} (Desarrolladora)` : "Desarrolladora Inmobiliaria";

        const devLogo =
          (typeof window !== "undefined" && (localStorage.getItem("devio_developer_logo") || sessionStorage.getItem("devio_developer_logo"))) ||
          "";
        const projLogo = resolveProjectLogo(currentProject, devLogo);

        const shouldSendCredentials = isCoOwnership
          ? (cfg?.sendCredentials !== false)
          : sendCredentialsToAll;

        const shouldSendConfirmation = isCoOwnership
          ? (cfg?.sendSaleConfirmationEmail !== false)
          : sendSaleConfirmationEmail;

        const isNonePayment = isCoOwnership
          ? cfg?.paymentOption === "NONE"
          : initialPaymentOption === "NONE";

        const ownerPaymentAmount = isCoOwnership
          ? (isNonePayment ? 0 : (Number(cfg?.paymentAmount) || 0))
          : (isNonePayment ? 0 : initialPaymentAmount);

        const ownerPaymentMethod = isCoOwnership
          ? (cfg?.paymentMethod || "transferencia")
          : paymentMethod;

        const shouldSendReceipt = isCoOwnership
          ? (!isNonePayment && cfg?.sendReceiptEmail !== false && ownerPaymentAmount > 0)
          : (!isNonePayment && sendReceiptEmail && ownerPaymentAmount > 0);

        // 1. Envío obligatorio de credenciales de acceso
        if (shouldSendCredentials) {
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
        }

        // 2. Envío de confirmación de venta y asignación de unidad
        if (shouldSendConfirmation) {
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
        if (shouldSendReceipt) {
          const receiptFolio = isCoOwnership
            ? `REC-${new Date().getFullYear()}-${String(idx + 1).padStart(3, "0")}`
            : "REC-2026-001";

          sendAndLogNotification({
            to: owner.email,
            templateAlias: "recibo-pago",
            templateModel: {
              nombre: owner.name,
              correo: owner.email,
              proyecto: projName,
              unidad: selectedUnitNumber,
              folio_recibo: receiptFolio,
              monto_pagado: formatMoney(ownerPaymentAmount),
              concepto: `Pago de Enganche Inicial (${isCoOwnership ? `Copropiedad ${owner.ownershipPct}%` : "Total"})`,
              metodo_pago:
                ownerPaymentMethod === "transferencia"
                  ? "Transferencia SPEI"
                  : ownerPaymentMethod === "cheque"
                  ? "Cheque de Caja"
                  : ownerPaymentMethod === "tarjeta"
                  ? "Tarjeta Bancaria"
                  : ownerPaymentMethod === "efectivo"
                  ? "Efectivo"
                  : "Depósito Bancario",
              fecha_pago: new Date().toLocaleDateString("es-MX"),
              saldo_pendiente: formatMoney(Math.max(0, (netTotalSaleAmount * ((owner.ownershipPct || 100) / 100)) - ownerPaymentAmount)),
              desarrolladora: devName,
              logo_proyecto: projLogo,
              logo_desarrolladora: devLogo,
              url_recibo: `${loginLink}?redirect=/projects/${targetProjId}/clients/${clientTargetId}`,
              link_recibo: `${loginLink}?redirect=/projects/${targetProjId}/clients/${clientTargetId}`,
              recibo_url: `${loginLink}?redirect=/projects/${targetProjId}/clients/${clientTargetId}`,
              url: `${loginLink}?redirect=/projects/${targetProjId}/clients/${clientTargetId}`,
              link: `${loginLink}?redirect=/projects/${targetProjId}/clients/${clientTargetId}`,
              pdf_url: `${loginLink}?redirect=/projects/${targetProjId}/clients/${clientTargetId}`,
              link_documento: `${loginLink}?redirect=/projects/${targetProjId}/clients/${clientTargetId}`,
              portal_link: loginLink,
              login_link: loginLink,
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
      const unitQuery = selectedUnitNumber ? `?unit=${encodeURIComponent(selectedUnitNumber)}` : "";
      router.push(`/projects/${targetProjId}/clients/${clientTargetId}${unitQuery}`);
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

              {/* Selector UI/UX Claro: Propietario Único vs Copropiedad */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                {/* Card 1: Propietario Único */}
                <button
                  type="button"
                  onClick={() => handleToggleCoOwnership(false)}
                  style={{
                    padding: "1rem 1.15rem",
                    borderRadius: "0.85rem",
                    border: !isCoOwnership ? "2px solid #2F80ED" : "1.5px solid var(--devio-neutral-1)",
                    backgroundColor: !isCoOwnership ? "rgba(47, 128, 237, 0.05)" : "#FFFFFF",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.85rem",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "8px",
                      backgroundColor: !isCoOwnership ? "var(--devio-blue)" : "rgba(31, 54, 82, 0.08)",
                      color: !isCoOwnership ? "#FFFFFF" : "var(--devio-blue-dark)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <User size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <strong style={{ fontSize: "0.92rem", color: "var(--devio-blue-dark)" }}>
                        Propietario Único
                      </strong>
                      {!isCoOwnership && (
                        <span style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "var(--devio-blue)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800 }}>
                          ✓
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: "0.76rem", color: "var(--devio-neutral-3)", margin: "0.25rem 0 0", lineHeight: 1.35 }}>
                      Venta individual asignada a un solo titular (100% de propiedad).
                    </p>
                  </div>
                </button>

                {/* Card 2: Copropiedad */}
                <button
                  type="button"
                  onClick={() => handleToggleCoOwnership(true)}
                  style={{
                    padding: "1rem 1.15rem",
                    borderRadius: "0.85rem",
                    border: isCoOwnership ? "2px solid #00C48C" : "1.5px solid var(--devio-neutral-1)",
                    backgroundColor: isCoOwnership ? "rgba(0, 196, 140, 0.06)" : "#FFFFFF",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.85rem",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "8px",
                      backgroundColor: isCoOwnership ? "var(--devio-green)" : "rgba(31, 54, 82, 0.08)",
                      color: isCoOwnership ? "#FFFFFF" : "var(--devio-blue-dark)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Users size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <strong style={{ fontSize: "0.92rem", color: "var(--devio-blue-dark)" }}>
                        Copropiedad (Varios Titulares)
                      </strong>
                      {isCoOwnership && (
                        <span style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "var(--devio-green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800 }}>
                          ✓
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: "0.76rem", color: "var(--devio-neutral-3)", margin: "0.25rem 0 0", lineHeight: 1.35 }}>
                      Venta compartida entre 2 o más compradores con porcentajes que sumen 100%.
                    </p>
                  </div>
                </button>
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

                  {!isOwnershipBalanced && (
                    <div
                      style={{
                        backgroundColor: "rgba(224, 83, 69, 0.08)",
                        border: "1.5px solid rgba(224, 83, 69, 0.35)",
                        borderRadius: "0.65rem",
                        padding: "0.65rem 0.85rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.78rem",
                        color: "var(--devio-red)",
                        fontWeight: 600,
                      }}
                    >
                      <AlertCircle size={16} style={{ flexShrink: 0 }} />
                      <span>
                        La suma de las participaciones debe ser exactamente <strong>100%</strong> para avanzar. (Suma actual: <strong>{totalOwnershipPct}%</strong>)
                      </span>
                    </div>
                  )}
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
                        min={0.01}
                        max={100}
                        step="any"
                        value={primaryClient.ownershipPct}
                        onChange={(e) =>
                          setPrimaryClient((prev) => ({
                            ...prev,
                            ownershipPct: parseFloat(e.target.value) || 0,
                          }))
                        }
                        style={{
                          width: "75px",
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
                  {coOwnersList.map((co, index) => {
                    const coIsFound = (co as any).isFound || isClientInCatalog(co.email, co.name);
                    return (
                      <div
                        key={co.id}
                        style={{
                          backgroundColor: "#FAFBFD",
                          padding: "1.25rem",
                          borderRadius: "1rem",
                          border: coIsFound ? "1.5px solid var(--devio-green)" : "1px solid var(--devio-neutral-2)",
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
                            {coIsFound ? (
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
                            ) : co.email?.trim() ? (
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
                                min={0.01}
                                max={100}
                                step="any"
                                value={co.ownershipPct}
                                onChange={(e) => handleUpdateCoOwner(co.id, "ownershipPct", parseFloat(e.target.value) || 0)}
                                style={{
                                  width: "75px",
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

                        {/* Status Notice (Existing Client Isolation vs New Client Creation) */}
                        {coIsFound ? (
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
                        ) : co.email?.trim() ? (
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
                              <Mail size={13} style={{ color: "var(--devio-blue)" }} /> Correo Electrónico (Acceso propio) *
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
                                border: coIsFound ? "1.5px solid var(--devio-green)" : "1px solid var(--devio-neutral-2)",
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
                    );
                  })}

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
                  {isCoOwnership
                    ? "Configura las condiciones del plan global y revisa el desglose proporcional exacto para cada uno de los copropietarios."
                    : "Elige el plan de pago que se aplicará a esta venta. El sistema calculará el desglose financiero exacto."}
                </p>
              </div>

              {/* Co-ownership View Mode Switcher Tabs */}
              {isCoOwnership && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    backgroundColor: "#F1F5F9",
                    padding: "0.3rem",
                    borderRadius: "0.75rem",
                    width: "fit-content",
                    margin: "0 auto",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setActivePlanView("global")}
                    style={{
                      padding: "0.5rem 1.15rem",
                      borderRadius: "0.55rem",
                      border: "none",
                      backgroundColor: activePlanView === "global" ? "#FFFFFF" : "transparent",
                      color: activePlanView === "global" ? "var(--devio-blue-dark)" : "var(--devio-neutral-4)",
                      fontSize: "0.84rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      boxShadow: activePlanView === "global" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Building2 size={15} />
                    Plan Global de la Propiedad (100%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePlanView("co_owners")}
                    style={{
                      padding: "0.5rem 1.15rem",
                      borderRadius: "0.55rem",
                      border: "none",
                      backgroundColor: activePlanView === "co_owners" ? "#FFFFFF" : "transparent",
                      color: activePlanView === "co_owners" ? "var(--devio-green)" : "var(--devio-neutral-4)",
                      fontSize: "0.84rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      boxShadow: activePlanView === "co_owners" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Users size={15} />
                    Desglose Proporcional por Copropietario ({allOwnersCombined.length})
                  </button>
                </div>
              )}

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
              </div>

              {/* SUB-VIEW 1: VISTA PROPORCIONAL POR COPROPIETARIO */}
              {isCoOwnership && activePlanView === "co_owners" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {/* Co-owners Proportional Summary Cards */}
                  <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(allOwnersCombined.length, 3)}, 1fr)`, gap: "0.85rem" }}>
                    {allOwnersCombined.map((owner, idx) => {
                      const pct = Number(owner.ownershipPct) || 0;
                      const ownerTotal = Math.round(netTotalSaleAmount * (pct / 100));
                      const ownerDown = Math.round(Math.round(netTotalSaleAmount * (downPaymentPct / 100)) * (pct / 100));
                      const ownerLiquidation = Math.round(Math.round(netTotalSaleAmount * (balloonLiquidationPct / 100)) * (pct / 100));
                      const ownerInstallmentTotal = Math.max(0, ownerTotal - ownerDown - ownerLiquidation);
                      const ownerPerInstallment = installmentsCount > 0 ? Math.round((ownerInstallmentTotal / installmentsCount) * 100) / 100 : 0;

                      const colors = ["#2F80ED", "#00C48C", "#F2994A", "#9B51E0"];
                      const themeColor = colors[idx % colors.length];

                      return (
                        <div
                          key={owner.id}
                          style={{
                            backgroundColor: "#FFFFFF",
                            borderRadius: "0.85rem",
                            border: `1.5px solid ${themeColor}40`,
                            padding: "1rem",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.6rem",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <strong style={{ fontSize: "0.92rem", color: "var(--devio-blue-dark)", display: "block" }}>
                                {owner.name || `Copropietario ${idx + 1}`}
                              </strong>
                              <span style={{ fontSize: "0.74rem", color: "var(--devio-neutral-3)" }}>
                                {owner.isPrimary ? "Titular Principal" : "Copropietario"}
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: "0.78rem",
                                fontWeight: 800,
                                padding: "0.2rem 0.6rem",
                                borderRadius: "9999px",
                                backgroundColor: `${themeColor}15`,
                                color: themeColor,
                              }}
                            >
                              {pct}%
                            </span>
                          </div>

                          <div style={{ borderTop: "1px solid var(--devio-neutral-1)", paddingTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                              <span style={{ color: "var(--devio-neutral-3)" }}>Monto Total:</span>
                              <strong style={{ color: "var(--devio-blue-dark)" }}>{formatMoney(ownerTotal)}</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                              <span style={{ color: "var(--devio-neutral-3)" }}>Enganche ({downPaymentPct}%):</span>
                              <strong style={{ color: "#2F80ED" }}>{formatMoney(ownerDown)}</strong>
                            </div>
                            {paymentType === "ESQUEMA" && installmentsCount > 0 && (
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                                <span style={{ color: "var(--devio-neutral-3)" }}>Cuotas ({installmentsCount} {periodicity}s):</span>
                                <strong style={{ color: "#D97706" }}>{formatMoney(ownerPerInstallment)} c/u</strong>
                              </div>
                            )}
                            {paymentType === "ESQUEMA" && balloonLiquidationPct > 0 && (
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                                <span style={{ color: "var(--devio-neutral-3)" }}>Liquidación ({balloonLiquidationPct}%):</span>
                                <strong style={{ color: "#00C48C" }}>{formatMoney(ownerLiquidation)}</strong>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Comparative Proportional Schedule Table */}
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
                        Calendario Desglosado por Copropietario ({paymentSchedule.length} exhibiciones)
                      </h4>
                      <span style={{ fontSize: "0.75rem", color: "var(--devio-neutral-3)" }}>
                        Cada copropietario cubre el % patrimonial asignado
                      </span>
                    </div>

                    <div style={{ maxHeight: "360px", overflowY: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                        <thead>
                          <tr style={{ backgroundColor: "#FAFBFD", borderBottom: "1px solid var(--devio-neutral-1)", textAlign: "left" }}>
                            <th style={{ padding: "0.6rem 0.5rem", color: "var(--devio-neutral-3)", width: "30px", textAlign: "center" }}>#</th>
                            <th style={{ padding: "0.6rem 0.65rem", color: "var(--devio-neutral-3)" }}>Concepto</th>
                            <th style={{ padding: "0.6rem 0.65rem", color: "var(--devio-neutral-3)" }}>Fecha</th>
                            <th style={{ padding: "0.6rem 0.65rem", color: "var(--devio-neutral-3)", textAlign: "right" }}>Total Global</th>
                            {allOwnersCombined.map((owner) => (
                              <th key={owner.id} style={{ padding: "0.6rem 0.65rem", color: "var(--devio-blue-dark)", textAlign: "right" }}>
                                {owner.name || "Copropietario"} ({owner.ownershipPct}%)
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {paymentSchedule.map((row, idx) => (
                            <tr key={row.id ? `${row.id}-${idx}` : idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                              <td style={{ padding: "0.55rem 0.4rem", textAlign: "center", fontWeight: 700, color: "var(--devio-neutral-3)" }}>
                                {idx + 1}
                              </td>
                              <td style={{ padding: "0.55rem 0.65rem", fontWeight: 600, color: "var(--devio-blue-dark)" }}>
                                {row.concept}
                              </td>
                              <td style={{ padding: "0.55rem 0.65rem", color: "var(--devio-neutral-4)" }}>
                                {row.date}
                              </td>
                              <td style={{ padding: "0.55rem 0.65rem", textAlign: "right", fontWeight: 700, color: "var(--devio-blue-dark)" }}>
                                {formatMoney(row.amount)}
                              </td>
                              {allOwnersCombined.map((owner) => {
                                const ownerShare = Math.round(row.amount * (Number(owner.ownershipPct || 0) / 100));
                                return (
                                  <td key={owner.id} style={{ padding: "0.55rem 0.65rem", textAlign: "right", fontWeight: 700, color: "var(--devio-green)" }}>
                                    {formatMoney(ownerShare)}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr style={{ backgroundColor: "#FAFBFD", borderTop: "1.5px solid var(--devio-neutral-2)", fontWeight: 800 }}>
                            <td colSpan={3} style={{ padding: "0.75rem 0.65rem", textAlign: "right", color: "var(--devio-blue-dark)" }}>
                              Total Acumulado:
                            </td>
                            <td style={{ padding: "0.75rem 0.65rem", textAlign: "right", color: "var(--devio-blue-dark)", fontSize: "0.9rem" }}>
                              {formatMoney(totalScheduleSum)}
                            </td>
                            {allOwnersCombined.map((owner) => {
                              const ownerTotalSum = Math.round(totalScheduleSum * (Number(owner.ownershipPct || 0) / 100));
                              return (
                                <td key={owner.id} style={{ padding: "0.75rem 0.65rem", textAlign: "right", color: "var(--devio-green)", fontSize: "0.9rem" }}>
                                  {formatMoney(ownerTotalSum)}
                                </td>
                              );
                            })}
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                /* SUB-VIEW 2: VISTA GLOBAL REGULAR DEL CALENDARIO */
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
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
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        {!isScheduleBalanced && (
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--devio-red)" }}>
                            Diferencia: {formatMoney(scheduleDifference)}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={handleAddRowAtEnd}
                          style={{
                            fontSize: "0.75rem",
                            padding: "0.3rem 0.75rem",
                            borderRadius: "0.4rem",
                            backgroundColor: "#EFF6FF",
                            border: "1px solid #BFDBFE",
                            fontWeight: 700,
                            cursor: "pointer",
                            color: "#1D4ED8",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                          }}
                          title="Agregar una nueva cuota al final"
                        >
                          <Plus size={13} /> Agregar Cuota
                        </button>
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

                    <div style={{ maxHeight: "320px", overflowY: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                        <thead>
                          <tr style={{ backgroundColor: "#FAFBFD", borderBottom: "1px solid var(--devio-neutral-1)", textAlign: "left" }}>
                            <th style={{ padding: "0.6rem 0.6rem", color: "var(--devio-neutral-3)", width: "35px", textAlign: "center" }}>#</th>
                            <th style={{ padding: "0.6rem 0.75rem", color: "var(--devio-neutral-3)" }}>Concepto del Pago</th>
                            <th style={{ padding: "0.6rem 0.75rem", color: "var(--devio-neutral-3)" }}>Fecha de Pago</th>
                            <th style={{ padding: "0.6rem 0.75rem", color: "var(--devio-neutral-3)", textAlign: "right" }}>Monto</th>
                            <th style={{ padding: "0.6rem 0.6rem", color: "var(--devio-neutral-3)", textAlign: "center", width: "85px" }}>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paymentSchedule.map((row, idx) => (
                            <tr key={row.id ? `${row.id}-${idx}` : idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                              <td style={{ padding: "0.55rem 0.4rem", textAlign: "center", fontWeight: 700, color: "var(--devio-neutral-3)", fontSize: "0.78rem" }}>
                                {idx + 1}
                              </td>
                              <td style={{ padding: "0.55rem 0.75rem", minWidth: "170px" }}>
                                <input
                                  type="text"
                                  value={row.concept}
                                  onChange={(e) => handleUpdateRowConcept(row.id, e.target.value)}
                                  placeholder={`Concepto (ej. Cuota ${idx + 1})`}
                                  style={{
                                    width: "100%",
                                    padding: "0.45rem 0.65rem",
                                    borderRadius: "0.45rem",
                                    border: "1px solid var(--devio-neutral-2)",
                                    fontSize: "0.82rem",
                                    fontWeight: 600,
                                    color: "var(--devio-blue-dark)",
                                    backgroundColor: "var(--devio-white)",
                                    outline: "none",
                                  }}
                                />
                              </td>
                              <td style={{ padding: "0.55rem 0.75rem", minWidth: "155px" }}>
                                <DevioDatePicker
                                  value={row.date}
                                  minDate={idx === 0 ? saleDate : paymentSchedule[idx - 1]?.date}
                                  onChange={(val) => handleUpdateRowDate(row.id, val)}
                                  showPresets={false}
                                  placeholder="Seleccionar"
                                />
                              </td>
                              <td style={{ padding: "0.55rem 0.75rem", textAlign: "right" }}>
                                <CurrencyInput
                                  value={row.amount}
                                  onChange={(newVal) => handleUpdateRowAmount(row.id, newVal)}
                                  style={{ width: "140px" }}
                                />
                              </td>
                              <td style={{ padding: "0.55rem 0.5rem", textAlign: "center" }}>
                                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                                  <button
                                    type="button"
                                    onClick={() => handleAddRowAfter(idx)}
                                    title="Insertar cuota debajo"
                                    style={{
                                      background: "#EFF6FF",
                                      border: "1px solid #BFDBFE",
                                      color: "#2563EB",
                                      cursor: "pointer",
                                      width: "28px",
                                      height: "28px",
                                      borderRadius: "6px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      transition: "all 0.15s ease",
                                    }}
                                  >
                                    <Plus size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRow(row.id)}
                                    title="Eliminar esta cuota"
                                    style={{
                                      background: "#FEF2F2",
                                      border: "1px solid #FECACA",
                                      color: "#EF4444",
                                      cursor: "pointer",
                                      width: "28px",
                                      height: "28px",
                                      borderRadius: "6px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      transition: "all 0.15s ease",
                                    }}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
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
                  {isCoOwnership
                    ? "Configura la modalidad de pago del enganche, comprobantes y notificaciones por correo de manera individual para cada copropietario."
                    : "Registra el comprobante del enganche o primer pago para activar el expediente y expedir contratos."}
                </p>
              </div>

              {/* Final Summary Card Header */}
              <div
                style={{
                  backgroundColor: "var(--devio-white)",
                  borderRadius: "1rem",
                  border: "1.5px solid var(--devio-neutral-1)",
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.25rem",
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

                {/* ========================================================== */}
                {/* COPROPIEDAD STEP 5: SECCIÓN INDIVIDUAL POR COPROPIETARIO */}
                {/* ========================================================== */}
                {isCoOwnership ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--devio-blue-dark)", textTransform: "uppercase" }}>
                        👥 Pago Inicial y Notificaciones por Copropietario ({allOwnersCombined.length}):
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "var(--devio-neutral-3)" }}>
                        Enganche Total Unidad: <strong>{formatMoney(paymentSchedule[0]?.amount || Math.round(netTotalSaleAmount * (downPaymentPct / 100)))}</strong>
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {allOwnersCombined.map((owner, idx) => {
                        const ownerKey = owner.id || owner.email || owner.name;
                        const cfg = coOwnerPaymentSettings[ownerKey] || coOwnerPaymentSettings[owner.id] || {
                          id: owner.id,
                          name: owner.name,
                          email: owner.email,
                          phone: owner.phone,
                          rfc: owner.rfc,
                          ownershipPct: owner.ownershipPct,
                          paymentOption: "FULL" as const,
                          paymentAmount: Math.round((paymentSchedule[0]?.amount || Math.round(netTotalSaleAmount * (downPaymentPct / 100))) * (Number(owner.ownershipPct || 0) / 100)),
                          paymentMethod: "transferencia",
                          paymentReference: "",
                          sendCredentials: true,
                          sendSaleConfirmationEmail: true,
                          sendReceiptEmail: true,
                        };

                        const totalDown = paymentSchedule[0]?.amount || Math.round(netTotalSaleAmount * (downPaymentPct / 100));
                        const expectedOwnerDown = Math.round(totalDown * (Number(owner.ownershipPct || 0) / 100));

                        const updateOwnerSetting = (field: keyof CoOwnerPaymentConfig, val: any) => {
                          setCoOwnerPaymentSettings((prev) => ({
                            ...prev,
                            [ownerKey]: {
                              ...(prev[ownerKey] || cfg),
                              [field]: val,
                            },
                          }));
                        };

                        const colors = ["#2F80ED", "#00C48C", "#F2994A", "#9B51E0"];
                        const themeColor = colors[idx % colors.length];

                        return (
                          <div
                            key={owner.id}
                            style={{
                              backgroundColor: "#F8FAFC",
                              borderRadius: "0.85rem",
                              border: `1.5px solid ${themeColor}50`,
                              padding: "1rem 1.15rem",
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.85rem",
                            }}
                          >
                            {/* Card Header */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <div
                                  style={{
                                    width: "30px",
                                    height: "30px",
                                    borderRadius: "50%",
                                    backgroundColor: `${themeColor}20`,
                                    color: themeColor,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: 800,
                                    fontSize: "0.82rem",
                                  }}
                                >
                                  {idx + 1}
                                </div>
                                <div>
                                  <strong style={{ fontSize: "0.92rem", color: "var(--devio-blue-dark)" }}>
                                    {owner.name || `Copropietario ${idx + 1}`}
                                  </strong>
                                  <span style={{ fontSize: "0.75rem", color: "var(--devio-neutral-3)", marginLeft: "0.4rem" }}>
                                    ({owner.email || "Sin correo"})
                                  </span>
                                </div>
                              </div>

                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <span style={{ fontSize: "0.76rem", color: "var(--devio-neutral-3)" }}>
                                  Enganche Proporcional: <strong style={{ color: "var(--devio-blue-dark)" }}>{formatMoney(expectedOwnerDown)}</strong>
                                </span>
                                <span
                                  style={{
                                    fontSize: "0.75rem",
                                    fontWeight: 800,
                                    padding: "0.2rem 0.55rem",
                                    borderRadius: "9999px",
                                    backgroundColor: `${themeColor}15`,
                                    color: themeColor,
                                  }}
                                >
                                  {owner.ownershipPct}%
                                </span>
                              </div>
                            </div>

                            {/* Modalidad de Pago Inicial del Copropietario */}
                            <div>
                              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.3rem" }}>
                                Modalidad de Pago de Enganche para {owner.name || "este copropietario"}:
                              </label>
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.6rem" }}>
                                {/* Option 1: Full */}
                                <div
                                  onClick={() => {
                                    updateOwnerSetting("paymentOption", "FULL");
                                    updateOwnerSetting("paymentAmount", expectedOwnerDown);
                                  }}
                                  style={{
                                    padding: "0.65rem 0.75rem",
                                    borderRadius: "0.6rem",
                                    border: cfg.paymentOption === "FULL" ? `2px solid ${themeColor}` : "1px solid var(--devio-neutral-2)",
                                    backgroundColor: cfg.paymentOption === "FULL" ? `${themeColor}10` : "#FFFFFF",
                                    cursor: "pointer",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "0.2rem",
                                    transition: "all 0.15s ease",
                                  }}
                                >
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <strong style={{ fontSize: "0.8rem", color: "var(--devio-blue-dark)" }}>Pago Total Enganche</strong>
                                    <input
                                      type="radio"
                                      name={`co_pay_opt_${owner.id}`}
                                      checked={cfg.paymentOption === "FULL"}
                                      onChange={() => {}}
                                      style={{ accentColor: themeColor }}
                                    />
                                  </div>
                                  <span style={{ fontSize: "0.72rem", color: "var(--devio-neutral-3)" }}>
                                    {formatMoney(expectedOwnerDown)}
                                  </span>
                                </div>

                                {/* Option 2: Partial */}
                                <div
                                  onClick={() => {
                                    updateOwnerSetting("paymentOption", "PARTIAL");
                                  }}
                                  style={{
                                    padding: "0.65rem 0.75rem",
                                    borderRadius: "0.6rem",
                                    border: cfg.paymentOption === "PARTIAL" ? `2px solid ${themeColor}` : "1px solid var(--devio-neutral-2)",
                                    backgroundColor: cfg.paymentOption === "PARTIAL" ? `${themeColor}10` : "#FFFFFF",
                                    cursor: "pointer",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "0.2rem",
                                    transition: "all 0.15s ease",
                                  }}
                                >
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <strong style={{ fontSize: "0.8rem", color: "var(--devio-blue-dark)" }}>Pago Parcial</strong>
                                    <input
                                      type="radio"
                                      name={`co_pay_opt_${owner.id}`}
                                      checked={cfg.paymentOption === "PARTIAL"}
                                      onChange={() => {}}
                                      style={{ accentColor: themeColor }}
                                    />
                                  </div>
                                  <span style={{ fontSize: "0.72rem", color: "var(--devio-neutral-3)" }}>
                                    Monto a cuenta
                                  </span>
                                </div>

                                {/* Option 3: None */}
                                <div
                                  onClick={() => {
                                    updateOwnerSetting("paymentOption", "NONE");
                                    updateOwnerSetting("paymentAmount", 0);
                                  }}
                                  style={{
                                    padding: "0.65rem 0.75rem",
                                    borderRadius: "0.6rem",
                                    border: cfg.paymentOption === "NONE" ? `2px solid ${themeColor}` : "1px solid var(--devio-neutral-2)",
                                    backgroundColor: cfg.paymentOption === "NONE" ? `${themeColor}10` : "#FFFFFF",
                                    cursor: "pointer",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "0.2rem",
                                    transition: "all 0.15s ease",
                                  }}
                                >
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <strong style={{ fontSize: "0.8rem", color: "var(--devio-blue-dark)" }}>Sin Pago Inicial</strong>
                                    <input
                                      type="radio"
                                      name={`co_pay_opt_${owner.id}`}
                                      checked={cfg.paymentOption === "NONE"}
                                      onChange={() => {}}
                                      style={{ accentColor: themeColor }}
                                    />
                                  </div>
                                  <span style={{ fontSize: "0.72rem", color: "var(--devio-neutral-3)" }}>
                                    $0 (Cobro posterior)
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Payment details if option !== "NONE" */}
                            {cfg.paymentOption !== "NONE" && (
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.65rem", backgroundColor: "#FFFFFF", padding: "0.75rem", borderRadius: "0.6rem", border: "1px solid var(--devio-neutral-1)" }}>
                                <div>
                                  <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.2rem" }}>
                                    Monto a Pagar
                                  </label>
                                  <CurrencyInput
                                    value={cfg.paymentAmount}
                                    disabled={cfg.paymentOption === "FULL"}
                                    onChange={(newVal) => updateOwnerSetting("paymentAmount", newVal)}
                                    style={{ width: "100%", padding: "0.2rem 0.4rem" }}
                                  />
                                </div>

                                <div>
                                  <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.2rem" }}>
                                    Método de Pago
                                  </label>
                                  <select
                                    value={cfg.paymentMethod}
                                    onChange={(e) => updateOwnerSetting("paymentMethod", e.target.value)}
                                    style={{
                                      width: "100%",
                                      padding: "0.5rem 0.65rem",
                                      borderRadius: "0.45rem",
                                      border: "1px solid var(--devio-neutral-2)",
                                      fontSize: "0.8rem",
                                      backgroundColor: "#FFFFFF",
                                    }}
                                  >
                                    <option value="transferencia">Transferencia SPEI</option>
                                    <option value="tarjeta">Tarjeta Bancaria</option>
                                    <option value="cheque">Cheque de Caja</option>
                                    <option value="deposito">Depósito Bancario</option>
                                    <option value="efectivo">Efectivo</option>
                                  </select>
                                </div>

                                <div>
                                  <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.2rem" }}>
                                    Referencia / Folio
                                  </label>
                                  <input
                                    type="text"
                                    value={cfg.paymentReference}
                                    onChange={(e) => updateOwnerSetting("paymentReference", e.target.value)}
                                    placeholder="Ej. SPEI-8938493"
                                    style={{
                                      width: "100%",
                                      padding: "0.5rem 0.65rem",
                                      borderRadius: "0.45rem",
                                      border: "1px solid var(--devio-neutral-2)",
                                      fontSize: "0.8rem",
                                      backgroundColor: "#FFFFFF",
                                    }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Notifications Checkboxes per co-owner */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", borderTop: "1px solid var(--devio-neutral-1)", paddingTop: "0.5rem" }}>
                              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--devio-neutral-4)", textTransform: "uppercase" }}>
                                Correos para {owner.name || "este comprador"}:
                              </span>

                              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
                                <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.76rem", cursor: "pointer", color: "var(--devio-blue-dark)" }}>
                                  <input
                                    type="checkbox"
                                    checked={cfg.sendCredentials}
                                    onChange={(e) => updateOwnerSetting("sendCredentials", e.target.checked)}
                                    style={{ accentColor: themeColor }}
                                  />
                                  <span>🔑 Credenciales Portal</span>
                                </label>

                                <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.76rem", cursor: "pointer", color: "var(--devio-blue-dark)" }}>
                                  <input
                                    type="checkbox"
                                    checked={cfg.sendSaleConfirmationEmail}
                                    onChange={(e) => updateOwnerSetting("sendSaleConfirmationEmail", e.target.checked)}
                                    style={{ accentColor: themeColor }}
                                  />
                                  <span>📄 Confirmación de Venta y Contrato</span>
                                </label>

                                <label
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.4rem",
                                    fontSize: "0.76rem",
                                    cursor: cfg.paymentOption === "NONE" ? "not-allowed" : "pointer",
                                    opacity: cfg.paymentOption === "NONE" ? 0.5 : 1,
                                    color: "var(--devio-blue-dark)",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    disabled={cfg.paymentOption === "NONE"}
                                    checked={cfg.paymentOption !== "NONE" && cfg.sendReceiptEmail}
                                    onChange={(e) => updateOwnerSetting("sendReceiptEmail", e.target.checked)}
                                    style={{ accentColor: "var(--devio-green)" }}
                                  />
                                  <span>🧾 Recibo de Pago de Enganche</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Co-ownership Initial Payments Total Footer */}
                    <div
                      style={{
                        backgroundColor: "#FAFBFD",
                        borderRadius: "0.75rem",
                        padding: "0.85rem 1.15rem",
                        border: "1px solid var(--devio-neutral-2)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                      }}
                    >
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--devio-blue-dark)" }}>
                        Total de Pagos de Enganche a Registrar Hoy:
                      </span>
                      <strong style={{ fontSize: "1.05rem", color: "var(--devio-green)" }}>
                        {formatMoney(
                          allOwnersCombined.reduce((sum, owner) => {
                            const ownerKey = owner.id || owner.email || owner.name;
                            const cfg = coOwnerPaymentSettings[ownerKey] || coOwnerPaymentSettings[owner.id];
                            return sum + (cfg?.paymentOption === "NONE" ? 0 : (Number(cfg?.paymentAmount) || 0));
                          }, 0)
                        )}
                      </strong>
                    </div>
                  </div>
                ) : (
                  /* ========================================================== */
                  /* PROPIETARIO ÚNICO STEP 5 */
                  /* ========================================================== */
                  <>
                    {/* Buyers & Shares Breakdown */}
                    <div>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--devio-neutral-3)", textTransform: "uppercase", display: "block", marginBottom: "0.35rem" }}>
                        Comprador Registrado:
                      </span>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                        <div
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
                            <strong style={{ color: "var(--devio-blue-dark)" }}>{primaryClient.name}</strong>
                            <span style={{ color: "var(--devio-neutral-3)" }}>({primaryClient.email})</span>
                          </div>
                          <span style={{ fontWeight: 800, color: "var(--devio-blue)" }}>
                            100% de la propiedad
                          </span>
                        </div>
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

                      {/* Checkbox 1: Credenciales de Acceso */}
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.6rem",
                          padding: "0.65rem 0.85rem",
                          borderRadius: "0.6rem",
                          backgroundColor: "rgba(111, 172, 156, 0.1)",
                          border: "1.5px solid rgba(111, 172, 156, 0.35)",
                          cursor: "pointer",
                          fontSize: "0.82rem",
                          fontWeight: 600,
                          color: "var(--devio-blue-dark)",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={sendCredentialsToAll}
                          onChange={(e) => setSendCredentialsToAll(e.target.checked)}
                          style={{ width: "16px", height: "16px", accentColor: "var(--devio-green)" }}
                        />
                        <span>
                          🔑 <strong>Credenciales de Acceso:</strong> Enviar correo de bienvenida con usuario y contraseña temporal al Portal de Clientes.
                        </span>
                      </label>

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
                  </>
                )}
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
              disabled={currentStep === 1 && isCoOwnership && !isOwnershipBalanced}
              onClick={() => {
                if (currentStep === 1) {
                  if (!primaryClient.email.trim() || !primaryClient.name.trim()) {
                    alert("Por favor completa los datos del titular principal.");
                    return;
                  }
                  if (isCoOwnership) {
                    const incompleteCoOwner = coOwnersList.find((co) => !co.email?.trim() || !co.name?.trim());
                    if (incompleteCoOwner) {
                      alert("Por favor completa el correo y nombre de todos los copropietarios.");
                      return;
                    }
                    if (!isOwnershipBalanced) {
                      alert(`El porcentaje total de copropiedad debe sumar exactamente 100%. Actualmente suma ${totalOwnershipPct}%.`);
                      return;
                    }
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
                backgroundColor: (currentStep === 1 && isCoOwnership && !isOwnershipBalanced) ? "var(--devio-neutral-2)" : "var(--devio-blue-dark)",
                color: (currentStep === 1 && isCoOwnership && !isOwnershipBalanced) ? "var(--devio-neutral-3)" : "var(--devio-white)",
                fontSize: "0.875rem",
                fontWeight: 700,
                border: "none",
                cursor: (currentStep === 1 && isCoOwnership && !isOwnershipBalanced) ? "not-allowed" : "pointer",
                opacity: (currentStep === 1 && isCoOwnership && !isOwnershipBalanced) ? 0.6 : 1,
                transition: "all 0.15s ease",
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
                        step="any"
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
                        step="any"
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
                        step="any"
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
                        step="any"
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
                    step="any"
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
